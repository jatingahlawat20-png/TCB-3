"use client";

export interface LedgerItem {
  id: string;
  grossAmount: number;
  platformFee: number;
  netEarnings: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  packageName: string;
  packageDuration: string;
  clientName: string;
  clientEmail: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

interface EarningsLedgerProps {
  metrics: {
    totalGross: number;
    totalPlatformFee: number;
    totalNetEarnings: number;
    paidCount: number;
  };
  ledger: LedgerItem[];
}

export function EarningsLedger({ metrics, ledger }: EarningsLedgerProps) {
  return (
    <div className="space-y-8">
      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Gross</span>
            <span className="rounded-full bg-white/5 p-2 text-[#7CFF3B]">₹</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">₹{metrics.totalGross.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-gray-400">Total volume before platform commission</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Platform Fee (10%)</span>
            <span className="rounded-full bg-white/5 p-2 text-amber-400">⚙</span>
          </div>
          <p className="mt-4 text-3xl font-black text-amber-400">₹{metrics.totalPlatformFee.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-gray-400">TCB-3 software & hosting allocation</p>
        </div>

        <div className="rounded-3xl border border-[#7CFF3B]/20 bg-[#11161D] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-[#7CFF3B]/5 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CFF3B]">Net Earnings</span>
            <span className="rounded-full bg-[#7CFF3B]/10 p-2 text-[#7CFF3B]">✓</span>
          </div>
          <p className="mt-4 text-3xl font-black text-[#7CFF3B]">₹{metrics.totalNetEarnings.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-gray-400">Net payout payable to your account</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Paid Enrollments</span>
            <span className="rounded-full bg-white/5 p-2 text-blue-400">★</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{metrics.paidCount}</p>
          <p className="mt-1 text-xs text-gray-400">Active paid coaching package orders</p>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="rounded-3xl border border-white/10 bg-[#11161D] overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Earnings Ledger & Transactions</h3>
            <p className="text-xs text-gray-400">Immutable record of client purchases and fee deductions</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
            {ledger.length} Transactions
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm font-medium text-white">No earnings recorded yet</p>
            <p className="mt-1 text-xs text-gray-400">
              When clients purchase your 1-Month, 3-Month, or 6-Month coaching packages, records appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Gross Amount</th>
                  <th className="px-6 py-4">Fee (10%)</th>
                  <th className="px-6 py-4">Net Payout</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{item.clientName}</p>
                      <p className="text-xs text-gray-400">{item.clientEmail}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{item.packageName}</p>
                      <p className="text-xs text-[#7CFF3B]">{item.packageDuration}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-white">₹{item.grossAmount.toLocaleString("en-IN")}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-amber-400">
                      -₹{item.platformFee.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-black text-[#7CFF3B]">₹{item.netEarnings.toLocaleString("en-IN")}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                      {item.razorpayPaymentId || item.razorpayOrderId.slice(0, 12) + "..."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
