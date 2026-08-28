"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="relative w-full max-w-lg"
    >
      <div className="rounded-[40px] border border-white/10 bg-gradient-to-br from-[#13181D] to-[#17291A] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="space-y-6">
          <Link
            href="/trainers/1"
            className="group flex items-center justify-between transition"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#7CFF3B]/40 bg-[#0d1217]">
                <Image
                  src="/images/trainers/aryan-singh.jpg"
                  alt="Aryan Singh"
                  fill
                  sizes="64px"
                  className="object-cover object-top transition group-hover:scale-105"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-[#7CFF3B] font-bold">
                  Featured Coach
                </p>

                <h2 className="text-2xl font-bold text-white group-hover:text-[#7CFF3B] transition">
                  Aryan Singh
                </h2>
              </div>
            </div>

            <div className="rounded-full bg-[#7CFF3B]/20 border border-[#7CFF3B]/40 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]">
              Online Now
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Experience</p>
              <h3 className="mt-1 text-2xl font-black text-white">8 Years</h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Active Clients</p>
              <h3 className="mt-1 text-2xl font-black text-white">320+</h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Rating</p>
              <h3 className="mt-1 text-2xl font-black text-[#7CFF3B]">★ 4.9</h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Next Session</p>
              <h3 className="mt-1 text-xl font-black text-white">Tomorrow</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7CFF3B]/20 bg-[#7CFF3B]/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7CFF3B]">
                Transformation Progress
              </p>
              <span className="text-xs font-black text-white">82%</span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "82%" }}
                transition={{ duration: 1.5, delay: 0.4 }}
                className="h-full rounded-full bg-[#7CFF3B] shadow-[0_0_12px_rgba(124,255,59,0.8)]"
              />
            </div>

            <p className="mt-3 text-xs text-gray-300">
              Target: Hypertrophy & 1RM Squat Progression
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}