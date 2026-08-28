"use client";

import { useState } from "react";
import Link from "next/link";
import { ProgramBuilderModal } from "./program-builder-modal";

type ActiveClient = {
  id: string;
  name: string;
  email: string;
  packageName?: string;
};

type WorkoutExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  targetWeight: string | null;
  restSeconds: number;
};

type WorkoutDay = {
  id: string;
  name: string;
  dayOfWeek: number | null;
  exercises: WorkoutExercise[];
};

type WorkoutProgram = {
  id: string;
  name: string;
  description: string | null;
  goal: string;
  startDate: string;
  endDate: string | null;
  weeklyStructure: string | null;
  isActive: boolean;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  workoutDays: WorkoutDay[];
  workoutLogs?: any[];
};

type Props = {
  initialPrograms: WorkoutProgram[];
  activeClients: ActiveClient[];
};

export function TrainerProgramsView({ initialPrograms, activeClients }: Props) {
  const [programs, setPrograms] = useState<WorkoutProgram[]>(initialPrograms);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleProgramCreated = (newProgram: WorkoutProgram) => {
    setPrograms((prev) => [newProgram, ...prev]);
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this workout program?")) return;

    try {
      setDeletingId(programId);
      const res = await fetch(`/api/programs/${programId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete program.");
      }

      setPrograms((prev) => prev.filter((p) => p.id !== programId));
    } catch (err: any) {
      alert(err.message || "Could not delete program.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.goal.toLowerCase().includes(q) ||
      p.client.name.toLowerCase().includes(q) ||
      p.client.email.toLowerCase().includes(q)
    );
  });

  const activeProgramsCount = programs.filter((p) => p.isActive).length;

  return (
    <div className="space-y-8">
      {/* Top Metrics & Actions Bar */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Programs Deployed
          </p>
          <p className="mt-2 text-3xl font-black text-white">{programs.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Active Programs
          </p>
          <p className="mt-2 text-3xl font-black text-[#7CFF3B]">{activeProgramsCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Enrolled Athletes
            </p>
            <p className="mt-1 text-2xl font-black text-white">{activeClients.length} Active Clients</p>
          </div>
          <button
            onClick={() => {
              setSelectedClientId("");
              setIsBuilderOpen(true);
            }}
            disabled={activeClients.length === 0}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-black text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] hover:bg-[#68e326] transition disabled:opacity-50"
          >
            + Create New Program
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs by name, client, or goal..."
            className="w-full rounded-2xl border border-white/10 bg-[#11161D] px-4 py-3 text-xs text-white placeholder:text-gray-500 focus:border-[#7CFF3B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedClientId("");
              setIsBuilderOpen(true);
            }}
            disabled={activeClients.length === 0}
            className="rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.25)] hover:bg-[#68e326] transition disabled:opacity-50"
          >
            + Build Program
          </button>
        </div>
      </div>

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">
            🏋️‍♂️
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">No Programs Found</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? "No programs matched your search query."
              : "You have not created any training programs yet. Click Create New Program to prescribe a routine for an enrolled athlete."}
          </p>
          {activeClients.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-black text-black hover:bg-[#68e326]"
              >
                + Build First Program
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => {
            const totalExercises = program.workoutDays.reduce(
              (acc, curr) => acc + (curr.exercises?.length || 0),
              0
            );

            return (
              <div
                key={program.id}
                className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md transition hover:border-white/20"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        program.isActive
                          ? "bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-[#7CFF3B]"
                          : "bg-white/5 border border-white/10 text-gray-400"
                      }`}
                    >
                      {program.isActive ? "● Active Program" : "Archived"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {program.weeklyStructure || `${program.workoutDays.length} Days / Wk`}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 font-black text-sm text-white">
                      {program.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{program.client.name}</h4>
                      <p className="text-[11px] text-gray-400">{program.client.email}</p>
                    </div>
                  </div>

                  {/* Program Title & Goal */}
                  <div className="mt-4 space-y-1">
                    <h3 className="text-xl font-bold text-white">{program.name}</h3>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      <span className="text-[#7CFF3B] font-semibold">Goal:</span> {program.goal}
                    </p>
                  </div>

                  {/* Program Structure Details */}
                  <div className="mt-4 rounded-2xl bg-[#0B0F15] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Workout Days:</span>
                      <span className="font-bold text-white">{program.workoutDays.length} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Total Exercises:</span>
                      <span className="font-bold text-white">{totalExercises} Movements</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Start Date:</span>
                      <span className="font-bold text-white">
                        {new Date(program.startDate).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <Link
                    href={`/trainer/clients/${program.client.id}/progress`}
                    className="flex-1 text-center rounded-2xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 py-3 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20 transition"
                  >
                    View Progress & Logs →
                  </Link>

                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    disabled={deletingId === program.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition text-xs"
                    title="Delete Program"
                  >
                    {deletingId === program.id ? "..." : "🗑"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Builder Modal */}
      {isBuilderOpen && (
        <ProgramBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          activeClients={activeClients}
          onProgramCreated={handleProgramCreated}
          preselectedClientId={selectedClientId}
        />
      )}
    </div>
  );
}
