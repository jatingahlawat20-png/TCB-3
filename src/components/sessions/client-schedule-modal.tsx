"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActiveTrainerOption {
  id: string; // trainerProfile.id
  name: string;
  specialty?: string | null;
  packageName?: string;
  coachingRequestId?: string;
}

interface ClientScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrainers: ActiveTrainerOption[];
  onSessionCreated?: (session: any) => void;
}

const QUICK_TITLES = [
  "Strength Training — Form Check & Progression",
  "HIIT & Conditioning Workout",
  "Mobility & Flexibility Assessment",
  "Weekly Program & Progress Review",
  "Technique & Movement Analysis",
];

export function ClientScheduleModal({
  isOpen,
  onClose,
  activeTrainers,
  onSessionCreated,
}: ClientScheduleModalProps) {
  const router = useRouter();

  const [selectedTrainerId, setSelectedTrainerId] = useState(activeTrainers[0]?.id || "");
  const [title, setTitle] = useState(QUICK_TITLES[0]);
  const [customTitle, setCustomTitle] = useState("");
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const [description, setDescription] = useState("");

  const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
  defaultDate.setMinutes(0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const defaultDateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(
    defaultDate.getDate()
  )}`;
  const defaultTimeStr = `${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [timeStr, setTimeStr] = useState(defaultTimeStr);
  const [duration, setDuration] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedTrainerId) {
        throw new Error("Please select an active coach.");
      }

      const finalTitle = useCustomTitle ? customTitle.trim() : title;
      if (!finalTitle) {
        throw new Error("Please enter a session title.");
      }

      if (!dateStr || !timeStr) {
        throw new Error("Please select both a date and start time.");
      }

      const scheduledStart = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(scheduledStart.getTime())) {
        throw new Error("Invalid date and time selected.");
      }

      const trainerObj = activeTrainers.find((t) => t.id === selectedTrainerId);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: selectedTrainerId,
          coachingRequestId: trainerObj?.coachingRequestId,
          title: finalTitle,
          description,
          scheduledStart: scheduledStart.toISOString(),
          duration,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule session");
      }

      if (onSessionCreated) {
        onSessionCreated(data.session);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong scheduling the session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0C1017] shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#111622] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-[#7CFF3B] text-lg font-black">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Book 1-on-1 Coaching Session</h3>
              <p className="text-xs text-gray-400">Schedule real-time video workout with your coach</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
              {error}
            </div>
          )}

          {/* Coach Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Select Coach
            </label>
            {activeTrainers.length > 0 ? (
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
              >
                {activeTrainers.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#111622] text-white">
                    Coach {t.name} {t.specialty ? `(${t.specialty})` : ""} {t.packageName ? `— ${t.packageName}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-400 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                You do not have an active coach yet. Browse coaches and enroll in a package to book video calls.
              </p>
            )}
          </div>

          {/* Session Focus / Title Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Session Focus & Goal
            </label>
            {!useCustomTitle ? (
              <div className="space-y-2">
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                >
                  {QUICK_TITLES.map((t) => (
                    <option key={t} value={t} className="bg-[#111622] text-white">
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomTitle(true)}
                  className="text-xs text-[#7CFF3B] hover:underline"
                >
                  + Write custom session goal
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Squat Form Check & Mobility"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setUseCustomTitle(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ← Pick from presets
                </button>
              </div>
            )}
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              >
                <option value={30} className="bg-[#111622]">30 mins</option>
                <option value={45} className="bg-[#111622]">45 mins</option>
                <option value={60} className="bg-[#111622]">60 mins (1 Hr)</option>
                <option value={90} className="bg-[#111622]">90 mins (1.5 Hr)</option>
              </select>
            </div>
          </div>

          {/* Notes for Coach */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Notes for Coach (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Want to focus on depth and knee tracking on barbell squats."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || activeTrainers.length === 0}
              className="flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Booking...</span>
                </>
              ) : (
                <span>✓ Book Session with Coach</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
