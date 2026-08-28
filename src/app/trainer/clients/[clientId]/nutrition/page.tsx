import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { TrainerClientNutritionView } from "@/components/trainer/trainer-client-nutrition-view";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function TrainerClientNutritionPage({ params }: RouteParams) {
  const { clientId } = await params;
  const user = await requireUser(["TRAINER", "ADMIN"]);

  if (!user.trainerProfile && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 1. Verify Active Coaching Relationship
  if (user.role === "TRAINER" && user.trainerProfile) {
    const activeRelationship = await prisma.coachingRequest.findFirst({
      where: {
        trainerId: user.trainerProfile.id,
        clientId: clientId,
        status: "ACCEPTED",
      },
    });

    if (!activeRelationship) {
      redirect("/trainer/dashboard");
    }
  }

  // 2. Fetch Client Info
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!client) {
    notFound();
  }

  // 3. Fetch Active Plan
  const activePlan = await prisma.nutritionPlan.findFirst({
    where: {
      clientId,
      isActive: true,
    },
    include: {
      targetHistory: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  // 4. Fetch Today's Intake
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayFoods, todayWater, recentFoods] = await Promise.all([
    prisma.foodLog.findMany({
      where: {
        clientId,
        loggedDate: { gte: startOfToday },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.waterLog.findMany({
      where: {
        clientId,
        loggedDate: { gte: startOfToday },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.foodLog.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const todayCalories = Math.round(todayFoods.reduce((acc, curr) => acc + curr.calories, 0));
  const todayProtein = Math.round(todayFoods.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;
  const todayCarbs = Math.round(todayFoods.reduce((acc, curr) => acc + curr.carbohydrates, 0) * 10) / 10;
  const todayFat = Math.round(todayFoods.reduce((acc, curr) => acc + curr.fat, 0) * 10) / 10;
  const todayWaterLiters = Math.round(todayWater.reduce((acc, curr) => acc + curr.amountLiters, 0) * 10) / 10;

  // 5. 7-Day Adherence Calculation
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [foodLogs7Days, waterLogs7Days] = await Promise.all([
    prisma.foodLog.findMany({
      where: {
        clientId,
        loggedDate: { gte: sevenDaysAgo },
      },
    }),
    prisma.waterLog.findMany({
      where: {
        clientId,
        loggedDate: { gte: sevenDaysAgo },
      },
    }),
  ]);

  let cumulativeAdherence = 0;
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

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Athlete Nutrition & Targets
              </span>
              <span className="text-xs text-gray-400">
                Enrolled Client: <strong className="text-white">{client.name}</strong> ({client.email})
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              {client.name.split(" ")[0]}&apos;s Nutrition Management
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Manage caloric targets, macronutrient split, and monitor dietary adherence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/trainer/clients/${clientId}/progress`}
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              🏋️ Workout Progress
            </Link>
            <Link
              href="/trainer/dashboard"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              ← Trainer Dashboard
            </Link>
            <Link
              href={`/messages?clientId=${clientId}`}
              className="rounded-2xl bg-[#7CFF3B] px-5 py-3.5 text-xs font-black text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] hover:bg-[#68e326]"
            >
              Direct Message
            </Link>
          </div>
        </div>

        {/* View Component */}
        <div className="mt-10">
          <TrainerClientNutritionView
            client={client}
            initialPlan={activePlan as any}
            initialTodayIntake={{
              calories: todayCalories,
              protein: todayProtein,
              carbs: todayCarbs,
              fat: todayFat,
              water: todayWaterLiters,
            }}
            initialWeeklyAdherence={weeklyAdherence}
            initialRecentFoods={recentFoods as any}
            initialTargetHistory={activePlan?.targetHistory || []}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
