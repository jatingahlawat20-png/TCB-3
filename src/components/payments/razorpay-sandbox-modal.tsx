"use client";

import { useState } from "react";

interface RazorpaySandboxModalProps {
  isOpen: boolean;
  orderId: string;
  amountRupees: number;
  packageName: string;
  trainerName: string;
  onClose: () => void;
  onSuccess: (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: string) => void;
}

export function RazorpaySandboxModal({
  isOpen,
  orderId,
  amountRupees,
  packageName,
  trainerName,
  onClose,
  onSuccess,
  onFailure,
}: RazorpaySandboxModalProps) {
  const [activeTab, setActiveTab] = useState<"card" | "upi" | "netbanking">("card");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [cardCvv, setCardCvv] = useState("123");
  const [upiId, setUpiId] = useState("success@razorpay");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = (success: boolean) => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        onSuccess({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: "simulated_valid_test_signature",
        });
      } else {
        if (onFailure) {
          onFailure("Test payment simulated failure / user declined authorization");
        }
        onClose();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#0C1017] shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
        {/* Razorpay Brand Header */}
        <div className="border-b border-white/10 bg-[#111622] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-[#7CFF3B] font-black text-lg">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">Razorpay</span>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                    Test Mode
                  </span>
                </div>
                <p className="text-xs text-gray-400">TCB-3 Secure Checkout</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Package & Price Summary */}
          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Selected Package</p>
              <p className="text-sm font-bold text-white mt-0.5">{packageName}</p>
              <p className="text-xs text-[#7CFF3B]">Coach: {trainerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Amount Due</p>
              <p className="text-2xl font-black text-white">₹{amountRupees.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-6">
          <div className="flex rounded-2xl border border-white/10 bg-white/[0.02] p-1 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "card"
                  ? "bg-[#7CFF3B] text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              💳 Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upi")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "upi"
                  ? "bg-[#7CFF3B] text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📱 UPI / QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("netbanking")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "netbanking"
                  ? "bg-[#7CFF3B] text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🏦 NetBanking
            </button>
          </div>

          {/* Tab 1: Card */}
          {activeTab === "card" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Test Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                  placeholder="4111 1111 1111 1111"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: UPI */}
          {activeTab === "upi" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Test Virtual Payment Address (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
                  placeholder="success@razorpay"
                />
              </div>
              <p className="text-xs text-gray-400">
                Use <code className="text-[#7CFF3B]">success@razorpay</code> for an approved test payment or <code className="text-rose-400">failure@razorpay</code> to simulate authorization failure.
              </p>
            </div>
          )}

          {/* Tab 3: NetBanking */}
          {activeTab === "netbanking" && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Select Test Bank
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {["HDFC", "State Bank of India", "ICICI Bank", "Axis Bank"].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                      selectedBank === bank
                        ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Actions */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => handleSimulatePayment(true)}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] py-3.5 text-sm font-bold text-black shadow-[0_0_30px_rgba(124,255,59,0.3)] transition hover:bg-[#68e02d] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Processing Test Payment...</span>
                </>
              ) : (
                <span>Pay ₹{amountRupees.toLocaleString("en-IN")} (Test Mode)</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <button
                type="button"
                onClick={() => handleSimulatePayment(false)}
                disabled={isProcessing}
                className="text-rose-400 hover:underline"
              >
                Simulate Payment Failure
              </button>
              <span>Order Ref: {orderId.slice(0, 14)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
