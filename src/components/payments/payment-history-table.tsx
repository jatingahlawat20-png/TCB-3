"use client";

import { useState } from "react";

export interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  packageName: string;
  packageDuration: string;
  trainerName: string;
  trainerEmail?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

interface PaymentHistoryTableProps {
  payments: PaymentItem[];
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#11161D] p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-base font-bold text-white">No payment history yet</h4>
        <p className="mt-1 text-xs text-gray-400">
          When you purchase coaching packages from verified coaches, your receipts and order details will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#11161D]">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Package & Coach</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.map((p) => (
              <tr key={p.id} className="transition hover:bg-white/[0.02]">
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                <td className="px-6 py-4">
                  <p className="font-bold text-white">{p.packageName}</p>
                  <p className="text-xs text-gray-400">
                    Coach: <span className="text-[#7CFF3B]">{p.trainerName}</span> ({p.packageDuration})
                  </p>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-black text-white">₹{p.amount.toLocaleString("en-IN")}</span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {p.status === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Paid
                    </span>
                  ) : p.status === "PENDING" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {p.status}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                  {p.razorpayPaymentId || p.razorpayOrderId.slice(0, 14) + "..."}
                </td>

                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                  >
                    View Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0F14] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7CFF3B]">Official Receipt</span>
                <h3 className="text-lg font-black text-white">TCB-3 Coaching Invoice</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Package:</span>
                <span className="font-bold text-white text-right">{selectedReceipt.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{selectedReceipt.packageDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Assigned Coach:</span>
                <span className="font-semibold text-[#7CFF3B]">{selectedReceipt.trainerName}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-xl font-black text-white">₹{selectedReceipt.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold text-emerald-400">{selectedReceipt.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono text-xs text-gray-300">{selectedReceipt.razorpayOrderId}</span>
              </div>
              {selectedReceipt.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="font-mono text-xs text-gray-300">{selectedReceipt.razorpayPaymentId}</span>
                </div>
              )}
              {selectedReceipt.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Paid Date:</span>
                  <span className="text-xs text-gray-300">
                    {new Date(selectedReceipt.paidAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-white/10"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full rounded-2xl bg-[#7CFF3B] py-3 text-xs font-bold text-black transition hover:bg-[#68e02d]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
