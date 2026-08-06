"use client";

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
    </motion.div>
  );
}