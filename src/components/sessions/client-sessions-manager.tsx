"use client";

import { useState } from "react";
import { ClientScheduleModal } from "./client-schedule-modal";
import { SessionCard } from "./session-card";
import { evaluateJoinWindow } from "@/lib/video";
import Link from "next/link";

interface ActiveTrainerOption {
  id: string;
  name: string;
  specialty?: string | null;
  packageName?: string;
  coachingRequestId?: string;
}

interface ClientSessionsManagerProps {
  initialSessions: any[];
  activeTrainers: ActiveTrainerOption[];
}

export function ClientSessionsManager({
  initialSessions,
  activeTrainers,
}: ClientSessionsManagerProps) {
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const upcomingSessions = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "LIVE"
  );

  const pastSessions = sessions.filter(
    (s) => s.status === "COMPLETED" || s.status === "CANCELLED" || s.status === "MISSED"
  );

  const handleSessionCreated = (newSession: any) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Top Tabs & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 max-w-xs">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "upcoming"
                ? "bg-[#7CFF3B] text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "past"
                ? "bg-[#7CFF3B] text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Past Logs ({pastSessions.length})
          </button>
        </div>

        {activeTrainers.length > 0 ? (
          <button
            onClick={() => setBookModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3.5 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] transition hover:scale-105 hover:bg-[#68e326]"
          >
            <span>📅</span>
            <span>+ Book Video Session with Coach</span>
          </button>
        ) : (
          <Link
            href="/trainers"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3.5 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] hover:bg-[#68e326]"
          >
            <span>🏋️‍♂️</span>
            <span>Find & Enroll with a Coach →</span>
          </Link>
        )}
      </div>

      {/* Tab 1: Upcoming & Live Sessions */}
      {activeTab === "upcoming" && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Upcoming & Live Sessions</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Join within 15 minutes of scheduled start time
              </p>
            </div>
            <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]">
              {upcomingSessions.length} Scheduled
            </span>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const joinEval = evaluateJoinWindow(
                  session.scheduledStart,
                  session.scheduledEnd,
                  session.status
                );
                return (
                  <SessionCard
                    key={session.id}
                    id={session.id}
                    title={session.title}
                    description={session.description}
                    scheduledStart={session.scheduledStart}
                    scheduledEnd={session.scheduledEnd}
                    duration={session.duration}
                    status={session.status}
                    videoRoomId={session.videoRoomId}
                    trainerName={session.trainer?.user?.name || "Coach"}
                    trainerSpecialty={session.trainer?.specialty || "Certified Trainer"}
                    isHost={false}
                    joinWindow={joinEval}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">
              <div className="text-4xl mb-3">📅</div>
              <h4 className="font-bold text-white text-base">No upcoming video sessions scheduled</h4>
              <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                {activeTrainers.length > 0
                  ? "Book a 1-on-1 video coaching session directly with your coach above."
                  : "Enroll in a coaching package to schedule live 1-on-1 video programming."}
              </p>
              {activeTrainers.length > 0 ? (
                <button
                  onClick={() => setBookModalOpen(true)}
                  className="mt-5 inline-block rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black"
                >
                  + Book Session with Coach
                </button>
              ) : (
                <Link
                  href="/trainers"
                  className="mt-5 inline-block rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black"
                >
                  Browse Coaches →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Past Sessions */}
      {activeTab === "past" && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Completed & Past Sessions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Historical log of completed workouts</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
              {pastSessions.length} Past
            </span>
          </div>

          {pastSessions.length > 0 ? (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  description={session.description}
                  scheduledStart={session.scheduledStart}
                  scheduledEnd={session.scheduledEnd}
                  duration={session.duration}
                  status={session.status}
                  videoRoomId={session.videoRoomId}
                  trainerName={session.trainer?.user?.name || "Coach"}
                  trainerSpecialty={session.trainer?.specialty || "Certified Trainer"}
                  isHost={false}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              No past sessions on record yet. Completed sessions will automatically archive here.
            </div>
          )}
        </div>
      )}

      {/* Book Session Modal */}
      <ClientScheduleModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        activeTrainers={activeTrainers}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
