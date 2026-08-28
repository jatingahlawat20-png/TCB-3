import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function TrainerClientProgressPage({ params }: RouteParams) {
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

  // 3. Fetch Active Program
  const activeProgram = await prisma.workoutProgram.findFirst({
    where: {
      clientId: clientId,
      isActive: true,
    },
    include: {
      workoutDays: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  // 4. Fetch All Workout Logs for this Client
  const workoutLogs = await prisma.workoutLog.findMany({
    where: { clientId: clientId },
    include: {
      workoutDay: {
        select: { id: true, name: true, dayOfWeek: true, weekNumber: true },
      },
      exerciseLogs: {
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 5. Compute Adherence & Analytics
  const totalWorkouts = workoutLogs.length;
  const totalVolume = Math.round(
    workoutLogs.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0)
  );
  const avgCompletion =
    totalWorkouts > 0
      ? Math.round(
          workoutLogs.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / totalWorkouts
        )
      : 0;

  const logsWithRpe = workoutLogs.filter((l) => l.rpe !== null);
  const avgRpe =
    logsWithRpe.length > 0
      ? (logsWithRpe.reduce((acc, curr) => acc + (curr.rpe || 0), 0) / logsWithRpe.length).toFixed(1)
      : "N/A";

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const workoutsThisWeek = workoutLogs.filter((l) => new Date(l.createdAt) >= oneWeekAgo).length;
  const expectedWeekly = activeProgram?.workoutDays?.length || 3;
  const weeklyAdherence = Math.min(100, Math.round((workoutsThisWeek / expectedWeekly) * 100));

  // Current program week
  let currentWeek = 1;
  if (activeProgram) {
    const diffMs = new Date().getTime() - new Date(activeProgram.startDate).getTime();
    currentWeek = Math.max(1, Math.min(activeProgram.durationWeeks || 4, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1));
  }

  // Personal bests
  const prLogs = workoutLogs.filter((l) => l.isPersonalBest);

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Top Navigation & Client Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Athlete Progress & Adherence
              </span>
              <span className="text-xs text-gray-400">
                Enrolled since {new Date(client.createdAt).toLocaleDateString([], { month: "short", year: "numeric" })}
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              {client.name}&apos;s Training Log
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Account: <span className="text-white font-semibold">{client.email}</span> • Assigned Coach: <span className="text-[#7CFF3B] font-semibold">{user.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trainer/programs"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              ← All Programs
            </Link>
            <Link
              href="/messages"
              className="rounded-2xl bg-[#7CFF3B] px-5 py-3.5 text-xs font-black text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] hover:bg-[#68e326]"
            >
              Direct Message {client.name.split(" ")[0]}
            </Link>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume</p>
            <p className="mt-2 text-3xl font-black text-[#7CFF3B]">{totalVolume.toLocaleString()} <span className="text-xs text-gray-400">kg</span></p>
            <p className="mt-1 text-[11px] text-gray-500">{totalWorkouts} sessions logged</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Adherence</p>
            <p className="mt-2 text-3xl font-black text-white">{avgCompletion}%</p>
            <p className="mt-1 text-[11px] text-gray-500">Exercise completion rate</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">7-Day Adherence</p>
            <p className="mt-2 text-3xl font-black text-white">{weeklyAdherence}%</p>
            <p className="mt-1 text-[11px] text-gray-500">
              {workoutsThisWeek} of {expectedWeekly} workouts completed
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">PR Milestones</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{prLogs.length}</p>
            <p className="mt-1 text-[11px] text-gray-500">Avg RPE: {avgRpe}/10</p>
          </div>
        </div>

        {/* Current Active Program Card */}
        <div className="mt-10 rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                  Current Program Structure
                </span>
                {activeProgram && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300">
                    Week {currentWeek} of {activeProgram.durationWeeks || 4}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                {activeProgram ? activeProgram.name : "No Active Program Assigned"}
              </h2>
              {activeProgram && (
                <p className="mt-1 text-xs text-gray-300">
                  <span className="text-[#7CFF3B] font-bold">Goal:</span> {activeProgram.goal} •{" "}
                  <span className="text-gray-400">Frequency:</span> {activeProgram.trainingFrequency || activeProgram.weeklyStructure || "Custom"}
                </p>
              )}
            </div>

            <Link
              href="/trainer/programs"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white hover:bg-white/10"
            >
              Modify / New Program →
            </Link>
          </div>

          {activeProgram && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProgram.workoutDays.map((day, dIdx) => (
                <div key={day.id} className="rounded-2xl bg-[#0B0F15] p-5 border border-white/5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="font-bold text-sm text-white">{day.name}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">Day {dIdx + 1}</span>
                  </div>
                  {day.description && (
                    <p className="mt-2 text-[11px] text-gray-400">{day.description}</p>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {day.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-gray-300 font-medium">{ex.name}</span>
                        <span className="text-[#7CFF3B] font-mono text-[11px]">
                          {ex.sets} × {ex.reps} {ex.targetWeight ? `@ ${ex.targetWeight}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workout Log History */}
        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-black text-white">Athlete Workout & Feedback Stream</h2>
              <p className="text-xs text-gray-400">
                Chronological workout completions with difficulty, energy ratings, and client notes
              </p>
            </div>
            <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs text-gray-300 font-bold">
              {workoutLogs.length} Total Logs
            </span>
          </div>

          {workoutLogs.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
              <p className="text-gray-400">No workout logs recorded yet for this client.</p>
              <p className="mt-1 text-xs text-gray-500">
                When {client.name} starts and completes workout routines in the app, their performance logs, PRs, and coach notes will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workoutLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[28px] border border-white/10 bg-[#11161D] p-6 shadow-md"
                >
                  {/* Log Header */}
                  <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-0.5 text-xs font-bold text-[#7CFF3B]">
                          {log.completionRate}% Completed
                        </span>
                        {log.totalVolume ? (
                          <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
                            🏋️ {Math.round(log.totalVolume)} kg
                          </span>
                        ) : null}
                        {log.isPersonalBest && (
                          <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2.5 py-0.5 text-xs font-bold text-yellow-300">
                            🏆 PR Milestone
                          </span>
                        )}
                        {log.rpe && (
                          <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                            RPE: {log.rpe}/10
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          ⏱ {log.durationMinutes || 45} mins
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-white">{log.workoutName}</h3>
                    </div>

                    <div className="text-xs text-gray-400 md:text-right">
                      <p className="font-semibold text-white">
                        {new Date(log.createdAt).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Difficulty & Energy Ratings row if present */}
                  {(log.difficultyRating || log.energyRating) && (
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      {log.difficultyRating && (
                        <span className="text-gray-300">
                          Difficulty: <strong className="text-white">{log.difficultyRating}/5</strong>
                        </span>
                      )}
                      {log.energyRating && (
                        <span className="text-gray-300">
                          Energy Level: <strong className="text-[#7CFF3B]">{log.energyRating}/5</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Athlete Notes / Feedback */}
                  {(log.feedbackNotes || log.notes) && (
                    <div className="mt-3 rounded-xl bg-[#0B0F15] p-3 text-xs text-gray-300 border border-white/5">
                      <span className="font-bold text-[#7CFF3B]">Client Feedback to Coach:</span> {log.feedbackNotes || log.notes}
                    </div>
                  )}

                  {/* Exercise Performance Breakdown */}
                  {log.exerciseLogs && log.exerciseLogs.length > 0 && (
                    <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {log.exerciseLogs.map((el: any) => (
                        <div
                          key={el.id}
                          className="rounded-xl border border-white/5 bg-[#0B0F15] p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-white">{el.exerciseName}</p>
                            <span
                              className={`text-[10px] font-bold ${
                                el.isCompleted ? "text-[#7CFF3B]" : "text-gray-400"
                              }`}
                            >
                              {el.isCompleted ? "✓ Completed" : "Partial"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">
                            Sets: <span className="text-white font-semibold">{el.setsCompleted}</span>
                            {el.actualWeight && (
                              <>
                                {" "}• Weight: <span className="text-white font-semibold">{el.actualWeight}</span>
                              </>
                            )}
                            {el.actualReps && (
                              <>
                                {" "}• Reps: <span className="text-white font-semibold">{el.actualReps}</span>
                              </>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
