import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { ClientWorkoutsView } from "@/components/workouts/client-workouts-view";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientWorkoutsPage() {
  const user = await requireUser(["CLIENT", "ADMIN"]);

  // 1. Fetch all programs for this client
  const programs = await prisma.workoutProgram.findMany({
    where: { clientId: user.id },
    include: {
      trainer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      workoutDays: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  // 2. Fetch workout logs for this client
  const logs = await prisma.workoutLog.findMany({
    where: { clientId: user.id },
    include: {
      exerciseLogs: {
        orderBy: { orderIndex: "asc" },
      },
      workoutDay: {
        select: { id: true, name: true, dayOfWeek: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Compute today's workout & week metrics
  const activeProgram = programs.find((p) => p.isActive) || programs[0] || null;
  let todayWorkout: any = null;
  let isCompletedToday = false;
  let currentWeek = 1;
  let weeklyCompletionPercent = 0;

  if (activeProgram && activeProgram.workoutDays.length > 0) {
    const now = new Date();
    const startMs = new Date(activeProgram.startDate).getTime();
    const diffMs = now.getTime() - startMs;
    const computedWeek = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    currentWeek = Math.max(1, Math.min(activeProgram.durationWeeks || 4, computedWeek));

    const currentWeekDays = activeProgram.workoutDays.filter(
      (d) => (d.weekNumber || 1) === currentWeek || (d.weekNumber || 1) === 1
    );
    const candidateDays = currentWeekDays.length > 0 ? currentWeekDays : activeProgram.workoutDays;

    const currentDayOfWeek = now.getDay();
    todayWorkout =
      candidateDays.find((d) => d.dayOfWeek === currentDayOfWeek) ||
      candidateDays[logs.length % candidateDays.length] ||
      candidateDays[0];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLog = logs.find(
      (l) => l.workoutDayId === todayWorkout?.id && new Date(l.createdAt) >= startOfToday
    );
    isCompletedToday = Boolean(todayLog);

    // Weekly completion %
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekLogsCount = logs.filter((l) => new Date(l.createdAt) >= startOfWeek).length;
    const plannedDaysPerWeek = candidateDays.length || 3;
    weeklyCompletionPercent = Math.min(100, Math.round((thisWeekLogsCount / plannedDaysPerWeek) * 100));

    // Fetch previous performance for exercises in todayWorkout
    if (todayWorkout && todayWorkout.exercises) {
      const exercisesWithPrev = await Promise.all(
        todayWorkout.exercises.map(async (ex: any) => {
          const lastLog = await prisma.exerciseLog.findFirst({
            where: {
              workoutLog: { clientId: user.id },
              exerciseName: { equals: ex.name, mode: "insensitive" },
              isCompleted: true,
            },
            orderBy: { createdAt: "desc" },
            select: {
              actualWeight: true,
              actualReps: true,
              setsCompleted: true,
              rpe: true,
              createdAt: true,
            },
          });
          return {
            ...ex,
            previousPerformance: lastLog
              ? {
                  actualWeight: lastLog.actualWeight,
                  actualReps: lastLog.actualReps,
                  setsCompleted: lastLog.setsCompleted,
                  rpe: lastLog.rpe,
                  date: lastLog.createdAt,
                }
              : null,
          };
        })
      );
      todayWorkout = { ...todayWorkout, exercises: exercisesWithPrev };
    }
  }

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Workout Hub
              </span>
              <span className="text-xs text-gray-400">Training Routine & Interactive Logger</span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              My Training Program
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              View your prescribed routines, execute sets with the live logger, and track progressive overload.
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
              href="/messages"
              className="rounded-2xl bg-white/10 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/20"
            >
              Message Coach
            </Link>
          </div>
        </div>

        {/* Client Workouts View */}
        <div className="mt-10">
          <ClientWorkoutsView
            initialPrograms={programs as any}
            initialLogs={logs}
            todayWorkoutData={{
              hasProgram: Boolean(activeProgram),
              todayWorkout: todayWorkout as any,
              isCompletedToday,
              currentWeek,
              totalWeeks: activeProgram?.durationWeeks || 4,
              weeklyCompletionPercent,
            }}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
