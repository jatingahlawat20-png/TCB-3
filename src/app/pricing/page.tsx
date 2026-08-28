"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      name: "3-Day Free Discovery",
      tag: "Trial",
      priceMonthly: "₹0",
      priceQuarterly: "₹0",
      period: "3-day complimentary window",
      description:
        "Connect with any verified trainer, discuss your targets, review coaching expectations, and test compatibility before paying.",
      features: [
        "1-on-1 direct chat with chosen trainer",
        "Initial fitness & diet assessment",
        "Review sample weekly workout split",
        "Zero credit card or payment required",
        "Option to select multiple specialists",
      ],
      cta: "Explore Coaches & Chat Free",
      popular: false,
    },
    {
      name: "1-on-1 Monthly Coaching",
      tag: "Most Popular",
      priceMonthly: "₹999",
      priceQuarterly: "₹849",
      period: "per month",
      description:
        "Complete personalized training and nutrition coaching tailored directly to your physical transformation goals.",
      features: [
        "Fully customized workout programming",
        "Personalized calorie & macro targets",
        "Weekly form checks via video upload",
        "Direct text & audio messaging",
        "Weekly metric & photo progress review",
        "Routine adjustments every 2-4 weeks",
      ],
      cta: "Find a Monthly Coach",
      popular: true,
    },
    {
      name: "3-Month Transformation",
      tag: "Best Value",
      priceMonthly: "₹2,499",
      priceQuarterly: "₹2,499",
      period: "for 3 months",
      description:
        "High-touch intensive coaching with daily accountability, advanced periodization, and competitive peaking protocols.",
      features: [
        "Everything in 1-on-1 Monthly Coaching",
        "Complete 12-week progressive overload split",
        "Weekly technique video analysis",
        "Bi-weekly nutritional adjustments",
        "Priority message response (< 2 hours)",
        "Milestone physique & 1RM tracking",
      ],
      cta: "Browse Transformation Specialists",
      popular: false,
    },
  ];

  const comparisonRows = [
    { feature: "3-Day Complimentary Chat", trial: "✓", monthly: "✓", elite: "✓" },
    { feature: "Custom Workout Programming", trial: "Sample only", monthly: "Full Custom", elite: "Periodized & Peaked" },
    { feature: "Nutrition & Macro Guidance", trial: "Macro review", monthly: "Targeted Plan", elite: "Daily Meal Feedback" },
    { feature: "Form Check Video Uploads", trial: "—", monthly: "Weekly (5 vids)", elite: "Unlimited" },
    { feature: "Check-in Frequency", trial: "Daily during trial", monthly: "Weekly structured", elite: "Daily accountability" },
    { feature: "Response Time SLA", trial: "< 6 hours", monthly: "< 4 hours", elite: "< 2 hours Priority" },
    { feature: "Progress Graph Analytics", trial: "Basic", monthly: "Full Suite", elite: "Full Suite + 1RM" },
  ];

  const faqs = [
    {
      q: "How does the 3-day complimentary chat work?",
      a: "When you send a coaching request to a trainer, once accepted, a private 3-day chat window activates immediately. You can share your goals, injury background, schedule, and training history freely. No payment is charged during these 3 days.",
    },
    {
      q: "Do individual trainers set their own rates?",
      a: "Yes! While our baseline guide starts around ₹999/month, each trainer publishes their exact rates on their profile based on their credentials, coaching load, and specialization.",
    },
    {
      q: "Can I switch trainers or work with more than one coach?",
      a: "Absolutely. TCB-3 gives you complete flexibility. You can work with a Strength Coach for powerlifting and a Nutrition Specialist simultaneously, or switch coaches if your fitness goals change.",
    },
    {
      q: "Are there any lock-in contracts or cancellation penalties?",
      a: "Never. All coaching packages operate on a flexible cycle. You can renew, pause, or cancel at the end of each billing period without any hidden fees.",
    },
    {
      q: "What happens if a trainer does not meet their response commitments?",
      a: "All active coaches adhere to our response SLAs. If an issue occurs, our platform support mediates immediately with full payment escrow protection.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="hero-glow" />
        <div className="mx-auto max-w-7xl px-6 md:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
              Transparent & Coach-Owned
            </span>
            <h1 className="mt-6 text-5xl font-black md:text-7xl leading-tight">
              Invest in Your Physique, <br />
              <span className="text-[#7CFF3B]">Not Generic Templates.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
              Every coaching journey begins with a 3-day complimentary chat. Commit to paid coaching only when you're 100% confident in your coach.
            </p>

            {/* Billing Toggle */}
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#11161D] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.3)]"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  billingCycle === "quarterly"
                    ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.3)]"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <span>Quarterly (3 Mo)</span>
                <span className="rounded-full bg-[#7CFF3B]/20 text-[#7CFF3B] text-[10px] px-2 py-0.5 font-extrabold border border-[#7CFF3B]/30">
                  SAVE 15%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const displayPrice =
              billingCycle === "monthly"
                ? plan.priceMonthly
                : plan.priceQuarterly;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-[36px] border p-8 md:p-10 transition-all duration-300 ${
                  plan.popular
                    ? "border-[#7CFF3B] bg-gradient-to-b from-[#142316] to-[#11161D] shadow-[0_25px_70px_rgba(124,255,59,0.15)] -translate-y-2"
                    : "border-white/10 bg-[#11161D] hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7CFF3B] px-5 py-1 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(124,255,59,0.4)]">
                    {plan.tag}
                  </span>
                )}

                <div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-3 text-sm text-gray-400 min-h-[44px]">
                    {plan.description}
                  </p>

                  <div className="mt-8 border-y border-white/10 py-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white">
                        {displayPrice}
                      </span>
                      <span className="text-sm text-gray-400">/{plan.period}</span>
                    </div>
                    {billingCycle === "quarterly" && plan.priceMonthly !== "₹0" && (
                      <p className="mt-2 text-xs text-[#7CFF3B]">
                        Billed quarterly • Save 15% upfront
                      </p>
                    )}
                  </div>

                  <ul className="mt-8 space-y-3.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-gray-200">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7CFF3B]/20 text-xs font-bold text-[#7CFF3B]">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 pt-4">
                  <Link
                    href="/trainers"
                    className={`block w-full rounded-2xl py-4 text-center text-sm font-bold transition-all ${
                      plan.popular
                        ? "bg-[#7CFF3B] text-black hover:scale-[1.02] hover:bg-[#68e326] hover:shadow-[0_0_30px_rgba(124,255,59,0.3)]"
                        : "border border-white/10 bg-white/5 text-white hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                    }`}
                  >
                    {plan.cta} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
            Side-by-Side Breakdown
          </p>
          <h2 className="mt-2 text-4xl font-bold md:text-5xl">
            Compare Plan Features
          </h2>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-sm uppercase tracking-wider text-gray-400">
                <th className="pb-4 font-semibold">Feature</th>
                <th className="pb-4 font-semibold text-center">Discovery Trial</th>
                <th className="pb-4 font-semibold text-center text-[#7CFF3B]">1-on-1 Monthly</th>
                <th className="pb-4 font-semibold text-center">Elite Transformation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.02]">
                  <td className="py-4 font-medium text-white">{row.feature}</td>
                  <td className="py-4 text-center text-gray-400">{row.trial}</td>
                  <td className="py-4 text-center font-semibold text-[#7CFF3B]">{row.monthly}</td>
                  <td className="py-4 text-center text-gray-200">{row.elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
            Questions & Answers
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-white/10 bg-[#11161D] overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left font-bold text-white hover:text-[#7CFF3B]"
              >
                <span>{faq.q}</span>
                <span className="text-xl text-[#7CFF3B]">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="border-t border-white/10 p-6 pt-4 text-sm text-gray-300 leading-relaxed bg-black/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Ready to Start Banner */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="rounded-[36px] border border-[#7CFF3B]/30 bg-gradient-to-r from-[#142316] to-[#0D1217] p-10 md:p-16 text-center shadow-[0_20px_70px_rgba(124,255,59,0.1)]">
          <h2 className="text-4xl font-black text-white">
            Find Your Coach and Start Your 3-Day Free Chat
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-gray-300">
            Browse verified strength, fat loss, and hypertrophy specialists.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/trainers"
              className="rounded-2xl bg-[#7CFF3B] px-8 py-4 font-bold text-black transition hover:scale-105 hover:bg-[#68e326]"
            >
              Explore Coach Directory →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
