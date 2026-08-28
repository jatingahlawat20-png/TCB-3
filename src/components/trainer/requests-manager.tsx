"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type CoachingRequestItem = {
  id: string;
  clientId: string;
  trainerId: string;
  packageId?: string | null;
  message: string;
  goal: string;
  startDate: Date | string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  isPaid?: boolean;
  createdAt: Date | string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  package?: {
    id: string;
    name: string;
    duration: string;
    price: number;
  } | null;
};

type RequestsManagerProps = {
  initialRequests: CoachingRequestItem[];
};

export function TrainerRequestsManager({ initialRequests }: RequestsManagerProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<CoachingRequestItem[]>(initialRequests);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

  const handleUpdateStatus = async (requestId: string, newStatus: "ACCEPTED" | "REJECTED") => {
    setActionLoading(requestId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/coaching-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${newStatus.toLowerCase()} request`);
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );

      setFeedback({
        id: requestId,
        msg: `Request ${newStatus.toLowerCase()} successfully.`,
        type: "success",
      });

      router.refresh();
    } catch (err: any) {
      setFeedback({
        id: requestId,
        msg: err.message || "Failed to update status",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const acceptedClients = requests.filter((r) => r.status === "ACCEPTED");
  const pastRequests = requests.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED");

  return (
    <div className="space-y-8">
      {/* Incoming Requests Section */}
      <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-white">Incoming Coaching Requests</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and respond to client applications for your coaching tiers
            </p>
          </div>
          <span className="rounded-full bg-[#7CFF3B]/10 text-[#7CFF3B] border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold">
            {pendingRequests.length} Pending
          </span>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="mt-6 divide-y divide-white/10">
            {pendingRequests.map((req) => (
              <div key={req.id} className="py-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{req.client.name}</h3>
                      <span className="rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        Pending Review
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      Email: <span className="text-gray-300 font-medium">{req.client.email}</span> • Target Goal: <span className="text-[#7CFF3B] font-semibold">{req.goal}</span>
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Package: <span className="text-white font-bold">{req.package?.name || "1-on-1 Monthly Coaching"}</span> ({req.package?.duration || "1 Month"} — ₹{req.package?.price || 999})
                    </p>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                      disabled={actionLoading === req.id}
                      className="rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
                    >
                      {actionLoading === req.id ? "Updating..." : "✓ Accept Client"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                      disabled={actionLoading === req.id}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>

                {/* Message Quote */}
                <div className="rounded-2xl border border-white/10 bg-[#0B0F14] p-4 text-xs text-gray-300 leading-relaxed">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Client Message</p>
                  "{req.message}"
                </div>

                {feedback?.id === req.id && (
                  <p
                    className={`text-xs font-semibold ${
                      feedback.type === "success" ? "text-[#7CFF3B]" : "text-red-400"
                    }`}
                  >
                    {feedback.msg}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-500">
            No pending coaching requests right now. When clients request a package, it will appear here.
          </div>
        )}
      </div>

      {/* Active Clients Roster */}
      <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-white">Active Clients Roster</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Athletes currently enrolled in active coaching relationships with you
            </p>
          </div>
          <span className="text-xs text-gray-400 font-semibold">
            {acceptedClients.length} Active
          </span>
        </div>

        {acceptedClients.length > 0 ? (
          <div className="mt-6 divide-y divide-white/10">
            {acceptedClients.map((req) => (
              <div key={req.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7CFF3B]/10 text-lg font-black text-[#7CFF3B] border border-[#7CFF3B]/30">
                    {req.client.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-white text-base">{req.client.name}</h4>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          req.isPaid
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {req.isPaid ? "Active Coaching (Paid)" : "Accepted • Awaiting Payment"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Package: <span className="text-white font-medium">{req.package?.name || "1-on-1 Monthly Coaching"}</span> ({req.package?.duration || "1 Month"} — ₹{req.package?.price || 999}) • Goal: {req.goal}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.isPaid ? `Enrolled & Paid • ${req.client.email}` : `Awaiting Client Checkout • ${req.client.email}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/trainer/clients/${req.clientId}/progress`}
                    className="rounded-xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-4 py-2.5 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20 transition"
                  >
                    Programs & Progress →
                  </Link>
                  <Link
                    href={`/trainer/clients/${req.clientId}/nutrition`}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    🥗 Nutrition →
                  </Link>
                  <Link
                    href={`/messages?clientId=${req.clientId}`}
                    className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                  >
                    Direct Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500">
            No active clients yet. Accept pending requests above to begin coaching relationships.
          </div>
        )}
      </div>

      {/* Past / Rejected Requests History */}
      {pastRequests.length > 0 && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8">
          <h3 className="text-lg font-bold text-white mb-4">Past / Closed Requests</h3>
          <div className="divide-y divide-white/10">
            {pastRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between text-xs text-gray-400">
                <div>
                  <span className="font-semibold text-white">{req.client.name}</span> — {req.goal}
                </div>
                <span className="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 font-bold uppercase">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
