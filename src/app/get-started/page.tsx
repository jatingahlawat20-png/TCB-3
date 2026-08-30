"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";

export default function GetStartedPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">(
    pathname === "/login" ? "login" : "signup"
  );
  const [role, setRole] = useState<"CLIENT" | "TRAINER">("CLIENT");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect already authenticated users
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const dest =
              data.user.role === "TRAINER"
                ? "/trainer/dashboard"
                : data.user.role === "ADMIN"
                ? "/admin"
                : "/dashboard";
            router.replace(dest);
          }
        }
      } catch {
        // ignore
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account");
        }
        const target = data.redirectTo || (role === "TRAINER" ? "/trainer/onboarding" : "/dashboard");
        setSuccessMsg(
          role === "TRAINER"
            ? "Account created! Redirecting to coach onboarding..."
            : "Account created! Redirecting to your dashboard..."
        );
        setTimeout(() => {
          router.push(target);
          router.refresh();
        }, 800);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to sign in");
        }
        const target = data.redirectTo || "/dashboard";
        setSuccessMsg("Login successful! Redirecting to your dashboard...");
        setTimeout(() => {
          router.push(target);
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-24">
        <div className="hero-glow" />

        <div className="mx-auto max-w-xl px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[36px] border border-white/10 bg-[#11161D] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block rounded-full bg-[#7CFF3B]/10 px-4 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                TCB-3 Onboarding
              </span>
              <h1 className="mt-4 text-3xl font-black md:text-4xl">
                {mode === "signup" ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {mode === "signup"
                  ? "Start your 3-day complimentary chat with top certified coaches."
                  : "Sign in to access your coaching relationships and plans."}
              </p>
            </div>

            {/* Mode Toggle (Sign Up vs Sign In) */}
            <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-[#080B0F] p-1.5 mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === "signup"
                    ? "bg-[#7CFF3B] text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-[#7CFF3B] text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Role Selection for Sign Up */}
            {mode === "signup" && (
              <div className="mb-6 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  I want to join as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CLIENT")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-bold transition ${
                      role === "CLIENT"
                        ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B]"
                        : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <span>🏃‍♂️</span> Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("TRAINER")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-bold transition ${
                      role === "TRAINER"
                        ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B]"
                        : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <span>🏋️</span> Trainer
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-2xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 p-4 text-sm text-[#7CFF3B] font-semibold">
                ✓ {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Kapoor"
                    className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#7CFF3B] py-4 text-base font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#68e326] hover:shadow-[0_0_30px_rgba(124,255,59,0.3)] disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : mode === "signup"
                  ? "Create Free Account →"
                  : "Sign In →"}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-gray-500">
              By proceeding, you agree to TCB-3's Terms of Service and Privacy Policy.
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
