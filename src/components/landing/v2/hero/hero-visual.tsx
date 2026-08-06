"use client";

import { motion } from "framer-motion";

export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 1 }}
      className="relative"
    >
      <div className="h-[560px] rounded-[40px] border border-white/10 bg-gradient-to-br from-[#13181d] to-[#17291a] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="space-y-8">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-400">
                Trainer
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                Aryan Singh
              </h2>
            </div>

            <div className="rounded-full bg-lime-500/20 px-4 py-2 text-lime-400">
              Online
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Experience</p>

              <h3 className="mt-3 text-3xl font-bold text-white">
                8 Years
              </h3>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Clients</p>

              <h3 className="mt-3 text-3xl font-bold text-white">
                320+
              </h3>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Rating</p>

              <h3 className="mt-3 text-3xl font-bold text-lime-400">
                ★ 4.9
              </h3>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">
                Next Session
              </p>

              <h3 className="mt-3 text-2xl font-bold text-white">
                Tomorrow
              </h3>
            </div>

          </div>

          <div className="rounded-3xl border border-lime-500/20 bg-lime-500/10 p-6">
            <p className="text-sm uppercase tracking-widest text-lime-400">
              Transformation Progress
            </p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "82%" }}
                transition={{ duration: 2 }}
                className="h-full rounded-full bg-lime-400"
              />
            </div>

            <p className="mt-4 text-white">
              82% Goal Completed
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}