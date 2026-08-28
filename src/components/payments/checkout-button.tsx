"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RazorpaySandboxModal } from "./razorpay-sandbox-modal";

interface CheckoutButtonProps {
  packageId: string;
  packageName: string;
  price: number;
  duration?: string;
  trainerName: string;
  coachingRequestId?: string;
  className?: string;
  buttonText?: string;
  onSuccess?: (payment: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CheckoutButton({
  packageId,
  packageName,
  price,
  duration = "1 Month",
  trainerName,
  coachingRequestId,
  className,
  buttonText,
  onSuccess,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sandbox Modal State
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create order on server (server verifies package price from Prisma DB)
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          coachingRequestId,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        throw new Error(orderData.error || "Failed to initialize payment order");
      }

      setCurrentOrder(orderData);

      // 2. If running with Sandbox / test simulated engine, use the TCB-3 Razorpay Sandbox Modal
      if (orderData.isSandboxFallback) {
        setLoading(false);
        setSandboxModalOpen(true);
        return;
      }

      // 3. If valid live Razorpay credentials, use official checkout.js
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        // Fallback to Sandbox Modal if script loading is blocked
        setLoading(false);
        setSandboxModalOpen(true);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "TCB-3 Fitness",
        description: `${packageName} (${duration}) with Coach ${trainerName}`,
        order_id: orderData.orderId,
        image: "/favicon.ico",
        theme: {
          color: "#7CFF3B",
          backdrop_color: "#080B0F",
        },
        handler: async function (response: any) {
          await handlePaymentVerification({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Checkout initialization error:", err);
      setError(err.message || "Something went wrong initiating checkout");
      setLoading(false);
    }
  };

  const handlePaymentVerification = async (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      setLoading(true);
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentDetails),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment signature verification failed");
      }

      setSandboxModalOpen(false);

      if (onSuccess) {
        onSuccess(verifyData.payment);
      }

      router.push("/dashboard?payment=success");
      router.refresh();
    } catch (err: any) {
      console.error("Payment verification error:", err);
      setError(err.message || "Payment verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className={
            className ||
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-6 py-3 text-sm font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] transition hover:bg-[#68e02d] disabled:opacity-50"
          }
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{buttonText || `Enroll & Pay ₹${price}`}</span>
          )}
        </button>

        {error && (
          <p className="mt-1.5 text-xs text-rose-400 font-semibold">{error}</p>
        )}
      </div>

      {currentOrder && (
        <RazorpaySandboxModal
          isOpen={sandboxModalOpen}
          orderId={currentOrder.orderId}
          amountRupees={currentOrder.amountRupees || price}
          packageName={packageName}
          trainerName={trainerName}
          onClose={() => setSandboxModalOpen(false)}
          onSuccess={handlePaymentVerification}
          onFailure={(failErr) => {
            setError(failErr);
            setSandboxModalOpen(false);
          }}
        />
      )}
    </>
  );
}
