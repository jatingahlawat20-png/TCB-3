"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface TrainerVerificationManagerProps {
  initialTrainers: any[];
}

export function TrainerVerificationManager({
  initialTrainers,
}: TrainerVerificationManagerProps) {
  const [trainers, setTrainers] = useState<any[]>(initialTrainers);
  const [activeTab, setActiveTab] = useState<"PENDING" | "VERIFIED" | "REJECTED" | "ALL">("PENDING");

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derived categories
  const pendingTrainers = trainers.filter(
    (t) => (t.status === "PENDING" || !t.verified) && t.status !== "INACTIVE"
  );
  const verifiedTrainers = trainers.filter((t) => t.status === "ACTIVE" && t.verified);
  const rejectedTrainers = trainers.filter(
    (t) => t.status === "INACTIVE" || t.tags?.some((tag: string) => tag.startsWith("rejection_reason:"))
  );

  const displayedTrainers =
    activeTab === "PENDING"
      ? pendingTrainers
      : activeTab === "VERIFIED"
      ? verifiedTrainers
      : activeTab === "REJECTED"
      ? rejectedTrainers
      : trainers;

  const handleApprove = async (trainerId: string) => {
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/admin/trainers/${trainerId}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to approve trainer.");
      }

      setTrainers((prev) =>
        prev.map((t) =>
          t.id === trainerId || t.userId === trainerId
            ? {
                ...t,
                verified: true,
                status: "ACTIVE",
                tags: t.tags?.filter((tag: string) => !tag.startsWith("rejection_reason:")),
              }
            : t
        )
      );

      setFeedbackMessage({
        type: "success",
        text: data.message || "Trainer approved successfully.",
      });
    } catch (err: any) {
      console.error("Error approving trainer:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to approve trainer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (trainer: any) => {
    setSelectedTrainer(trainer);
    const existingRejectionTag = trainer.tags?.find((t: string) => t.startsWith("rejection_reason:"));
    setRejectReason(existingRejectionTag ? existingRejectionTag.replace("rejection_reason:", "") : "");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedTrainer || !rejectReason.trim()) return;

    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/admin/trainers/${selectedTrainer.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reject trainer.");
      }

      setTrainers((prev) =>
        prev.map((t) =>
          t.id === selectedTrainer.id || t.userId === selectedTrainer.id
            ? {
                ...t,
                verified: false,
                status: "INACTIVE",
                tags: [
                  ...(t.tags?.filter((tag: string) => !tag.startsWith("rejection_reason:")) || []),
                  `rejection_reason:${rejectReason.trim()}`,
                ],
              }
            : t
        )
      );

      setFeedbackMessage({
        type: "success",
        text: `Feedback sent to Coach ${selectedTrainer.user?.name || "Trainer"}. Status set to Needs Changes.`,
      });
      setRejectModalOpen(false);
      setSelectedTrainer(null);
      setRejectReason("");
    } catch (err: any) {
      console.error("Error rejecting trainer:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to record rejection.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold border transition ${
            feedbackMessage.type === "success"
              ? "bg-[#7CFF3B]/10 border-[#7CFF3B]/30 text-[#7CFF3B]"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "PENDING"
              ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          <span>⏳ Pending Review</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">
            {pendingTrainers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("VERIFIED")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "VERIFIED"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_20px_rgba(124,255,59,0.3)]"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          <span>✓ Verified Coaches</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">
            {verifiedTrainers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "REJECTED"
              ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          <span>⚠️ Needs Changes</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">
            {rejectedTrainers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "ALL"
              ? "bg-white text-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          <span>All Trainers</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
            {trainers.length}
          </span>
        </button>
      </div>

      {/* Trainers List */}
      {displayedTrainers.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center text-gray-400">
          <span className="text-4xl mb-2 block">📋</span>
          <h3 className="text-base font-bold text-white">No trainers in this category</h3>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === "PENDING"
              ? "All trainer applications have been reviewed."
              : "No coaches currently match this filter tab."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTrainers.map((t) => {
            const rejectionTag = t.tags?.find((tag: string) => tag.startsWith("rejection_reason:"));
            const currentRejectionReason = rejectionTag ? rejectionTag.replace("rejection_reason:", "") : null;
            const visibleTags = t.tags?.filter((tag: string) => !tag.startsWith("rejection_reason:")) || [];

            return (
              <div
                key={t.id}
                className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8 transition hover:border-white/20"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  {/* Left: Avatar & Coach Details */}
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#080B0F]">
                      {t.avatarUrl ? (
                        <Image
                          src={t.avatarUrl}
                          alt={t.user?.name || "Trainer"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7CFF3B] to-[#1e3b10] text-xl font-bold text-black">
                          {(t.user?.name || "T")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{t.user?.name}</h3>
                        {t.verified ? (
                          <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-0.5 text-[11px] font-bold text-[#7CFF3B]">
                            ✓ Verified Coach
                          </span>
                        ) : t.status === "INACTIVE" ? (
                          <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-0.5 text-[11px] font-bold text-rose-400">
                            ⚠️ Needs Changes
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-0.5 text-[11px] font-bold text-yellow-400">
                            ⏳ Verification Pending
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.user?.email} • {t.specialty || "Fitness & Strength Coach"} • {t.experience || 1} Years Exp • Rate: ₹{t.price || 999}/mo
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {visibleTags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-xs text-gray-300 italic max-w-2xl leading-relaxed">
                        "{t.bio || "No biography provided."}"
                      </p>

                      {currentRejectionReason && (
                        <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                          <strong>Admin Feedback:</strong> {currentRejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                    <Link
                      href={`/trainers/${t.user?.id || t.id}`}
                      target="_blank"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:text-white hover:border-[#7CFF3B]"
                    >
                      View Profile ↗
                    </Link>

                    {!t.verified && (
                      <button
                        onClick={() => handleApprove(t.id)}
                        disabled={actionLoading}
                        className="rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326] disabled:opacity-50"
                      >
                        ✓ Approve & Verify
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRejectModal(t)}
                      disabled={actionLoading}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {t.status === "INACTIVE" ? "Edit Feedback" : "Request Changes"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject / Request Changes Modal */}
      {rejectModalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Request Changes for Coach {selectedTrainer.user?.name}
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Provide constructive feedback to the coach. They will see this feedback in their coach portal and can update their certifications or bio to resubmit.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Feedback / Reason *
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please provide your verified CSCS certification ID and update your coaching methodology details."
                className="w-full rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-sm text-white placeholder-gray-600 focus:border-rose-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="rounded-xl bg-rose-500 px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] transition hover:bg-rose-600 disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Send Feedback & Request Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
