import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          clientId: clientId,
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

    // Fetch client details
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    // Fetch active plan
    const activePlan = await prisma.nutritionPlan.findFirst({
      where: {
        clientId: clientId,
        isActive: true,
      },
      include: {
        targetHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // Fetch today's food & water logs
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayFoods, todayWater, recentFoods] = await Promise.all([
      prisma.foodLog.findMany({
        where: {
          clientId: clientId,
          loggedDate: { gte: startOfToday },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.waterLog.findMany({
        where: {
          clientId: clientId,
          loggedDate: { gte: startOfToday },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.foodLog.findMany({
        where: { clientId: clientId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const todayCalories = Math.round(todayFoods.reduce((acc, curr) => acc + curr.calories, 0));
    const todayProtein = Math.round(todayFoods.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;
    const todayCarbs = Math.round(todayFoods.reduce((acc, curr) => acc + curr.carbohydrates, 0) * 10) / 10;
    const todayFat = Math.round(todayFoods.reduce((acc, curr) => acc + curr.fat, 0) * 10) / 10;
    const todayWaterLiters = Math.round(todayWater.reduce((acc, curr) => acc + curr.amountLiters, 0) * 10) / 10;

    // 7-day adherence calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const foodLogs7Days = await prisma.foodLog.findMany({
      where: {
        clientId: clientId,
        loggedDate: { gte: sevenDaysAgo },
      },
    });

    const waterLogs7Days = await prisma.waterLog.findMany({
      where: {
        clientId: clientId,
        loggedDate: { gte: sevenDaysAgo },
      },
    });

    let cumulativeAdherence = 0;
    let daysWithLogs = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStart = new Date(d);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const dFoods = foodLogs7Days.filter((f) => f.loggedDate >= dStart && f.loggedDate <= dEnd);
      const dWater = waterLogs7Days.filter((w) => w.loggedDate >= dStart && w.loggedDate <= dEnd);

      if (dFoods.length > 0) {
        daysWithLogs++;
        const dCal = dFoods.reduce((acc, f) => acc + f.calories, 0);
        const dProt = dFoods.reduce((acc, f) => acc + f.protein, 0);
        const dW = dWater.reduce((acc, w) => acc + w.amountLiters, 0);

        const targetCal = activePlan?.dailyCalories || 2000;
        const targetProt = activePlan?.proteinGrams || 150;
        const targetW = activePlan?.waterLiters || 3.0;

        let score = 0;
        if (dCal >= targetCal * 0.9 && dCal <= targetCal * 1.1) score += 40;
        else if (dCal > 0) score += Math.max(0, Math.round((1 - Math.abs(1 - dCal / targetCal)) * 40));

        score += Math.min(35, Math.round((dProt / targetProt) * 35));
        score += Math.min(15, Math.round((dW / targetW) * 15));
        if (dFoods.length >= 2) score += 10;
        else score += 5;

        cumulativeAdherence += Math.min(100, score);
      }
    }

    const weeklyAdherence = Math.round(cumulativeAdherence / 7);

    return NextResponse.json({
      success: true,
      client,
      activePlan,
      todayIntake: {
        calories: todayCalories,
        protein: todayProtein,
        carbs: todayCarbs,
        fat: todayFat,
        water: todayWaterLiters,
      },
      weeklyAdherence,
      daysLoggedPastWeek: daysWithLogs,
      recentFoods,
      targetHistory: activePlan?.targetHistory || [],
    });
  } catch (error: any) {
    console.error("Error fetching trainer client nutrition:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch client nutrition data." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          clientId: clientId,
          status: "ACCEPTED",
        },
      });

      if (!activeRelationship) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to update this client's nutrition." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      name,
      goal,
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      fiberGrams,
      waterLiters,
      targetWeight,
      trainerNotes,
      changeReason,
    } = body;

    const activePlan = await prisma.nutritionPlan.findFirst({
      where: {
        clientId,
        isActive: true,
      },
    });

    if (!activePlan) {
      return NextResponse.json(
        { error: "No active nutrition plan found to adjust for this client." },
        { status: 404 }
      );
    }

    const updatedPlan = await prisma.nutritionPlan.update({
      where: { id: activePlan.id },
      data: {
        name: name?.trim() || activePlan.name,
        goal: goal || activePlan.goal,
        dailyCalories: dailyCalories !== undefined ? Math.round(Number(dailyCalories)) : activePlan.dailyCalories,
        proteinGrams: proteinGrams !== undefined ? Math.round(Number(proteinGrams) * 10) / 10 : activePlan.proteinGrams,
        carbsGrams: carbsGrams !== undefined ? Math.round(Number(carbsGrams) * 10) / 10 : activePlan.carbsGrams,
        fatGrams: fatGrams !== undefined ? Math.round(Number(fatGrams) * 10) / 10 : activePlan.fatGrams,
        fiberGrams: fiberGrams !== undefined ? Math.round(Number(fiberGrams) * 10) / 10 : activePlan.fiberGrams,
        waterLiters: waterLiters !== undefined ? Math.round(Number(waterLiters) * 10) / 10 : activePlan.waterLiters,
        targetWeight: targetWeight !== undefined ? Number(targetWeight) : activePlan.targetWeight,
        trainerNotes: trainerNotes !== undefined ? trainerNotes?.trim() : activePlan.trainerNotes,
        targetHistory: {
          create: {
            changedById: user.id,
            dailyCalories: dailyCalories !== undefined ? Math.round(Number(dailyCalories)) : activePlan.dailyCalories,
            proteinGrams: proteinGrams !== undefined ? Math.round(Number(proteinGrams) * 10) / 10 : activePlan.proteinGrams,
            carbsGrams: carbsGrams !== undefined ? Math.round(Number(carbsGrams) * 10) / 10 : activePlan.carbsGrams,
            fatGrams: fatGrams !== undefined ? Math.round(Number(fatGrams) * 10) / 10 : activePlan.fatGrams,
            fiberGrams: fiberGrams !== undefined ? Math.round(Number(fiberGrams) * 10) / 10 : activePlan.fiberGrams,
            waterLiters: waterLiters !== undefined ? Math.round(Number(waterLiters) * 10) / 10 : activePlan.waterLiters,
            targetWeight: targetWeight !== undefined ? Number(targetWeight) : activePlan.targetWeight,
            changeReason: changeReason?.trim() || "Trainer target adjustment",
          },
        },
      },
    });

    // Send a message notification to client in chat
    const conv = await prisma.conversation.findFirst({
      where: {
        clientId,
        trainerId: user.trainerProfile ? user.trainerProfile.id : activePlan.trainerId,
      },
    });

    if (conv) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: user.id,
          content: `🎯 Your nutrition targets have been adjusted: ${updatedPlan.dailyCalories} kcal (${updatedPlan.proteinGrams}g Protein • ${updatedPlan.carbsGrams}g Carbs • ${updatedPlan.fatGrams}g Fat). Reason: ${changeReason || "Progression adjustment"}.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Nutrition targets adjusted successfully.",
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error("Error adjusting nutrition targets:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to adjust nutrition targets." },
      { status: 500 }
    );
  }
}
