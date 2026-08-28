"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActiveClientOption {
  id: string;
  name: string;
  email: string;
  packageName?: string;
  coachingRequestId?: string;
}

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClients: ActiveClientOption[];
  onSessionCreated?: (session: any) => void;
}

const QUICK_TITLES = [
  "Strength Training — Upper Body",
  "Strength Training — Lower Body & Core",
  "HIIT & Conditioning Circuit",
  "Form Check & Movement Assessment",
  "Mobility, Stretch & Recovery",
  "Weekly Program & Nutrition Review",
];

export function ScheduleSessionModal({
  isOpen,
  onClose,
  activeClients,
  onSessionCreated,
}: ScheduleSessionModalProps) {
  const router = useRouter();

  // Form states
  const [selectedClientId, setSelectedClientId] = useState(activeClients[0]?.id || "");
  const [title, setTitle] = useState(QUICK_TITLES[0]);
  const [customTitle, setCustomTitle] = useState("");
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const [description, setDescription] = useState("");

  // Default to tomorrow 10:00 AM or 1 hour from now
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
      if (!selectedClientId) {
        throw new Error("Please select an active client from your roster.");
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

      const clientObj = activeClients.find((c) => c.id === selectedClientId);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          coachingRequestId: clientObj?.coachingRequestId,
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
              <h3 className="text-lg font-bold text-white">Schedule 1-on-1 Coaching Session</h3>
              <p className="text-xs text-gray-400">Book real-time video programming with your athlete</p>
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

          {/* Client Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Select Client
            </label>
            {activeClients.length > 0 ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
              >
                {activeClients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111622] text-white">
                    {c.name} ({c.email}) {c.packageName ? `— ${c.packageName}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-400 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                You have no active enrolled clients yet. Accept client requests from your dashboard first.
              </p>
            )}
          </div>

          {/* Session Focus / Title Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Session Focus & Title
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
                  + Write custom session title
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Deadlift Technique & Squat Peak"
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

          {/* Agenda / Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Workout Plan / Session Agenda (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 1. Dynamic warmup. 2. Heavy compound sets (5x5). 3. Accessory superset. Bring resistance bands and water."
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
              disabled={loading || activeClients.length === 0}
              className="flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>✓ Confirm & Schedule Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
