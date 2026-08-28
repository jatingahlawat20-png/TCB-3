"use client";

import { useState } from "react";
import { ScheduleSessionModal } from "./schedule-session-modal";
import { SessionCard } from "./session-card";
import { evaluateJoinWindow } from "@/lib/video";

interface ActiveClientOption {
  id: string;
  name: string;
  email: string;
  packageName?: string;
  coachingRequestId?: string;
}

interface TrainerSessionsManagerProps {
  initialSessions: any[];
  activeClients: ActiveClientOption[];
}

export function TrainerSessionsManager({
  initialSessions,
  activeClients,
}: TrainerSessionsManagerProps) {
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "past">("upcoming");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const upcomingSessions = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "LIVE"
  );

  const todaySessions = sessions.filter((s) => {
    const start = new Date(s.scheduledStart);
    return start >= todayStart && start <= todayEnd && s.status !== "CANCELLED";
  });

  const pastSessions = sessions.filter(
    (s) => s.status === "COMPLETED" || s.status === "CANCELLED" || s.status === "MISSED"
  );

  const handleSessionCreated = (newSession: any) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Action Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 max-w-md">
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
            onClick={() => setActiveTab("today")}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "today"
                ? "bg-[#7CFF3B] text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Today ({todaySessions.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "past"
                ? "bg-[#7CFF3B] text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Past ({pastSessions.length})
          </button>
        </div>

        <button
          onClick={() => setScheduleModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3.5 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] transition hover:scale-105 hover:bg-[#68e326]"
        >
          <span>📅</span>
          <span>+ Schedule 1-on-1 Session</span>
        </button>
      </div>

      {/* Tab 1: Upcoming Sessions */}
      {activeTab === "upcoming" && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
          <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Upcoming Video Sessions</h2>
              <p className="text-xs text-gray-400">All scheduled coaching sessions across your athletes</p>
            </div>
            <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]">
              {upcomingSessions.length} Active
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
                    clientName={session.client?.name || "Client"}
                    clientEmail={session.client?.email}
                    isHost={true}
                    joinWindow={joinEval}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">
              <div className="text-4xl mb-3">📅</div>
              <h4 className="font-bold text-white text-base">No upcoming sessions scheduled</h4>
              <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                Schedule a 1-on-1 coaching video session for any of your enrolled athletes.
              </p>
              <button
                onClick={() => setScheduleModalOpen(true)}
                className="mt-5 inline-block rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black"
              >
                + Schedule Session Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Today's Sessions */}
      {activeTab === "today" && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
          <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Today's Coaching Agenda</h2>
              <p className="text-xs text-gray-400">Sessions scheduled for today</p>
            </div>
            <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]">
              {todaySessions.length} Today
            </span>
          </div>

          {todaySessions.length > 0 ? (
            <div className="space-y-4">
              {todaySessions.map((session) => {
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
                    clientName={session.client?.name || "Client"}
                    clientEmail={session.client?.email}
                    isHost={true}
                    joinWindow={joinEval}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              No sessions scheduled for today. Check upcoming tab or schedule a new session.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Completed / Past Sessions */}
      {activeTab === "past" && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
          <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Completed Sessions Log</h2>
              <p className="text-xs text-gray-400">Historical archive of completed coaching calls</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
              {pastSessions.length} Completed
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
                  clientName={session.client?.name || "Client"}
                  clientEmail={session.client?.email}
                  isHost={true}
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

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        activeClients={activeClients}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
