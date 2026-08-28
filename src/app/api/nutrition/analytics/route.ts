import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");

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
            { error: "Forbidden: You are not authorized to view this client's nutrition analytics." },
            { status: 403 }
          );
        }
      }

      clientIdToFetch = targetClientId;
    }

    // Fetch active plan
    const activePlan = await prisma.nutritionPlan.findFirst({
      where: {
        clientId: clientIdToFetch,
        isActive: true,
      },
    });

    // 7-day date window
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [foodLogs7Days, waterLogs7Days] = await Promise.all([
      prisma.foodLog.findMany({
        where: {
          clientId: clientIdToFetch,
          loggedDate: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: { loggedDate: "asc" },
      }),
      prisma.waterLog.findMany({
        where: {
          clientId: clientIdToFetch,
          loggedDate: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: { loggedDate: "asc" },
      }),
    ]);

    // Build 7-day chronological daily stats
    const dailyAnalytics: {
      date: string;
      dayLabel: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      water: number;
      targetCalories: number;
      targetProtein: number;
      metCalorieTarget: boolean;
      metProteinTarget: boolean;
      metWaterTarget: boolean;
      adherenceScore: number;
    }[] = [];

    let totalCalAcrossDays = 0;
    let totalProteinAcrossDays = 0;
    let totalCarbsAcrossDays = 0;
    let totalFatAcrossDays = 0;
    let totalFiberAcrossDays = 0;
    let totalWaterAcrossDays = 0;
    let daysWithLogs = 0;
    let daysMetCalorieTarget = 0;
    let daysMetProteinTarget = 0;
    let daysMetWaterTarget = 0;
    let cumulativeAdherence = 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = dayNames[d.getDay()];

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayFoods = foodLogs7Days.filter(
        (f) => f.loggedDate >= dayStart && f.loggedDate <= dayEnd
      );
      const dayWater = waterLogs7Days.filter(
        (w) => w.loggedDate >= dayStart && w.loggedDate <= dayEnd
      );

      const dayCal = Math.round(dayFoods.reduce((acc, curr) => acc + curr.calories, 0));
      const dayProt = Math.round(dayFoods.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;
      const dayCarbs = Math.round(dayFoods.reduce((acc, curr) => acc + curr.carbohydrates, 0) * 10) / 10;
      const dayFat = Math.round(dayFoods.reduce((acc, curr) => acc + curr.fat, 0) * 10) / 10;
      const dayFiber = Math.round(dayFoods.reduce((acc, curr) => acc + curr.fiber, 0) * 10) / 10;
      const dayW = Math.round(dayWater.reduce((acc, curr) => acc + curr.amountLiters, 0) * 10) / 10;

      const targetCal = activePlan?.dailyCalories || 2000;
      const targetProt = activePlan?.proteinGrams || 150;
      const targetW = activePlan?.waterLiters || 3.0;

      const metCal = targetCal > 0 && dayCal >= targetCal * 0.9 && dayCal <= targetCal * 1.1;
      const metProt = targetProt > 0 && dayProt >= targetProt * 0.9;
      const metWater = targetW > 0 && dayW >= targetW * 0.8;

      let adherenceScore = 0;
      if (dayFoods.length > 0) {
        daysWithLogs++;
        if (metCal) adherenceScore += 40;
        else if (dayCal > 0) adherenceScore += Math.max(0, Math.round((1 - Math.abs(1 - dayCal / targetCal)) * 40));

        adherenceScore += Math.min(35, Math.round((dayProt / targetProt) * 35));
        adherenceScore += Math.min(15, Math.round((dayW / targetW) * 15));
        if (dayFoods.length >= 2) adherenceScore += 10;
        else adherenceScore += 5;
        adherenceScore = Math.min(100, adherenceScore);
      }

      if (metCal && dayFoods.length > 0) daysMetCalorieTarget++;
      if (metProt && dayFoods.length > 0) daysMetProteinTarget++;
      if (metWater && dayWater.length > 0) daysMetWaterTarget++;

      totalCalAcrossDays += dayCal;
      totalProteinAcrossDays += dayProt;
      totalCarbsAcrossDays += dayCarbs;
      totalFatAcrossDays += dayFat;
      totalFiberAcrossDays += dayFiber;
      totalWaterAcrossDays += dayW;
      cumulativeAdherence += adherenceScore;

      dailyAnalytics.push({
        date: dateStr,
        dayLabel,
        calories: dayCal,
        protein: dayProt,
        carbs: dayCarbs,
        fat: dayFat,
        fiber: dayFiber,
        water: dayW,
        targetCalories: targetCal,
        targetProtein: targetProt,
        metCalorieTarget: metCal,
        metProteinTarget: metProt,
        metWaterTarget: metWater,
        adherenceScore,
      });
    }

    const divisor = daysWithLogs > 0 ? daysWithLogs : 7;
    const weeklyAdherence = Math.round(cumulativeAdherence / 7);

    return NextResponse.json({
      success: true,
      activePlan,
      averages: {
        dailyCalories: Math.round(totalCalAcrossDays / divisor),
        dailyProtein: Math.round((totalProteinAcrossDays / divisor) * 10) / 10,
        dailyCarbs: Math.round((totalCarbsAcrossDays / divisor) * 10) / 10,
        dailyFat: Math.round((totalFatAcrossDays / divisor) * 10) / 10,
        dailyFiber: Math.round((totalFiberAcrossDays / divisor) * 10) / 10,
        dailyWater: Math.round((totalWaterAcrossDays / divisor) * 10) / 10,
      },
      weeklyAdherence,
      daysMeetingCalorieTarget: `${daysMetCalorieTarget} / 7 days`,
      daysMeetingProteinTarget: `${daysMetProteinTarget} / 7 days`,
      daysMeetingWaterTarget: `${daysMetWaterTarget} / 7 days`,
      daysLoggedCount: daysWithLogs,
      dailyAnalytics,
    });
  } catch (error: any) {
    console.error("Error fetching nutrition analytics:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch nutrition analytics." },
      { status: 500 }
    );
  }
}
