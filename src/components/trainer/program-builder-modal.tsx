"use client";

import { useState } from "react";

type ActiveClient = {
  id: string;
  name: string;
  email: string;
  packageName?: string;
};

type ExerciseForm = {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  targetWeight: string;
  rpeTarget: string;
  restSeconds: number;
  tempo: string;
  notes: string;
  videoUrl: string;
  isWarmup: boolean;
};

type WorkoutDayForm = {
  name: string;
  weekNumber: number;
  dayOfWeek: number | null;
  description: string;
  exercises: ExerciseForm[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeClients: ActiveClient[];
  onProgramCreated?: (program: any) => void;
  preselectedClientId?: string;
};

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Biceps",
  "Triceps",
  "Core",
  "Full Body",
];

const DAYS_OF_WEEK = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

export function ProgramBuilderModal({
  isOpen,
  onClose,
  activeClients,
  onProgramCreated,
  preselectedClientId,
}: Props) {
  const [clientId, setClientId] = useState(preselectedClientId || activeClients[0]?.id || "");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [trainingFrequency, setTrainingFrequency] = useState("4 days / week");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE");
  const [weeklyStructure, setWeeklyStructure] = useState("4 Days / Week (Upper/Lower Split)");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const [workoutDays, setWorkoutDays] = useState<WorkoutDayForm[]>([
    {
      name: "Day 1: Upper Body Power",
      weekNumber: 1,
      dayOfWeek: 1,
      description: "Focus on primary compound pressing and pulling movements",
      exercises: [
        {
          name: "Barbell Bench Press",
          muscleGroup: "Chest",
          sets: 4,
          reps: "6-8",
          targetWeight: "80 kg",
          rpeTarget: "RPE 8",
          restSeconds: 90,
          tempo: "3-0-1-0",
          notes: "Explosive concentric, controlled eccentric",
          videoUrl: "",
          isWarmup: false,
        },
        {
          name: "Barbell Bent Over Row",
          muscleGroup: "Back",
          sets: 4,
          reps: "8-10",
          targetWeight: "70 kg",
          rpeTarget: "RPE 8",
          restSeconds: 90,
          tempo: "2-0-1-1",
          notes: "Keep chest up and squeeze lats at the top",
          videoUrl: "",
          isWarmup: false,
        },
        {
          name: "Overhead Dumbbell Press",
          muscleGroup: "Shoulders",
          sets: 3,
          reps: "10-12",
          targetWeight: "22.5 kg",
          rpeTarget: "RPE 7-8",
          restSeconds: 60,
          tempo: "2-0-1-0",
          notes: "Full range of motion",
          videoUrl: "",
          isWarmup: false,
        },
      ],
    },
    {
      name: "Day 2: Lower Body Power",
      weekNumber: 1,
      dayOfWeek: 2,
      description: "Heavy squat and hinge patterns with quad/hamstring focus",
      exercises: [
        {
          name: "Barbell Back Squat",
          muscleGroup: "Quads",
          sets: 4,
          reps: "5-6",
          targetWeight: "100 kg",
          rpeTarget: "RPE 8",
          restSeconds: 120,
          tempo: "3-1-1-0",
          notes: "Hit parallel depth with bracing",
          videoUrl: "",
          isWarmup: false,
        },
        {
          name: "Romanian Deadlift",
          muscleGroup: "Hamstrings",
          sets: 3,
          reps: "8-10",
          targetWeight: "90 kg",
          rpeTarget: "RPE 8",
          restSeconds: 90,
          tempo: "3-0-1-0",
          notes: "Hinge at hips, feel hamstring stretch",
          videoUrl: "",
          isWarmup: false,
        },
      ],
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const addWorkoutDay = () => {
    setWorkoutDays((prev) => [
      ...prev,
      {
        name: `Day ${prev.length + 1}: Workout Routine`,
        weekNumber: 1,
        dayOfWeek: null,
        description: "",
        exercises: [
          {
            name: "",
            muscleGroup: "Full Body",
            sets: 3,
            reps: "10-12",
            targetWeight: "",
            rpeTarget: "RPE 8",
            restSeconds: 60,
            tempo: "",
            notes: "",
            videoUrl: "",
            isWarmup: false,
          },
        ],
      },
    ]);
  };

  const removeWorkoutDay = (dayIdx: number) => {
    if (workoutDays.length <= 1) {
      alert("A program must have at least 1 workout day.");
      return;
    }
    setWorkoutDays((prev) => prev.filter((_, idx) => idx !== dayIdx));
  };

  const updateDayField = (dayIdx: number, field: keyof WorkoutDayForm, val: any) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      copy[dayIdx] = { ...copy[dayIdx], [field]: val };
      return copy;
    });
  };

  const addExercise = (dayIdx: number) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIdx] };
      targetDay.exercises = [
        ...targetDay.exercises,
        {
          name: "",
          muscleGroup: "Chest",
          sets: 3,
          reps: "10-12",
          targetWeight: "",
          rpeTarget: "RPE 8",
          restSeconds: 60,
          tempo: "",
          notes: "",
          videoUrl: "",
          isWarmup: false,
        },
      ];
      copy[dayIdx] = targetDay;
      return copy;
    });
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIdx] };
      if (targetDay.exercises.length <= 1) {
        alert("Each workout day must have at least 1 exercise.");
        return prev;
      }
      targetDay.exercises = targetDay.exercises.filter((_, idx) => idx !== exIdx);
      copy[dayIdx] = targetDay;
      return copy;
    });
  };

  const moveExercise = (dayIdx: number, exIdx: number, direction: "up" | "down") => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIdx] };
      const exercises = [...targetDay.exercises];
      const targetIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
      if (targetIdx < 0 || targetIdx >= exercises.length) return prev;

      const temp = exercises[exIdx];
      exercises[exIdx] = exercises[targetIdx];
      exercises[targetIdx] = temp;

      targetDay.exercises = exercises;
      copy[dayIdx] = targetDay;
      return copy;
    });
  };

  const updateExerciseField = (
    dayIdx: number,
    exIdx: number,
    field: keyof ExerciseForm,
    val: any
  ) => {
    setWorkoutDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIdx] };
      const updatedExercises = [...targetDay.exercises];
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], [field]: val };
      targetDay.exercises = updatedExercises;
      copy[dayIdx] = targetDay;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage("");

      if (!clientId) {
        throw new Error("Please select an active client.");
      }

      if (!name.trim()) {
        throw new Error("Program name is required.");
      }

      if (!goal.trim()) {
        throw new Error("Program goal is required.");
      }

      // Check exercises
      for (let i = 0; i < workoutDays.length; i++) {
        const d = workoutDays[i];
        if (!d.name.trim()) {
          throw new Error(`Day #${i + 1} is missing a title.`);
        }
        for (let j = 0; j < d.exercises.length; j++) {
          const ex = d.exercises[j];
          if (!ex.name.trim()) {
            throw new Error(`Exercise #${j + 1} on Day "${d.name}" is missing a name.`);
          }
        }
      }

      const payload = {
        clientId,
        name: name.trim(),
        goal: goal.trim(),
        durationWeeks,
        trainingFrequency,
        status,
        notes: notes.trim(),
        description: description.trim(),
        weeklyStructure: weeklyStructure.trim(),
        startDate,
        endDate: endDate || null,
        workoutDays,
      };

      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create workout program.");
      }

      if (onProgramCreated) {
        onProgramCreated(data.program);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create workout program.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#0B0F15] p-6 text-white shadow-2xl md:p-8 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Coach Program Builder
              </span>
              <span className="text-xs text-gray-400">Structured Periodization & Progressive Overload</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
              Design Client Training Program
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-8 pr-2 mt-6">
          {/* Section 1: Client & Program Essentials */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">
              1. Program Essentials & Periodization
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Client Selector */}
              <div>
                <label className="text-xs font-bold text-gray-300">
                  Select Active Client <span className="text-red-400">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                >
                  <option value="">-- Choose an active client --</option>
                  {activeClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.packageName ? `• ${c.packageName}` : ""}
                    </option>
                  ))}
                </select>
                {activeClients.length === 0 && (
                  <p className="mt-1 text-[11px] text-yellow-400">
                    ⚠️ You do not have any accepted active clients currently.
                  </p>
                )}
              </div>

              {/* Program Name */}
              <div>
                <label className="text-xs font-bold text-gray-300">
                  Program Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 12-Week Hypertrophy & Strength Split"
                  required
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              {/* Training Goal */}
              <div>
                <label className="text-xs font-bold text-gray-300">
                  Primary Training Goal <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Muscle Hypertrophy & Bench 100kg Progression"
                  required
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              {/* Duration Weeks & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300">Duration (Weeks)</label>
                  <select
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10) || 4)}
                    className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                  >
                    {[2, 4, 6, 8, 10, 12, 16, 20, 24].map((w) => (
                      <option key={w} value={w}>{w} Weeks</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="DRAFT">DRAFT (Save only)</option>
                  </select>
                </div>
              </div>

              {/* Training Frequency */}
              <div>
                <label className="text-xs font-bold text-gray-300">Training Frequency</label>
                <input
                  type="text"
                  value={trainingFrequency}
                  onChange={(e) => setTrainingFrequency(e.target.value)}
                  placeholder="e.g. 4 days / week"
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              {/* Weekly Split Structure */}
              <div>
                <label className="text-xs font-bold text-gray-300">Weekly Routine Split</label>
                <input
                  type="text"
                  value={weeklyStructure}
                  onChange={(e) => setWeeklyStructure(e.target.value)}
                  placeholder="e.g. 4 Days / Week (Upper/Lower Split)"
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              {/* Target End Date */}
              <div>
                <label className="text-xs font-bold text-gray-300">Target End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>
            </div>

            {/* Coach Notes & Overview */}
            <div>
              <label className="text-xs font-bold text-gray-300">Coach Program Guidelines & Periodization Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions on warm-up protocols, progressive overload rules, recovery, tempo..."
                rows={2}
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Workout Days & Exercises */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                2. Workout Days & Exercise Programming ({workoutDays.length})
              </h3>
              <button
                type="button"
                onClick={addWorkoutDay}
                className="rounded-2xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-4 py-2 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20"
              >
                + Add Workout Day
              </button>
            </div>

            {workoutDays.map((day, dIdx) => (
              <div
                key={dIdx}
                className="rounded-3xl border border-white/10 bg-[#11161D] p-6 space-y-4"
              >
                {/* Day Header */}
                <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center">
                  <div className="flex-1 grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-400">
                        Workout Day Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => updateDayField(dIdx, "name", e.target.value)}
                        placeholder="e.g. Day 1: Upper Body Strength"
                        required
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F15] px-3 py-2 text-xs text-white focus:border-[#7CFF3B] focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400">Assigned Day</label>
                      <select
                        value={day.dayOfWeek !== null ? String(day.dayOfWeek) : ""}
                        onChange={(e) =>
                          updateDayField(
                            dIdx,
                            "dayOfWeek",
                            e.target.value === "" ? null : parseInt(e.target.value, 10)
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F15] px-3 py-2 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                      >
                        <option value="">Flexible / Any Day</option>
                        {DAYS_OF_WEEK.map((dow) => (
                          <option key={dow.value} value={dow.value}>
                            {dow.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeWorkoutDay(dIdx)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
                    >
                      Delete Day
                    </button>
                  </div>
                </div>

                {/* Day Exercises List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Prescribed Exercises ({day.exercises.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => addExercise(dIdx)}
                      className="rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300 hover:text-white"
                    >
                      + Add Exercise
                    </button>
                  </div>

                  {day.exercises.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      className="rounded-2xl border border-white/5 bg-[#0B0F15] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveExercise(dIdx, eIdx, "up")}
                              disabled={eIdx === 0}
                              className="text-[10px] text-gray-400 hover:text-white disabled:opacity-20"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExercise(dIdx, eIdx, "down")}
                              disabled={eIdx === day.exercises.length - 1}
                              className="text-[10px] text-gray-400 hover:text-white disabled:opacity-20"
                            >
                              ▼
                            </button>
                          </div>

                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                            {eIdx + 1}
                          </span>

                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "name", e.target.value)
                            }
                            placeholder="Exercise Name (e.g. Barbell Bench Press)"
                            required
                            className="flex-1 rounded-xl border border-white/10 bg-[#11161D] px-3 py-1.5 text-xs text-white focus:border-[#7CFF3B] focus:outline-none font-bold"
                          />
                        </div>

                        <select
                          value={ex.muscleGroup}
                          onChange={(e) =>
                            updateExerciseField(dIdx, eIdx, "muscleGroup", e.target.value)
                          }
                          className="rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1.5 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                        >
                          {MUSCLE_GROUPS.map((mg) => (
                            <option key={mg} value={mg}>
                              {mg}
                            </option>
                          ))}
                        </select>

                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ex.isWarmup}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "isWarmup", e.target.checked)
                            }
                            className="rounded accent-[#7CFF3B]"
                          />
                          <span>Warm-up</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeExercise(dIdx, eIdx)}
                          className="text-gray-500 hover:text-red-400 text-xs px-2"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Sets / Reps / Weight / RPE / Rest / Tempo */}
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-6 text-xs">
                        <div>
                          <label className="text-[10px] text-gray-500">Sets</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={ex.sets}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "sets", parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500">Target Reps</label>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "reps", e.target.value)
                            }
                            placeholder="8-10"
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500">Target Weight</label>
                          <input
                            type="text"
                            value={ex.targetWeight}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "targetWeight", e.target.value)
                            }
                            placeholder="80 kg / BW"
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500">RPE / RIR Target</label>
                          <input
                            type="text"
                            value={ex.rpeTarget}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "rpeTarget", e.target.value)
                            }
                            placeholder="RPE 8"
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500">Rest (seconds)</label>
                          <input
                            type="number"
                            min={15}
                            max={600}
                            step={15}
                            value={ex.restSeconds}
                            onChange={(e) =>
                              updateExerciseField(
                                dIdx,
                                eIdx,
                                "restSeconds",
                                parseInt(e.target.value, 10) || 60
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500">Tempo</label>
                          <input
                            type="text"
                            value={ex.tempo}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "tempo", e.target.value)
                            }
                            placeholder="3-0-1-0"
                            className="w-full rounded-xl border border-white/10 bg-[#11161D] px-2.5 py-1 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Demo Video URL & Coach Cues */}
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <input
                            type="url"
                            value={ex.videoUrl}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "videoUrl", e.target.value)
                            }
                            placeholder="Demo Video URL (YouTube / Loom / Video link)"
                            className="w-full rounded-xl border border-white/5 bg-[#11161D] px-3 py-1 text-[11px] text-gray-300 placeholder:text-gray-600 focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={ex.notes}
                            onChange={(e) =>
                              updateExerciseField(dIdx, eIdx, "notes", e.target.value)
                            }
                            placeholder="Coach cues (e.g. Pause 1s at chest, squeeze at lockout)"
                            className="w-full rounded-xl border border-white/5 bg-[#11161D] px-3 py-1 text-[11px] text-gray-300 placeholder:text-gray-600 focus:border-[#7CFF3B] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col-reverse justify-between gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3 text-xs font-bold text-gray-300 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || activeClients.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_25px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
            >
              {submitting ? "Saving Program..." : status === "ACTIVE" ? "🚀 Deploy Program to Client" : "💾 Save Program Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
