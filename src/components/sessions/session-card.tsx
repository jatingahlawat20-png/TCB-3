"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JoinWindowEvaluation } from "@/lib/video/types";

export interface SessionItemProps {
  id: string;
  title: string;
  description?: string | null;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  duration: number;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "MISSED";
  videoRoomId: string;
  trainerName?: string;
  trainerSpecialty?: string;
  clientName?: string;
  clientEmail?: string;
  isHost?: boolean;
  joinWindow?: JoinWindowEvaluation;
  onStatusChange?: () => void;
}

export function SessionCard({
  id,
  title,
  description,
  scheduledStart,
  scheduledEnd,
  duration,
  status,
  trainerName,
  trainerSpecialty,
  clientName,
  clientEmail,
  isHost,
  joinWindow,
}: SessionItemProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  const opensAt = new Date(start.getTime() - 15 * 60 * 1000);

  const isLive = status === "LIVE" || (now >= opensAt && now <= end && status === "SCHEDULED");
  const isTooEarly = now < opensAt && status !== "LIVE" && status !== "COMPLETED" && status !== "CANCELLED";
  const isConcluded = status === "COMPLETED" || (now > end && status !== "LIVE");

  const minutesUntilStart = Math.ceil((start.getTime() - now.getTime()) / (60 * 1000));
  const minutesUntilOpen = Math.ceil((opensAt.getTime() - now.getTime()) / (60 * 1000));

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <div
      className={`rounded-3xl border p-6 transition-all duration-200 ${
        isLive
          ? "border-[#7CFF3B]/50 bg-[#7CFF3B]/5 shadow-[0_0_40px_rgba(124,255,59,0.15)]"
          : isConcluded
          ? "border-white/5 bg-white/[0.02] opacity-80"
          : "border-white/10 bg-[#11161D] hover:border-white/20"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Main Details */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <span
              className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                isLive
                  ? "bg-[#7CFF3B] text-black animate-pulse"
                  : status === "COMPLETED"
                  ? "bg-green-500/15 text-green-400 border border-green-500/30"
                  : status === "CANCELLED"
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : isTooEarly
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                  : "bg-white/10 text-gray-300"
              }`}
            >
              {isLive
                ? "● Live Now"
                : status === "COMPLETED"
                ? "✓ Completed"
                : status === "CANCELLED"
                ? "Cancelled"
                : `Scheduled (${duration}m)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 text-white font-medium">
              <span>📅</span>
              <span>
                {formatDate(start)} • {formatTime(start)} – {formatTime(end)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>⏱️</span>
              <span>{duration} Minutes</span>
            </div>
            {trainerName && (
              <div className="text-gray-300">
                Coach: <span className="text-[#7CFF3B] font-bold">{trainerName}</span>
                {trainerSpecialty && ` (${trainerSpecialty})`}
              </div>
            )}
            {clientName && (
              <div className="text-gray-300">
                Athlete: <span className="text-white font-bold">{clientName}</span>
                {clientEmail && ` (${clientEmail})`}
              </div>
            )}
          </div>

          {description && (
            <p className="text-xs text-gray-300 rounded-xl bg-black/30 p-3 border border-white/5 line-clamp-2">
              <span className="font-semibold text-gray-400">Workout Plan: </span>
              {description}
            </p>
          )}
        </div>

        {/* Join CTA & Countdown */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isLive ? (
            <Link
              href={`/sessions/${id}/room`}
              className="flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3.5 text-xs font-black text-black shadow-[0_0_30px_rgba(124,255,59,0.4)] transition hover:scale-105 hover:bg-[#6be62b]"
            >
              <span className="h-2 w-2 rounded-full bg-black animate-ping" />
              <span>Join Video Coaching Room →</span>
            </Link>
          ) : isTooEarly ? (
            <div className="text-right">
              <button
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-gray-500"
              >
                Join opens at {formatTime(opensAt)}
              </button>
              <p className="text-[10px] text-gray-400 mt-1">
                {minutesUntilStart > 60
                  ? `Starts in ${Math.floor(minutesUntilStart / 60)}h ${minutesUntilStart % 60}m`
                  : `Starts in ${minutesUntilStart} mins (Opens in ${minutesUntilOpen}m)`}
              </p>
            </div>
          ) : isConcluded ? (
            <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-400">
              Session Concluded
            </span>
          ) : (
            <Link
              href={`/sessions/${id}/room`}
              className="rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black hover:bg-[#68e02d]"
            >
              Enter Room →
            </Link>
          )}

          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <Link href="/messages" className="hover:text-[#7CFF3B] transition">
              Message {isHost ? "Client" : "Coach"} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
