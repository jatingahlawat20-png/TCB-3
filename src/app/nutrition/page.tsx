import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { ClientNutritionView } from "@/components/nutrition/client-nutrition-view";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientNutritionPage() {
  const user = await requireUser(["CLIENT", "ADMIN"]);

  // 1. Fetch Active Nutrition Plan
  const activePlan = await prisma.nutritionPlan.findFirst({
    where: {
      clientId: user.id,
      isActive: true,
    },
    include: {
      trainer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      targetHistory: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  // 2. Fetch Today's Food Logs & Water Logs (Local day bounds)
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const formattedToday = `${yyyy}-${mm}-${dd}`;

  // 7 days ago for analytics
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [todayFoodLogs, todayWaterLogs, todayWorkout, foodLogs7Days, waterLogs7Days] = await Promise.all([
    prisma.foodLog.findMany({
      where: {
        clientId: user.id,
        loggedDate: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.waterLog.findMany({
      where: {
        clientId: user.id,
        loggedDate: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workoutLog.findFirst({
      where: {
        clientId: user.id,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      select: {
        id: true,
        workoutName: true,
        completionRate: true,
        durationMinutes: true,
        totalVolume: true,
      },
    }),
    prisma.foodLog.findMany({
      where: {
        clientId: user.id,
        loggedDate: { gte: sevenDaysAgo },
      },
      orderBy: { loggedDate: "asc" },
    }),
    prisma.waterLog.findMany({
      where: {
        clientId: user.id,
        loggedDate: { gte: sevenDaysAgo },
      },
      orderBy: { loggedDate: "asc" },
    }),
  ]);

  // 3. Compute Consumed Totals for Today
  const consumedCalories = Math.round(
    todayFoodLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0)
  );
  const consumedProtein = Math.round(
    todayFoodLogs.reduce((acc, curr) => acc + (curr.protein || 0), 0) * 10
  ) / 10;
  const consumedCarbs = Math.round(
    todayFoodLogs.reduce((acc, curr) => acc + (curr.carbohydrates || 0), 0) * 10
  ) / 10;
  const consumedFat = Math.round(
    todayFoodLogs.reduce((acc, curr) => acc + (curr.fat || 0), 0) * 10
  ) / 10;
  const consumedFiber = Math.round(
    todayFoodLogs.reduce((acc, curr) => acc + (curr.fiber || 0), 0) * 10
  ) / 10;
  const consumedWater = Math.round(
    todayWaterLogs.reduce((acc, curr) => acc + (curr.amountLiters || 0), 0) * 10
  ) / 10;

  // 4. Group by Meal Type
  const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];
  const mealsByType: Record<string, { foods: any[]; calories: number; protein: number; carbs: number; fat: number }> = {};

  mealTypes.forEach((mt) => {
    const foods = todayFoodLogs.filter((f) => f.mealType === mt);
    mealsByType[mt] = {
      foods,
      calories: Math.round(foods.reduce((acc, f) => acc + f.calories, 0)),
      protein: Math.round(foods.reduce((acc, f) => acc + f.protein, 0) * 10) / 10,
      carbs: Math.round(foods.reduce((acc, f) => acc + f.carbohydrates, 0) * 10) / 10,
      fat: Math.round(foods.reduce((acc, f) => acc + f.fat, 0) * 10) / 10,
    };
  });

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
      }
    : null;

  let dailyAdherenceScore = 0;
  if (targets && todayFoodLogs.length > 0) {
    const calRatio = targets.calories > 0 ? consumedCalories / targets.calories : 0;
    if (calRatio >= 0.9 && calRatio <= 1.1) {
      dailyAdherenceScore += 40;
    } else if (calRatio > 0) {
      dailyAdherenceScore += Math.max(0, Math.round((1 - Math.abs(1 - calRatio)) * 40));
    }
    dailyAdherenceScore += Math.min(35, Math.round((consumedProtein / targets.protein) * 35));
    dailyAdherenceScore += Math.min(15, Math.round((consumedWater / targets.water) * 15));
    if (todayFoodLogs.length >= 2) dailyAdherenceScore += 10;
    else dailyAdherenceScore += 5;
  }
  dailyAdherenceScore = Math.min(100, Math.max(0, dailyAdherenceScore));

  // Build 7-day Analytics Data
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyAnalytics: any[] = [];
  let totalCalAcrossDays = 0;
  let totalProteinAcrossDays = 0;
  let totalCarbsAcrossDays = 0;
  let totalFatAcrossDays = 0;
  let totalFiberAcrossDays = 0;
  let totalWaterAcrossDays = 0;
  let daysWithLogs = 0;
  let daysMetCalorieTarget = 0;
  let daysMetProteinTarget = 0;
  let cumulativeAdherence = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayLabel = dayNames[d.getDay()];

    const dStart = new Date(d);
    dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setHours(23, 59, 59, 999);

    const dFoods = foodLogs7Days.filter((f) => f.loggedDate >= dStart && f.loggedDate <= dEnd);
    const dWater = waterLogs7Days.filter((w) => w.loggedDate >= dStart && w.loggedDate <= dEnd);

    const dCal = Math.round(dFoods.reduce((acc, curr) => acc + curr.calories, 0));
    const dProt = Math.round(dFoods.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;
    const dCarbs = Math.round(dFoods.reduce((acc, curr) => acc + curr.carbohydrates, 0) * 10) / 10;
    const dFat = Math.round(dFoods.reduce((acc, curr) => acc + curr.fat, 0) * 10) / 10;
    const dFiber = Math.round(dFoods.reduce((acc, curr) => acc + curr.fiber, 0) * 10) / 10;
    const dW = Math.round(dWater.reduce((acc, curr) => acc + curr.amountLiters, 0) * 10) / 10;

    const targetCal = activePlan?.dailyCalories || 2000;
    const targetProt = activePlan?.proteinGrams || 150;
    const targetW = activePlan?.waterLiters || 3.0;

    const metCal = targetCal > 0 && dCal >= targetCal * 0.9 && dCal <= targetCal * 1.1;
    const metProt = targetProt > 0 && dProt >= targetProt * 0.9;
    const metWater = targetW > 0 && dW >= targetW * 0.8;

    let adherenceScore = 0;
    if (dFoods.length > 0) {
      daysWithLogs++;
      if (metCal) adherenceScore += 40;
      else if (dCal > 0) adherenceScore += Math.max(0, Math.round((1 - Math.abs(1 - dCal / targetCal)) * 40));

      adherenceScore += Math.min(35, Math.round((dProt / targetProt) * 35));
      adherenceScore += Math.min(15, Math.round((dW / targetW) * 15));
      if (dFoods.length >= 2) adherenceScore += 10;
      else adherenceScore += 5;
      adherenceScore = Math.min(100, adherenceScore);
    }

    if (metCal && dFoods.length > 0) daysMetCalorieTarget++;
    if (metProt && dFoods.length > 0) daysMetProteinTarget++;

    totalCalAcrossDays += dCal;
    totalProteinAcrossDays += dProt;
    totalCarbsAcrossDays += dCarbs;
    totalFatAcrossDays += dFat;
    totalFiberAcrossDays += dFiber;
    totalWaterAcrossDays += dW;
    cumulativeAdherence += adherenceScore;

    dailyAnalytics.push({
      date: dateStr,
      dayLabel,
      calories: dCal,
      protein: dProt,
      carbs: dCarbs,
      fat: dFat,
      fiber: dFiber,
      water: dW,
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

  const initialAnalytics = {
    activePlan,
    averages: {
      dailyCalories: daysWithLogs > 0 ? Math.round(totalCalAcrossDays / divisor) : 0,
      dailyProtein: daysWithLogs > 0 ? Math.round((totalProteinAcrossDays / divisor) * 10) / 10 : 0,
      dailyCarbs: daysWithLogs > 0 ? Math.round((totalCarbsAcrossDays / divisor) * 10) / 10 : 0,
      dailyFat: daysWithLogs > 0 ? Math.round((totalFatAcrossDays / divisor) * 10) / 10 : 0,
      dailyFiber: daysWithLogs > 0 ? Math.round((totalFiberAcrossDays / divisor) * 10) / 10 : 0,
      dailyWater: daysWithLogs > 0 ? Math.round((totalWaterAcrossDays / divisor) * 10) / 10 : 0,
    },
    weeklyAdherence,
    daysMeetingCalorieTarget: `${daysMetCalorieTarget} / 7 days`,
    daysMeetingProteinTarget: `${daysMetProteinTarget} / 7 days`,
    daysLoggedCount: daysWithLogs,
    dailyAnalytics,
  };

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Nutrition & Fueling
              </span>
              <span className="text-xs text-gray-400">Personalized Macro Tracking & Hydration</span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              My Nutrition Plan
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Track your daily calories, macronutrients, and hydration prescribed by your coach.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              ← Dashboard
            </Link>
            <Link
              href="/workouts"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              🏋️ Workouts
            </Link>
            <Link
              href="/messages"
              className="rounded-2xl bg-white/10 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/20"
            >
              Message Coach
            </Link>
          </div>
        </div>

        {/* Client Nutrition Dashboard Component */}
        <div className="mt-10">
          <ClientNutritionView
            initialPlan={activePlan as any}
            initialDailyData={{
              date: formattedToday,
              consumed: {
                calories: consumedCalories,
                protein: consumedProtein,
                carbohydrates: consumedCarbs,
                fat: consumedFat,
                fiber: consumedFiber,
                water: consumedWater,
              },
              remaining,
              percentages: targets
                ? {
                    calories: targets.calories > 0 ? Math.round((consumedCalories / targets.calories) * 100) : 0,
                    protein: targets.protein > 0 ? Math.round((consumedProtein / targets.protein) * 100) : 0,
                    carbs: targets.carbs > 0 ? Math.round((consumedCarbs / targets.carbs) * 100) : 0,
                    fat: targets.fat > 0 ? Math.round((consumedFat / targets.fat) * 100) : 0,
                    fiber: targets.fiber > 0 ? Math.round((consumedFiber / targets.fiber) * 100) : 0,
                    water: targets.water > 0 ? Math.round((consumedWater / targets.water) * 100) : 0,
                  }
                : null,
              dailyAdherenceScore,
              mealsByType,
              foodLogs: todayFoodLogs as any,
              waterLogs: todayWaterLogs as any,
              workoutSummary: todayWorkout,
            }}
            initialAnalytics={initialAnalytics}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
