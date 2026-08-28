"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState(0);

  const pillars = [
    {
      id: "verified-trainers",
      icon: "🛡️",
      title: "Verified Trainers",
      tagline: "Rigorous vetting. Zero automated bots.",
      description:
        "Every coach on TCB-3 undergoes rigorous identity confirmation, certification validation (CSCS, ACE, NASM, ISSA, RYT), and professional background review before publishing packages.",
      highlights: [
        "Human identity & credentials validation",
        "Documented client transformation history",
        "Public rating & verified client testimonials",
        "Direct coach accountability",
      ],
      previewStats: [
        { label: "Vetting Acceptance Rate", val: "14%" },
        { label: "Average Coach Experience", val: "7.8 Yrs" },
      ],
    },
    {
      id: "personalized-coaching",
      icon: "🎯",
      title: "Personalized Coaching",
      tagline: "Tailored to your biomechanics, schedule, and goals.",
      description:
        "No generic cookie-cutter PDFs. Your coach designs your routine specifically for your equipment access, training experience, injury history, and dietary preferences.",
      highlights: [
        "Custom periodized workout splits",
        "Targeted macronutrient & calorie targets",
        "Exercise substitutions based on mobility",
        "Weekly volume & intensity adjustments",
      ],
      previewStats: [
        { label: "Adherence Improvement", val: "+88%" },
        { label: "Average Goal Timeline", val: "12 Weeks" },
      ],
    },
    {
      id: "progress-tracking",
      icon: "📊",
      title: "Progress Tracking",
      tagline: "Measure what matters with visual analytics.",
      description:
        "Log workout completions, track 1RM strength milestones, upload progress photos, and monitor body composition trends over time in one private dashboard.",
      highlights: [
        "1RM and strength progression metrics",
        "Side-by-side photo comparison timeline",
        "Bodyweight & measurement graphs",
        "Workout completion streak tracking",
      ],
      previewStats: [
        { label: "Data Points Tracked", val: "25+ Metrics" },
        { label: "Client Goal Attainment", val: "94.2%" },
      ],
    },
    {
      id: "communication",
      icon: "💬",
      title: "Trainer-Client Communication",
      tagline: "High-touch coaching with rich media support.",
      description:
        "Share workout videos for form breakdown, ask questions about nutrition, send progress updates, and receive voice notes directly inside your private coaching channel.",
      highlights: [
        "Video upload support for lift form checks",
        "Audio note guidance from your coach",
        "Weekly structured video or chat check-ins",
        "Prompt feedback within dedicated response windows",
      ],
      previewStats: [
        { label: "Average Response Time", val: "< 3 Hours" },
        { label: "Media Upload Capacity", val: "200 MB Video" },
      ],
    },
    {
      id: "coaching-packages",
      icon: "📦",
      title: "Coaching Packages",
      tagline: "Trainer-owned offers with 3-day complimentary chat.",
      description:
        "Trainers create their own package structures, pricing, and services. You always start with a free 3-day chat window to verify coach compatibility before paying.",
      highlights: [
        "3-day free chat window with every coach",
        "Transparent monthly & quarterly pricing",
        "No mandatory long-term lock-in contracts",
        "Flexibility to switch or pause packages",
      ],
      previewStats: [
        { label: "Complimentary Chat", val: "3 Full Days" },
        { label: "Starting Price", val: "₹1,899/mo" },
      ],
    },
    {
      id: "secure-platform",
      icon: "🔒",
      title: "Secure Platform",
      tagline: "Bank-grade security and client confidentiality.",
      description:
        "Your private progress photos, fitness data, and personal messages are encrypted and accessible only to you and your assigned trainer.",
      highlights: [
        "Encrypted media and conversation storage",
        "Zero data-selling or marketing monetization",
        "Secure automated billing and transaction escrow",
        "Strict platform community standards",
      ],
      previewStats: [
        { label: "Data Encryption", val: "AES-256" },
        { label: "Platform Uptime", val: "99.98%" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="hero-glow" />
        <div className="mx-auto max-w-7xl px-6 md:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
              Architecture of Human Coaching
            </span>
            <h1 className="mt-6 text-5xl font-black md:text-7xl leading-tight">
              Features Built for <br />
              <span className="text-[#7CFF3B]">Measurable Results.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
              TCB-3 delivers the tools, structure, and accountability needed for genuine fitness transformations, backed by real verified professionals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/trainers"
                className="rounded-2xl bg-[#7CFF3B] px-8 py-4 font-bold text-black transition-all hover:scale-105 hover:bg-[#68e326] hover:shadow-[0_0_30px_rgba(124,255,59,0.3)]"
              >
                Find Your Coach →
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
              >
                View Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Platform Capabilities</h2>
          <p className="mt-2 text-gray-400">Click a feature below to explore how it powers your fitness journey.</p>
        </div>

        {/* Tab Headers */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {pillars.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                activeTab === idx
                  ? "bg-[#7CFF3B] text-black shadow-[0_0_20px_rgba(124,255,59,0.3)]"
                  : "border border-white/10 bg-[#11161D] text-gray-300 hover:border-[#7CFF3B]/50 hover:text-white"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Card Detail */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[36px] border border-white/10 bg-[#11161D] p-8 md:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{pillars[activeTab].icon}</span>
                <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]">
                  Feature Focus
                </span>
              </div>
              <h3 className="mt-4 text-3xl font-black text-white md:text-4xl">
                {pillars[activeTab].title}
              </h3>
              <p className="mt-2 text-lg text-[#7CFF3B] font-medium">
                {pillars[activeTab].tagline}
              </p>
              <p className="mt-4 text-gray-300 leading-relaxed">
                {pillars[activeTab].description}
              </p>

              <div className="mt-8 space-y-3">
                {pillars[activeTab].highlights.map((h) => (
                  <div key={h} className="flex items-center gap-3 text-sm text-gray-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7CFF3B]/20 text-xs font-bold text-[#7CFF3B]">
                      ✓
                    </span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#162018] to-[#0D1217] p-8 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
                Key Performance Indicators
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {pillars[activeTab].previewStats.map((st) => (
                  <div
                    key={st.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <p className="text-xs text-gray-400">{st.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {st.val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#7CFF3B]/20 bg-[#7CFF3B]/5 p-5">
                <p className="text-sm font-bold text-[#7CFF3B]">
                  Ready to experience this with a coach?
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Select a certified trainer and start your 3-day complimentary chat today.
                </p>
                <Link
                  href="/trainers"
                  className="mt-4 inline-block rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black transition hover:scale-105"
                >
                  Browse Available Trainers →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Grid of All Features */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8 border-t border-white/10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
            Comprehensive Ecosystem
          </p>
          <h2 className="mt-2 text-4xl font-bold md:text-5xl">
            Everything You Need for Progress
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl border border-white/10 bg-[#11161D] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#7CFF3B] hover:shadow-[0_20px_50px_rgba(124,255,59,0.08)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3B]/10 text-2xl group-hover:scale-110 transition">
                {item.icon}
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white group-hover:text-[#7CFF3B] transition">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                {item.description}
              </p>
              <ul className="mt-6 space-y-2 border-t border-white/10 pt-6">
                {item.highlights.slice(0, 2).map((hl) => (
                  <li key={hl} className="text-xs text-gray-300 flex items-center gap-2">
                    <span className="text-[#7CFF3B]">✓</span> {hl}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="rounded-[36px] border border-[#7CFF3B]/30 bg-gradient-to-r from-[#111c12] via-[#11161d] to-[#122013] p-10 md:p-16 text-center shadow-[0_25px_70px_rgba(124,255,59,0.1)]">
          <h2 className="text-4xl font-black text-white md:text-5xl">
            Experience Human-Led Fitness Coaching
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-300">
            No algorithms or generic diet templates. Real coaches, bespoke programs, and daily accountability.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/trainers"
              className="rounded-2xl bg-[#7CFF3B] px-8 py-4 font-bold text-black transition hover:scale-105 hover:bg-[#68e326]"
            >
              Explore Coach Directory →
            </Link>
            <Link
              href="/get-started"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:border-[#7CFF3B]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
