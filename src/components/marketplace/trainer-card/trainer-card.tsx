"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Trainer } from "@/data/trainers";

export function TrainerCard({ trainer }: { trainer: Trainer }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group overflow-hidden rounded-[32px] border border-white/10 bg-[#11161D] transition-all duration-300 hover:-translate-y-2 hover:border-[#7CFF3B] hover:shadow-[0_20px_50px_rgba(124,255,59,0.12)] flex flex-col justify-between">
      <div>
        <Link
          href={`/trainers/${trainer.id}`}
          className="block relative h-72 w-full bg-[#0d1217] overflow-hidden"
        >
          {trainer.image && !imageError ? (
            <Image
              src={trainer.image}
              alt={trainer.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7CFF3B] to-[#1e3b10] text-5xl font-black text-black">
              {trainer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#11161D] via-transparent to-transparent opacity-80" />

          <div
            className={`absolute top-4 right-4 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-bold shadow-lg ${
              trainer.verified
                ? "text-[#7CFF3B] border border-[#7CFF3B]/40"
                : "text-yellow-400 border border-yellow-400/40"
            }`}
          >
            {trainer.verified ? "✓ Verified Coach" : "Under Review"}
          </div>
        </Link>

        <div className="space-y-4 p-6 pt-2">
          <div>
            <Link href={`/trainers/${trainer.id}`}>
              <h2 className="text-2xl font-bold text-white transition group-hover:text-[#7CFF3B]">
                {trainer.name}
              </h2>
            </Link>

            <p className="text-sm text-gray-400 mt-1 font-medium">
              {trainer.specialty}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-300 border-y border-white/10 py-3">
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              ★ {trainer.rating}
            </span>

            <span>{trainer.clients}+ Clients</span>

            <span>{trainer.experience}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[30px]">
            {trainer.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#7CFF3B]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-white/10 mt-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400">
            From
          </p>
          <h3 className="text-2xl font-black text-white">
            ₹{trainer.price}
            <span className="text-xs font-normal text-gray-400 ml-1">/mo</span>
          </h3>
        </div>

        <Link
          href={`/trainers/${trainer.id}`}
          className="rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-[#68e326] hover:shadow-[0_0_20px_rgba(124,255,59,0.3)]"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}