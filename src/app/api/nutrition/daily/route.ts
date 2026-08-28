import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDateRange(dateParam?: string | null) {
  let targetDate: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [year, month, day] = dateParam.split("-").map((n) => parseInt(n, 10));
    targetDate = new Date(year, month - 1, day);
  } else {
    targetDate = new Date();
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Format as YYYY-MM-DD
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  return { startOfDay, endOfDay, formattedDate };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");
    const dateParam = searchParams.get("date"); // e.g. "2026-08-28"

    let clientIdToFetch = user.id;

    if (targetClientId && targetClientId !== user.id) {
      if (user.role !== "TRAINER" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (user.role === "TRAINER") {
        if (!user.trainerProfile) {
          return NextResponse.json({ error: "Trainer profile not found." }, { status: 403 });
        }

        const activeRelationship = await prisma.coachingRequest.findFirst({
          where: {
            trainerId: user.trainerProfile.id,
            clientId: targetClientId,
            status: "ACCEPTED",
          },
        });

        if (!activeRelationship) {
          return NextResponse.json(
            { error: "Forbidden: You are not authorized to view this client's nutrition." },
            { status: 403 }
          );
        }
      }

      clientIdToFetch = targetClientId;
    }

    const { startOfDay, endOfDay, formattedDate } = parseDateRange(dateParam);

    // Fetch active nutrition plan
    const activePlan = await prisma.nutritionPlan.findFirst({
      where: {
        clientId: clientIdToFetch,
        isActive: true,
      },
      include: {
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Fetch food logs for this specific date
    const foodLogs = await prisma.foodLog.findMany({
      where: {
        clientId: clientIdToFetch,
        loggedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch water logs for this specific date
    const waterLogs = await prisma.waterLog.findMany({
      where: {
        clientId: clientIdToFetch,
        loggedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Server-side calculation of consumed totals from stored logs ONLY
    const consumedCalories = Math.round(
      foodLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0)
    );
    const consumedProtein = Math.round(
      foodLogs.reduce((acc, curr) => acc + (curr.protein || 0), 0) * 10
    ) / 10;
    const consumedCarbs = Math.round(
      foodLogs.reduce((acc, curr) => acc + (curr.carbohydrates || 0), 0) * 10
    ) / 10;
    const consumedFat = Math.round(
      foodLogs.reduce((acc, curr) => acc + (curr.fat || 0), 0) * 10
    ) / 10;
    const consumedFiber = Math.round(
      foodLogs.reduce((acc, curr) => acc + (curr.fiber || 0), 0) * 10
    ) / 10;
    const consumedWater = Math.round(
      waterLogs.reduce((acc, curr) => acc + (curr.amountLiters || 0), 0) * 10
    ) / 10;

    // Group foods by meal type
    const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];
    const mealsByType: Record<string, { foods: typeof foodLogs; calories: number; protein: number; carbs: number; fat: number }> = {};

    mealTypes.forEach((mt) => {
      const foods = foodLogs.filter((f) => f.mealType === mt);
      mealsByType[mt] = {
        foods,
        calories: Math.round(foods.reduce((acc, f) => acc + f.calories, 0)),
        protein: Math.round(foods.reduce((acc, f) => acc + f.protein, 0) * 10) / 10,
        carbs: Math.round(foods.reduce((acc, f) => acc + f.carbohydrates, 0) * 10) / 10,
        fat: Math.round(foods.reduce((acc, f) => acc + f.fat, 0) * 10) / 10,
      };
    });

    // Targets & Remaining calculation
    const targets = activePlan
      ? {
          calories: activePlan.dailyCalories,
          protein: activePlan.proteinGrams,
          carbs: activePlan.carbsGrams,
          fat: activePlan.fatGrams,
          fiber: activePlan.fiberGrams,
          water: activePlan.waterLiters,
        }
      : null;

    const remaining = targets
      ? {
          calories: Math.max(0, targets.calories - consumedCalories),
          protein: Math.max(0, Math.round((targets.protein - consumedProtein) * 10) / 10),
          carbs: Math.max(0, Math.round((targets.carbs - consumedCarbs) * 10) / 10),
          fat: Math.max(0, Math.round((targets.fat - consumedFat) * 10) / 10),
          fiber: Math.max(0, Math.round((targets.fiber - consumedFiber) * 10) / 10),
          water: Math.max(0, Math.round((targets.water - consumedWater) * 10) / 10),
          overCalories: Math.max(0, consumedCalories - targets.calories),
          overProtein: Math.max(0, Math.round((consumedProtein - targets.protein) * 10) / 10),
          overCarbs: Math.max(0, Math.round((consumedCarbs - targets.carbs) * 10) / 10),
          overFat: Math.max(0, Math.round((consumedFat - targets.fat) * 10) / 10),
          overWater: Math.max(0, Math.round((consumedWater - targets.water) * 10) / 10),
        }
      : null;

    // Percentages (uncapped for true representation)
    const percentages = targets
      ? {
          calories: targets.calories > 0 ? Math.round((consumedCalories / targets.calories) * 100) : 0,
          protein: targets.protein > 0 ? Math.round((consumedProtein / targets.protein) * 100) : 0,
          carbs: targets.carbs > 0 ? Math.round((consumedCarbs / targets.carbs) * 100) : 0,
          fat: targets.fat > 0 ? Math.round((consumedFat / targets.fat) * 100) : 0,
          fiber: targets.fiber > 0 ? Math.round((consumedFiber / targets.fiber) * 100) : 0,
          water: targets.water > 0 ? Math.round((consumedWater / targets.water) * 100) : 0,
        }
      : null;

    // Deterministic Adherence Calculation:
    // When no logs exist, score is 0.
    let dailyAdherenceScore = 0;
    if (targets && foodLogs.length > 0) {
      const calRatio = targets.calories > 0 ? consumedCalories / targets.calories : 0;
      if (calRatio >= 0.9 && calRatio <= 1.1) {
        dailyAdherenceScore += 40;
      } else if (calRatio > 0) {
        const diff = Math.abs(1 - calRatio);
        dailyAdherenceScore += Math.max(0, Math.round((1 - diff) * 40));
      }

      const proteinRatio = targets.protein > 0 ? consumedProtein / targets.protein : 0;
      dailyAdherenceScore += Math.min(35, Math.round(proteinRatio * 35));

      const waterRatio = targets.water > 0 ? consumedWater / targets.water : 0;
      dailyAdherenceScore += Math.min(15, Math.round(waterRatio * 15));

      const distinctMealTypesCount = Object.values(mealsByType).filter((m) => m.foods.length > 0).length;
      if (distinctMealTypesCount >= 2) dailyAdherenceScore += 10;
      else if (distinctMealTypesCount === 1) dailyAdherenceScore += 5;
    }

    dailyAdherenceScore = Math.min(100, Math.max(0, dailyAdherenceScore));

    // Fetch workout completion status for this day
    const workoutLogToday = await prisma.workoutLog.findFirst({
      where: {
        clientId: clientIdToFetch,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        workoutName: true,
        completionRate: true,
        durationMinutes: true,
        totalVolume: true,
        isPersonalBest: true,
      },
    });

    return NextResponse.json({
      success: true,
      date: formattedDate,
      activePlan,
      targets,
      consumed: {
        calories: consumedCalories,
        protein: consumedProtein,
        carbohydrates: consumedCarbs,
        fat: consumedFat,
        fiber: consumedFiber,
        water: consumedWater,
      },
      remaining,
      percentages,
      dailyAdherenceScore,
      mealsByType,
      foodLogs,
      waterLogs,
      workoutSummary: workoutLogToday || null,
    });
  } catch (error: any) {
    console.error("Error fetching daily nutrition:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch daily nutrition data." },
      { status: 500 }
    );
  }
}
