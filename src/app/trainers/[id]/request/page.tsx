"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { trainers as staticTrainers, type Trainer } from "@/data/trainers";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";

type RequestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function CoachingRequestForm({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPackageId = searchParams.get("packageId") || "";

  const initialTrainer = staticTrainers.find((item) => String(item.id) === id) || null;
  const [trainer, setTrainer] = useState<Trainer | null>(initialTrainer);
  const [loadingTrainer, setLoadingTrainer] = useState(!initialTrainer);

  const [message, setMessage] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(initialTrainer?.tags[0] || "Strength");
  const [selectedPackage, setSelectedPackage] = useState(initialPackageId);
  const [startDate, setStartDate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/trainers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.trainer) {
          setTrainer(data.trainer);
          if (!selectedGoal && data.trainer.tags?.[0]) {
            setSelectedGoal(data.trainer.tags[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching trainer for request:", err);
      })
      .finally(() => {
        setLoadingTrainer(false);
      });
  }, [id, selectedGoal]);

  if (loadingTrainer) {
    return (
      <div className="py-20 text-center text-gray-400">
        Loading coach details...
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="py-20 text-center text-gray-400">
        <h2 className="text-xl font-bold text-white">Trainer Not Found</h2>
        <p className="mt-2 text-sm">We couldn't find the requested coach.</p>
        <Link href="/trainers" className="mt-4 inline-block text-[#7CFF3B] underline">
          ← Back to All Trainers
        </Link>
      </div>
    );
  }

  const packagesList = (trainer.packages && trainer.packages.length > 0)
    ? trainer.packages
    : [
        { id: "1-month", name: "1-on-1 Monthly Coaching", price: trainer.price || 999, duration: "1 Month" },
        { id: "3-month", name: "3-Month Transformation", price: 2499, duration: "3 Months" },
        { id: "6-month", name: "Elite Performance & Prep", price: 4499, duration: "6 Months" },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/coaching-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: trainer.id,
          packageId: selectedPackage || packagesList[0]?.id,
          message,
          goal: selectedGoal || "General Fitness",
          startDate: startDate || new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/login?redirect=/trainers/${trainer.id}/request`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit coaching request");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 md:px-8">
      <div className="mb-8">
        <Link
          href={`/trainers/${trainer.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-[#7CFF3B]"
        >
          ← Back to {trainer.name}'s Profile
        </Link>

        <h1 className="mt-6 text-4xl font-black md:text-5xl">
          Request Coaching with {trainer.name}
        </h1>

        <p className="mt-3 max-w-2xl text-base text-gray-400">
          Tell your coach about your current routine, targets, and lifting history. Every plan includes a 3-day complimentary chat.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="rounded-[36px] border border-[#7CFF3B]/30 bg-[#11161D] p-10 md:p-14 text-center shadow-[0_20px_70px_rgba(124,255,59,0.12)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#7CFF3B]/20 text-4xl text-[#7CFF3B]">
            ✓
          </div>
          <h2 className="text-3xl font-black text-white">
            Request Sent Successfully!
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-gray-300 leading-relaxed">
            Your message has been sent to <span className="font-bold text-[#7CFF3B]">{trainer.name}</span>. Track the status and responses directly in your Client Dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 font-bold text-black transition hover:scale-105"
            >
              Go to Client Dashboard →
            </Link>
            <Link
              href="/trainers"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-3.5 font-bold text-white transition hover:border-[#7CFF3B]"
            >
              Browse Other Coaches
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-[36px] border border-white/10 bg-[#11161D] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Trainer Banner Summary */}
          <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#7CFF3B]/30 bg-[#0d1217]">
              {trainer.image ? (
                <Image
                  src={trainer.image}
                  alt={trainer.name}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7CFF3B] to-[#315b17] text-xl font-black text-black">
                  {trainer.name[0]}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">{trainer.name}</h2>
              <p className="text-sm text-gray-400">{trainer.specialty}</p>
              <p className="mt-1 text-xs text-yellow-400 font-semibold">
                ★ {trainer.rating} • {trainer.experience} Experience • Starting at ₹{trainer.price}/mo
              </p>
            </div>
          </div>

          {/* Coaching Package Selector */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
              Select Coaching Package
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {packagesList.map((pkg) => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`flex flex-col text-left rounded-2xl border p-4 transition ${
                    selectedPackage === pkg.id || (!selectedPackage && pkg === packagesList[0])
                      ? "border-[#7CFF3B] bg-[#7CFF3B]/10 shadow-[0_0_20px_rgba(124,255,59,0.15)]"
                      : "border-white/10 bg-[#0B0F14] hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold text-[#7CFF3B] uppercase">{pkg.duration}</span>
                  <span className="mt-1 font-bold text-white text-sm">{pkg.name}</span>
                  <span className="mt-2 text-lg font-black text-white">₹{pkg.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Pills */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              Primary Fitness Goal
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {trainer.tags.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  onClick={() => setSelectedGoal(goal)}
                  className={`flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    selectedGoal === goal
                      ? "border-[#7CFF3B] bg-[#7CFF3B]/15 text-[#7CFF3B] font-bold"
                      : "border-white/10 bg-[#0B0F14] text-gray-300 hover:border-white/20"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Message */}
          <div>
            <label
              htmlFor="message"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300"
            >
              Personal Message & Lifting Background
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi Coach ${trainer.name.split(" ")[0]}, I am looking for structured programming to achieve...`}
              className="w-full resize-none rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#7CFF3B]"
            />
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300"
            >
              Target Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-4 text-white outline-none focus:border-[#7CFF3B]"
            />
          </div>

          {/* Benefit Box */}
          <div className="rounded-2xl border border-[#7CFF3B]/20 bg-[#7CFF3B]/5 p-5">
            <p className="font-bold text-[#7CFF3B]">
              ✓ 3-Day Complimentary Chat Included
            </p>
            <p className="mt-1.5 text-xs leading-5 text-gray-400">
              When {trainer.name} accepts, your 3-day trial period starts immediately. No payment or subscription starts until you decide.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#7CFF3B] py-4 text-base font-bold text-black transition-all hover:scale-[1.01] hover:bg-[#68e326] hover:shadow-[0_0_35px_rgba(124,255,59,0.3)] disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Send Coaching Request →"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Zero payment or card details required.
          </p>
        </form>
      )}
    </section>
  );
}

export default function CoachingRequestPage({ params }: RequestPageProps) {
  const { id } = use(params);

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading form...</div>}>
        <CoachingRequestForm id={id} />
      </Suspense>
      <Footer />
    </main>
  );
}