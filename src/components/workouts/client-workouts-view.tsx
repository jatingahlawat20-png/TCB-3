"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkoutPlayerModal, WorkoutDayData } from "./workout-player-modal";

export type WorkoutProgram = {
  id: string;
  name: string;
  description: string | null;
  goal: string;
  durationWeeks?: number;
  trainingFrequency?: string | null;
  status?: string;
  notes?: string | null;
  startDate: string | Date;
  endDate: string | Date | null;
  weeklyStructure: string | null;
  isActive: boolean;
  trainer: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  workoutDays: WorkoutDayData[];
  workoutLogs?: any[];
};

type Props = {
  initialPrograms: WorkoutProgram[];
  initialLogs: any[];
  todayWorkoutData?: {
    hasProgram: boolean;
    todayWorkout: WorkoutDayData | null;
    isCompletedToday: boolean;
    currentWeek?: number;
    totalWeeks?: number;
    weeklyCompletionPercent?: number;
    upcomingWorkouts?: WorkoutDayData[];
  };
};

export function ClientWorkoutsView({
  initialPrograms,
  initialLogs,
  todayWorkoutData,
}: Props) {
  const [programs] = useState<WorkoutProgram[]>(initialPrograms);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<"routine" | "analytics" | "history">("routine");
  const [activeDayModal, setActiveDayModal] = useState<WorkoutDayData | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(todayWorkoutData?.currentWeek || 1);

  const activeProgram = programs.find((p) => p.isActive) || programs[0] || null;

  // Compute analytics
  const totalLogs = logs.length;
  const totalVolume = Math.round(
    logs.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0)
  );
  const avgCompletion =
    totalLogs > 0
      ? Math.round(logs.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / totalLogs)
      : 0;

  const logsWithRpe = logs.filter((l) => l.rpe !== null);
  const avgRpe =
    logsWithRpe.length > 0
      ? (logsWithRpe.reduce((acc, curr) => acc + (curr.rpe || 0), 0) / logsWithRpe.length).toFixed(1)
      : null;

  const prLogs = logs.filter((l) => l.isPersonalBest);

  // Extract all available weeks in active program
  const programWeeks = Array.from(
    new Set((activeProgram?.workoutDays || []).map((d) => d.weekNumber || 1))
  ).sort((a, b) => a - b);

  const currentWeekDays = (activeProgram?.workoutDays || []).filter(
    (d) => (d.weekNumber || 1) === selectedWeek
  );

  const handleWorkoutCompleted = (newLog: any) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-8">
      {/* Active Program Header Banner */}
      {activeProgram ? (
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#11161D] via-[#0E131A] to-[#080B0F] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                  Active Training Program
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300">
                  Week {todayWorkoutData?.currentWeek || 1} of {activeProgram.durationWeeks || 4}
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300">
                  {activeProgram.trainingFrequency || activeProgram.weeklyStructure || `${activeProgram.workoutDays.length} Days / Week`}
                </span>
              </div>

              <h2 className="text-3xl font-black text-white md:text-4xl">
                {activeProgram.name}
              </h2>

              <p className="text-sm text-gray-300 max-w-2xl">
                <span className="text-[#7CFF3B] font-bold">Goal:</span> {activeProgram.goal}
                {activeProgram.description && ` • ${activeProgram.description}`}
              </p>

              {activeProgram.notes && (
                <p className="text-xs text-yellow-300/80 max-w-2xl">
                  📋 Coach Note: {activeProgram.notes}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <span>Prescribed by Coach</span>
                <span className="font-semibold text-white">
                  {activeProgram.trainer?.user?.name || "Your Coach"}
                </span>
                <span>•</span>
                <Link href="/messages" className="text-[#7CFF3B] hover:underline font-bold">
                  Direct Message Coach →
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[105px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="mt-1 text-2xl font-black text-white">{totalLogs}</p>
                <p className="text-[10px] text-gray-500">Sessions</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[105px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Volume</p>
                <p className="mt-1 text-2xl font-black text-[#7CFF3B]">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
                <p className="text-[10px] text-gray-500">kg Lifted</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[105px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Adherence</p>
                <p className="mt-1 text-2xl font-black text-[#7CFF3B]">{avgCompletion}%</p>
                <p className="text-[10px] text-gray-500">Avg Completion</p>
              </div>
            </div>
          </div>

          {/* Weekly Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-400">
                This Week&apos;s Training Adherence:
              </span>
              <span className="text-[#7CFF3B]">
                {todayWorkoutData?.weeklyCompletionPercent || 0}% Complete
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#7CFF3B] to-[#58d31a] transition-all duration-300"
                style={{ width: `${todayWorkoutData?.weeklyCompletionPercent || 0}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-3xl">
            🏋️
          </div>
          <h3 className="mt-4 text-2xl font-black text-white">No Active Training Program Assigned</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            Your personal coach has not published an active training plan yet. Connect with your coach via direct chat to get your tailored workout routine.
          </p>
          <div className="mt-6">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326]"
            >
              💬 Message Your Coach
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("routine")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "routine"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          📅 Training Routine & Split
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "analytics"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          📊 Progress & Overload Analytics
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "history"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          📜 Workout History ({logs.length})
        </button>
      </div>

      {/* TAB 1: ROUTINE & SPLIT */}
      {activeTab === "routine" && activeProgram && (
        <div className="space-y-8">
          {/* Today's Spotlight Workout Hero */}
          {todayWorkoutData?.todayWorkout && (
            <div className="relative overflow-hidden rounded-[32px] border border-[#7CFF3B]/40 bg-gradient-to-r from-[#11161D] via-[#141C25] to-[#11161D] p-6 md:p-8 shadow-[0_0_35px_rgba(124,255,59,0.12)]">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#7CFF3B] px-3 py-1 text-xs font-black text-black uppercase tracking-wider">
                      🎯 Today&apos;s Workout
                    </span>
                    {todayWorkoutData.isCompletedToday ? (
                      <span className="rounded-full bg-[#7CFF3B]/20 border border-[#7CFF3B]/40 px-3 py-1 text-xs font-bold text-[#7CFF3B]">
                        ✓ Completed Today
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-3 py-1 text-xs font-bold text-yellow-300">
                        ⚡ Ready to Train
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-white md:text-3xl">
                    {todayWorkoutData.todayWorkout.name}
                  </h3>

                  <p className="text-xs text-gray-400">
                    {todayWorkoutData.todayWorkout.exercises.length} Exercises prescribed • Target muscle groups:{" "}
                    <span className="text-white font-semibold">
                      {todayWorkoutData.todayWorkout.exercises
                        .map((e) => e.muscleGroup)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ")}
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => setActiveDayModal(todayWorkoutData.todayWorkout)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-4 text-xs font-black text-black shadow-[0_0_25px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326] shrink-0"
                >
                  <span>🚀 {todayWorkoutData.isCompletedToday ? "Log Another Session" : "Start Workout"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Week Filter (if multiple weeks exist) */}
          {programWeeks.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Select Week:</span>
              <div className="flex flex-wrap gap-1.5">
                {programWeeks.map((wk) => (
                  <button
                    key={wk}
                    onClick={() => setSelectedWeek(wk)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      selectedWeek === wk
                        ? "bg-[#7CFF3B] text-black font-black"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Week {wk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workout Days Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentWeekDays.map((day, idx) => {
              const dayLabel =
                typeof day.dayOfWeek === "number" ? dayOfWeekNames[day.dayOfWeek] : `Day ${idx + 1}`;

              return (
                <div
                  key={day.id}
                  className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-[#11161D] p-6 shadow-md transition hover:border-white/20"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-bold text-[#7CFF3B]">
                        {dayLabel}
                      </span>
                      <span className="text-xs text-gray-400">
                        {day.exercises.length} exercises
                      </span>
                    </div>

                    <h4 className="mt-3 text-lg font-bold text-white">{day.name}</h4>
                    {day.description && (
                      <p className="mt-1 text-xs text-gray-400">{day.description}</p>
                    )}

                    {/* Exercises preview */}
                    <div className="mt-4 space-y-2">
                      {day.exercises.map((ex, eIdx) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between rounded-xl bg-[#0B0F15] p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-gray-300">
                              {eIdx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-white">{ex.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {ex.muscleGroup} • {ex.restSeconds}s rest
                                {ex.isWarmup && " • Warmup"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-[#7CFF3B]">
                              {ex.sets} × {ex.reps}
                            </span>
                            {ex.targetWeight && (
                              <p className="text-[10px] text-gray-400">{ex.targetWeight}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setActiveDayModal(day)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:bg-[#7CFF3B]/10 hover:text-[#7CFF3B]"
                    >
                      ▶ Open Workout Logger
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRESS & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          {/* Top KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total Volume Lifted</p>
              <p className="mt-2 text-3xl font-black text-white">
                {totalVolume.toLocaleString()} <span className="text-sm font-normal text-gray-400">kg</span>
              </p>
              <p className="mt-1 text-xs text-[#7CFF3B]">Cumulative training volume</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Adherence Score</p>
              <p className="mt-2 text-3xl font-black text-[#7CFF3B]">
                {avgCompletion}%
              </p>
              <p className="mt-1 text-xs text-gray-400">Average set completion</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Workouts Logged</p>
              <p className="mt-2 text-3xl font-black text-white">
                {totalLogs}
              </p>
              <p className="mt-1 text-xs text-gray-400">Completed training sessions</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Average Exertion</p>
              <p className="mt-2 text-3xl font-black text-white">
                {avgRpe ? `${avgRpe}/10` : "N/A"}
              </p>
              <p className="mt-1 text-xs text-gray-400">Average RPE intensity</p>
            </div>
          </div>

          {/* Personal Bests (PRs) */}
          {prLogs.length > 0 && (
            <div className="rounded-[28px] border border-yellow-400/30 bg-yellow-400/5 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-bold text-lg text-white">Personal Best Milestones</h3>
                  <p className="text-xs text-gray-400">You crushed a new record in {prLogs.length} training sessions!</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {prLogs.slice(0, 6).map((l) => (
                  <div key={l.id} className="rounded-2xl border border-white/10 bg-[#11161D] p-3 text-xs">
                    <p className="font-bold text-[#7CFF3B]">{l.workoutName}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {new Date(l.createdAt).toLocaleDateString()} • {Math.round(l.totalVolume || 0)} kg volume
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workout Volume History */}
          <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
            <h3 className="text-xl font-black text-white">Recent Workout Performance</h3>
            <p className="text-xs text-gray-400 mt-1">Chronological training volume and sets completed.</p>

            <div className="mt-6 divide-y divide-white/5">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{log.workoutName}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} • {log.durationMinutes || 45} mins • RPE: {log.rpe || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#7CFF3B]">
                      {Math.round(log.totalVolume || 0)} kg
                    </span>
                    <p className="text-[10px] text-gray-400">{log.completionRate}% Done</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKOUT HISTORY & LOGBOOK */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
              <p className="text-gray-400">No workout logs recorded yet.</p>
              <p className="mt-1 text-xs text-gray-500">
                Complete your first workout in the Routine tab to see your log history and performance stats here!
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLogDetail(log)}
                className="cursor-pointer rounded-[28px] border border-white/10 bg-[#11161D] p-6 shadow-md transition hover:border-[#7CFF3B]/50 hover:bg-[#141C25]"
              >
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
                      {log.rpe && (
                        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                          RPE: {log.rpe}/10
                        </span>
                      )}
                      {log.isPersonalBest && (
                        <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2.5 py-0.5 text-xs font-bold text-yellow-300">
                          🏆 PR
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        ⏱ {log.durationMinutes || 45} mins
                      </span>
                    </div>
                    <h4 className="mt-2 text-xl font-bold text-white">{log.workoutName}</h4>
                  </div>

                  <div className="text-xs text-gray-400 md:text-right">
                    <span>
                      {new Date(log.createdAt).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <p className="text-[11px] text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Log Feedback / Notes */}
                {(log.feedbackNotes || log.notes) && (
                  <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-gray-300">
                    <span className="font-bold text-[#7CFF3B]">Feedback:</span> {log.feedbackNotes || log.notes}
                  </div>
                )}

                {/* Quick Exercise Preview */}
                {log.exerciseLogs && log.exerciseLogs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {log.exerciseLogs.map((el: any) => (
                      <span
                        key={el.id}
                        className="rounded-lg bg-[#0B0F15] border border-white/5 px-2.5 py-1 text-[11px] text-gray-300"
                      >
                        {el.exerciseName} ({el.actualWeight ? `${el.actualWeight} × ` : ""}{el.actualReps || "done"})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Log Detailed Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0B0F15] p-6 text-white shadow-2xl md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-0.5 text-xs font-bold text-[#7CFF3B]">
                  {selectedLogDetail.completionRate}% Completed
                </span>
                <h3 className="mt-2 text-2xl font-black text-white">{selectedLogDetail.workoutName}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(selectedLogDetail.createdAt).toLocaleString()} • {selectedLogDetail.durationMinutes || 45} mins • {Math.round(selectedLogDetail.totalVolume || 0)} kg volume
                </p>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Ratings row */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">RPE</p>
                <p className="mt-1 font-mono text-base font-bold text-white">{selectedLogDetail.rpe || "N/A"}/10</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Difficulty</p>
                <p className="mt-1 font-mono text-base font-bold text-white">{selectedLogDetail.difficultyRating || "N/A"}/5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Energy</p>
                <p className="mt-1 font-mono text-base font-bold text-white">{selectedLogDetail.energyRating || "N/A"}/5</p>
              </div>
            </div>

            {/* Feedback Note */}
            {selectedLogDetail.feedbackNotes && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#11161D] p-4 text-xs">
                <p className="font-bold text-[#7CFF3B]">Client Note to Coach:</p>
                <p className="mt-1 text-gray-300">{selectedLogDetail.feedbackNotes}</p>
              </div>
            )}

            {/* Sets & Exercises breakdown */}
            <div className="mt-5 max-h-60 overflow-y-auto space-y-2.5 pr-2">
              {(selectedLogDetail.exerciseLogs || []).map((el: any) => (
                <div key={el.id} className="rounded-xl border border-white/5 bg-[#11161D] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">{el.exerciseName}</p>
                    <span className="text-[#7CFF3B] font-bold">{el.isCompleted ? "✓ Completed" : "Partial"}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    <span>Sets: <strong className="text-white">{el.setsCompleted}</strong></span>
                    {el.actualWeight && <span> • Weight: <strong className="text-white">{el.actualWeight}</strong></span>}
                    {el.actualReps && <span> • Reps: <strong className="text-white">{el.actualReps}</strong></span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-right">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="rounded-2xl bg-white/10 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                Close Logbook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Player Modal */}
      {activeDayModal && (
        <WorkoutPlayerModal
          isOpen={Boolean(activeDayModal)}
          onClose={() => setActiveDayModal(null)}
          workoutDay={activeDayModal}
          programId={activeProgram?.id}
          onWorkoutCompleted={handleWorkoutCompleted}
        />
      )}
    </div>
  );
}
