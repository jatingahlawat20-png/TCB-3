"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      <div className="inline-flex rounded-full border border-lime-500/20 bg-lime-500/10 px-5 py-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-lime-400">
          Human Led Coaching Platform
        </span>
      </div>

      <h1 className="text-6xl font-black leading-tight text-white lg:text-7xl">
        Real Trainers.
        <br />
        Real Results.
      </h1>

      <p className="max-w-xl text-lg leading-8 text-gray-400">
        Connect with verified fitness trainers, start with a free chat,
        purchase personalized coaching plans and achieve your dream physique
        with real experts.
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <Link
          href="/trainers"
          className="inline-flex items-center justify-center rounded-2xl bg-[#7CFF3B] px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-[#68e326] hover:shadow-[0_0_30px_rgba(124,255,59,0.3)]"
        >
          Browse Trainers →
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
        >
          View Pricing
        </Link>
      </div>
    </motion.div>
  );
}