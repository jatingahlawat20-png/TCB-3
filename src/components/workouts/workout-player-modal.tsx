"use client";

import { useState, useEffect, useRef } from "react";

export type WorkoutExerciseItem = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  targetWeight: string | null;
  rpeTarget?: string | null;
  restSeconds: number;
  tempo?: string | null;
  notes?: string | null;
  videoUrl?: string | null;
  isWarmup?: boolean;
  orderIndex: number;
  previousPerformance?: {
    actualWeight: string | null;
    actualReps: string | null;
    setsCompleted: number;
    rpe: number | null;
    date: string | Date;
  } | null;
};

export type WorkoutDayData = {
  id: string;
  name: string;
  programId: string;
  dayOfWeek?: number | null;
  weekNumber?: number;
  description: string | null;
  exercises: WorkoutExerciseItem[];
};

type SetLog = {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseTracker = {
  workoutExerciseId: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  targetWeight: string;
  rpeTarget?: string;
  restSeconds: number;
  tempo?: string;
  notes?: string;
  videoUrl?: string;
  isWarmup?: boolean;
  previousPerformance?: {
    actualWeight: string | null;
    actualReps: string | null;
    setsCompleted: number;
    rpe: number | null;
  } | null;
  sets: SetLog[];
  exerciseNotes: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workoutDay: WorkoutDayData;
  programId?: string;
  onWorkoutCompleted?: (newLog: any) => void;
};

export function WorkoutPlayerModal({
  isOpen,
  onClose,
  workoutDay,
  programId,
  onWorkoutCompleted,
}: Props) {
  const [trackers, setTrackers] = useState<ExerciseTracker[]>([]);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTimerTotal, setRestTimerTotal] = useState(60);
  const [generalNotes, setGeneralNotes] = useState("");
  const [rpe, setRpe] = useState<number>(7);
  const [difficultyRating, setDifficultyRating] = useState<number>(3);
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedLogSummary, setCompletedLogSummary] = useState<any>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize trackers when modal opens
  useEffect(() => {
    if (isOpen && workoutDay) {
      const initialTrackers: ExerciseTracker[] = (workoutDay.exercises || []).map((ex) => {
        const setLogs: SetLog[] = [];
        for (let s = 1; s <= ex.sets; s++) {
          setLogs.push({
            setNumber: s,
            weight: ex.targetWeight || "",
            reps: ex.reps || "10",
            completed: false,
          });
        }
        return {
          workoutExerciseId: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.sets,
          targetReps: ex.reps,
          targetWeight: ex.targetWeight || "",
          rpeTarget: ex.rpeTarget || "",
          restSeconds: ex.restSeconds || 60,
          tempo: ex.tempo || "",
          notes: ex.notes || "",
          videoUrl: ex.videoUrl || "",
          isWarmup: Boolean(ex.isWarmup),
          previousPerformance: ex.previousPerformance || null,
          sets: setLogs,
          exerciseNotes: "",
        };
      });

      setTrackers(initialTrackers);
      setSessionSeconds(0);
      setIsTimerRunning(true);
      setRestSecondsLeft(null);
      setGeneralNotes("");
      setRpe(7);
      setDifficultyRating(3);
      setEnergyRating(4);
      setFeedbackNotes("");
      setShowCelebration(false);
      setCompletedLogSummary(null);
      setActiveVideoUrl(null);
      setErrorMessage("");
    }
  }, [isOpen, workoutDay]);

  // Session Stopwatch
  useEffect(() => {
    if (isOpen && isTimerRunning) {
      stopwatchRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isOpen, isTimerRunning]);

  // Rest Timer
  useEffect(() => {
    if (restSecondsLeft !== null && restSecondsLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [restSecondsLeft]);

  if (!isOpen) return null;

  const startRestTimer = (seconds: number) => {
    setRestTimerTotal(seconds);
    setRestSecondsLeft(seconds);
  };

  const toggleSetCompletion = (exIdx: number, setIdx: number) => {
    setTrackers((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.sets];
      const wasCompleted = updatedSets[setIdx].completed;
      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        completed: !wasCompleted,
      };
      targetEx.sets = updatedSets;
      updated[exIdx] = targetEx;

      // Auto start rest timer on completing a set
      if (!wasCompleted) {
        startRestTimer(targetEx.restSeconds || 60);
      }

      return updated;
    });
  };

  const updateSetWeight = (exIdx: number, setIdx: number, val: string) => {
    setTrackers((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], weight: val };
      targetEx.sets = updatedSets;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const updateSetReps = (exIdx: number, setIdx: number, val: string) => {
    setTrackers((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], reps: val };
      targetEx.sets = updatedSets;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const markAllSetsForExercise = (exIdx: number) => {
    setTrackers((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      targetEx.sets = targetEx.sets.map((s) => ({ ...s, completed: true }));
      updated[exIdx] = targetEx;
      return updated;
    });
    startRestTimer(trackers[exIdx]?.restSeconds || 60);
  };

  // Progress and volume metrics calculation
  const totalSets = trackers.reduce((acc, curr) => acc + curr.sets.length, 0);
  const completedSets = trackers.reduce(
    (acc, curr) => acc + curr.sets.filter((s) => s.completed).length,
    0
  );
  const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Live estimated volume (kg)
  const currentTotalVolume = trackers.reduce((acc, ex) => {
    let exVol = 0;
    ex.sets.forEach((s) => {
      if (s.completed) {
        const w = parseFloat(s.weight.replace(/[^\d.]/g, "")) || parseFloat(ex.targetWeight.replace(/[^\d.]/g, "")) || 0;
        const r = parseFloat(s.reps.replace(/[^\d.]/g, "")) || parseFloat(ex.targetReps.replace(/[^\d.]/g, "")) || 0;
        exVol += w * r;
      }
    });
    return acc + exVol;
  }, 0);

  const formatStopwatch = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinishWorkout = async () => {
    try {
      setSubmitting(true);
      setErrorMessage("");

      const payload = {
        workoutDayId: workoutDay.id,
        programId: programId || workoutDay.programId,
        workoutName: workoutDay.name,
        durationMinutes: Math.max(1, Math.round(sessionSeconds / 60)),
        rpe,
        difficultyRating,
        energyRating,
        feedbackNotes: feedbackNotes.trim(),
        notes: generalNotes.trim(),
        exerciseLogs: trackers.map((t, idx) => {
          const completedSetCount = t.sets.filter((s) => s.completed).length;
          const weightsRecorded = t.sets.map((s) => s.weight || t.targetWeight).join(", ");
          const repsRecorded = t.sets.map((s) => s.reps || t.targetReps).join(", ");

          return {
            workoutExerciseId: t.workoutExerciseId,
            exerciseName: t.name,
            setsCompleted: completedSetCount,
            targetSets: t.targetSets,
            actualWeight: weightsRecorded,
            actualReps: repsRecorded,
            isCompleted: completedSetCount > 0,
            notes: t.exerciseNotes ? t.exerciseNotes.trim() : null,
            orderIndex: idx,
          };
        }),
      };

      const res = await fetch("/api/workouts/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log workout.");
      }

      setCompletedLogSummary(data);
      setShowCelebration(true);
      if (onWorkoutCompleted) {
        onWorkoutCompleted(data.workoutLog);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save workout log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#0B0F15] p-6 text-white shadow-2xl md:p-8 my-8 max-h-[92vh] flex flex-col">
        {/* Celebration & Completion Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[32px] bg-[#0B0F15]/98 p-8 text-center backdrop-blur-md overflow-y-auto">
            <div className="h-20 w-20 rounded-full bg-[#7CFF3B]/20 border border-[#7CFF3B] flex items-center justify-center text-4xl animate-bounce">
              🏆
            </div>
            <h2 className="mt-4 text-3xl font-black text-white">Workout Completed!</h2>
            <p className="mt-2 text-sm text-gray-300 max-w-md">
              Phenomenal effort on <span className="font-bold text-[#7CFF3B]">{workoutDay.name}</span>.
            </p>

            {/* Performance Summary Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Duration</p>
                <p className="mt-1 font-mono text-base font-black text-white">{formatStopwatch(sessionSeconds)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Volume</p>
                <p className="mt-1 font-mono text-base font-black text-[#7CFF3B]">{Math.round(completedLogSummary?.totalVolume || currentTotalVolume)} kg</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Sets Done</p>
                <p className="mt-1 font-mono text-base font-black text-white">{completedSets}/{totalSets}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Completion</p>
                <p className="mt-1 font-mono text-base font-black text-[#7CFF3B]">{completionPercentage}%</p>
              </div>
            </div>

            {completedLogSummary?.isPersonalBest && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-1.5 text-xs font-black text-yellow-300">
                <span>🔥 New Personal Best (PR) Recorded!</span>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
              Your workout metrics and coach feedback have been synced directly to your coach.
            </p>

            <button
              onClick={onClose}
              className="mt-6 rounded-2xl bg-[#7CFF3B] px-8 py-3 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.4)] transition hover:scale-105 hover:bg-[#68e326]"
            >
              Done & Close
            </button>
          </div>
        )}

        {/* Video Demo Modal */}
        {activeVideoUrl && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[32px] bg-black/90 p-6 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#11161D] p-6 text-white">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-bold text-sm">Exercise Demonstration</h3>
                <button
                  onClick={() => setActiveVideoUrl(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>
              <div className="mt-4 aspect-video rounded-2xl bg-black flex items-center justify-center border border-white/10 overflow-hidden">
                {activeVideoUrl.includes("youtube.com") || activeVideoUrl.includes("youtu.be") ? (
                  <iframe
                    src={activeVideoUrl.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-400">Demo Link:</p>
                    <a
                      href={activeVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-xl bg-[#7CFF3B] px-4 py-2 text-xs font-bold text-black"
                    >
                      Open Demo URL ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Live Workout Logger
              </span>
              {workoutDay.weekNumber && (
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                  Week {workoutDay.weekNumber}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {workoutDay.exercises.length} Exercises • {totalSets} Sets
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
              {workoutDay.name}
            </h2>
          </div>

          {/* Stopwatch & Volume & Close */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2">
              <span className="text-xs text-gray-400">⏱ Time:</span>
              <span className="font-mono text-base font-black text-[#7CFF3B]">
                {formatStopwatch(sessionSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2">
              <span className="text-xs text-gray-400">🏋️ Vol:</span>
              <span className="font-mono text-base font-black text-white">
                {Math.round(currentTotalVolume)} kg
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Rest Timer Bar (If Active) */}
        {restSecondsLeft !== null && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-5 py-3 text-sm shrink-0">
            <div className="flex items-center gap-3">
              <span className="animate-pulse text-lg">⏳</span>
              <div>
                <p className="font-bold text-[#7CFF3B]">Rest Timer Active</p>
                <p className="text-xs text-gray-300">Target rest: {restTimerTotal}s</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-white">
                {restSecondsLeft}s
              </span>
              <div className="flex items-center gap-1.5">
                {[30, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => startRestTimer(sec)}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                      restTimerTotal === sec ? "bg-[#7CFF3B] text-black" : "bg-black/40 text-gray-300 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
                <button
                  onClick={() => setRestSecondsLeft(null)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-gray-300 hover:text-white"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-400">
              Workout Progress: {completedSets}/{totalSets} Sets Completed
            </span>
            <span className="text-[#7CFF3B]">{completionPercentage}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#7CFF3B] to-[#58d31a] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Exercises Scrollable List */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-2">
          {trackers.map((ex, exIdx) => {
            const exCompleted = ex.sets.every((s) => s.completed);

            return (
              <div
                key={ex.workoutExerciseId || exIdx}
                className={`rounded-3xl border p-5 transition ${
                  exCompleted
                    ? "border-[#7CFF3B]/30 bg-[#7CFF3B]/5"
                    : "border-white/10 bg-[#11161D]"
                }`}
              >
                {/* Exercise Header */}
                <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-3.5 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {exIdx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                      <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-gray-300">
                        {ex.muscleGroup}
                      </span>
                      {ex.isWarmup && (
                        <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                          🔥 Warm-up Set
                        </span>
                      )}
                      {ex.rpeTarget && (
                        <span className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                          Target: {ex.rpeTarget}
                        </span>
                      )}
                    </div>

                    {/* Progressive Overload Comparison Card */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      {ex.previousPerformance ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-medium text-blue-300">
                          <span>⏮ Previous:</span>
                          <span className="font-bold text-white">
                            {ex.previousPerformance.actualWeight || ex.targetWeight || "BW"} × {ex.previousPerformance.actualReps || ex.targetReps}
                          </span>
                          {ex.previousPerformance.rpe && (
                            <span className="text-[10px] text-blue-200">(@ RPE {ex.previousPerformance.rpe})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">First time logging this exercise</span>
                      )}

                      {ex.tempo && (
                        <span className="text-gray-400 text-xs">Tempo: <span className="font-mono text-white">{ex.tempo}</span></span>
                      )}
                    </div>

                    {ex.notes && (
                      <p className="mt-1.5 text-xs text-yellow-300/90">💡 Coach Cue: {ex.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ex.videoUrl && (
                      <button
                        onClick={() => setActiveVideoUrl(ex.videoUrl!)}
                        className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:text-white"
                        title="Watch Exercise Demo"
                      >
                        🎥 Demo
                      </button>
                    )}
                    <button
                      onClick={() => startRestTimer(ex.restSeconds || 60)}
                      className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:text-white"
                      title="Start Rest Timer"
                    >
                      ⏱ {ex.restSeconds}s Rest
                    </button>
                    <button
                      onClick={() => markAllSetsForExercise(exIdx)}
                      className="rounded-xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/20 px-3 py-1 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20"
                    >
                      ✓ Mark All
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 uppercase tracking-wider">
                        <th className="pb-2 pl-2">Set</th>
                        <th className="pb-2">Target</th>
                        <th className="pb-2">Weight (kg/lbs)</th>
                        <th className="pb-2">Reps Done</th>
                        <th className="pb-2 text-right pr-2">Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ex.sets.map((set, sIdx) => (
                        <tr
                          key={sIdx}
                          className={`transition ${
                            set.completed ? "bg-[#7CFF3B]/5 text-white" : "text-gray-300"
                          }`}
                        >
                          <td className="py-2.5 pl-2 font-bold">{set.setNumber}</td>
                          <td className="py-2.5 text-gray-400">
                            {ex.targetReps} reps {ex.targetWeight ? `@ ${ex.targetWeight}` : ""}
                          </td>
                          <td className="py-2.5">
                            <input
                              type="text"
                              value={set.weight}
                              onChange={(e) => updateSetWeight(exIdx, sIdx, e.target.value)}
                              placeholder={ex.targetWeight || "Weight"}
                              className="w-24 rounded-xl border border-white/10 bg-[#0B0F15] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5">
                            <input
                              type="text"
                              value={set.reps}
                              onChange={(e) => updateSetReps(exIdx, sIdx, e.target.value)}
                              placeholder={ex.targetReps || "Reps"}
                              className="w-20 rounded-xl border border-white/10 bg-[#0B0F15] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 text-right pr-2">
                            <button
                              onClick={() => toggleSetCompletion(exIdx, sIdx)}
                              className={`h-7 w-7 rounded-xl border font-bold text-xs transition ${
                                set.completed
                                  ? "bg-[#7CFF3B] border-[#7CFF3B] text-black shadow-[0_0_10px_rgba(124,255,59,0.4)]"
                                  : "border-white/20 bg-white/5 text-gray-400 hover:border-white/40"
                              }`}
                            >
                              {set.completed ? "✓" : ""}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Workout Feedback & Rating Form */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-5 space-y-5">
            <h4 className="font-bold text-white text-sm">Post-Workout Coach Feedback</h4>

            {/* RPE Selector */}
            <div>
              <label className="text-xs text-gray-400">
                Overall Intensity (RPE): <span className="font-bold text-[#7CFF3B]">{rpe}/10</span>
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRpe(val)}
                    className={`h-9 w-9 rounded-xl text-xs font-bold transition ${
                      rpe === val
                        ? "bg-[#7CFF3B] text-black shadow-[0_0_10px_rgba(124,255,59,0.3)]"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Energy Ratings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-gray-400">Difficulty Rating (1-5)</label>
                <div className="mt-1.5 flex gap-1.5">
                  {[
                    { val: 1, label: "Very Easy" },
                    { val: 2, label: "Easy" },
                    { val: 3, label: "Moderate" },
                    { val: 4, label: "Hard" },
                    { val: 5, label: "Max Effort" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setDifficultyRating(item.val)}
                      className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition ${
                        difficultyRating === item.val
                          ? "bg-[#7CFF3B] text-black font-black"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {item.val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Energy Level (1-5)</label>
                <div className="mt-1.5 flex gap-1.5">
                  {[
                    { val: 1, label: "Drained" },
                    { val: 2, label: "Low" },
                    { val: 3, label: "Normal" },
                    { val: 4, label: "High" },
                    { val: 5, label: "Unstoppable" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setEnergyRating(item.val)}
                      className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition ${
                        energyRating === item.val
                          ? "bg-[#7CFF3B] text-black font-black"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {item.val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note to Coach */}
            <div>
              <label className="text-xs text-gray-400">Feedback Note to Coach</label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="e.g. Bench felt explosive today! Left knee felt a bit tight on the final squat set."
                rows={2}
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white placeholder:text-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 shrink-0">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3 text-xs font-bold text-gray-300 hover:text-white"
          >
            Cancel / Close
          </button>

          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_25px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
          >
            {submitting ? (
              <span>Saving Workout...</span>
            ) : (
              <span>🎉 Complete & Log Workout ({completionPercentage}%)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
