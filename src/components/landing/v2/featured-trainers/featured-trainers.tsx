import Link from "next/link";
import Image from "next/image";
import { trainers } from "@/data/trainers";

export function FeaturedTrainers() {
  const featured = trainers.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row mb-14">
        <div>
          <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
            Verified Coaches
          </span>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Featured Specialists
          </h2>
        </div>
        <Link
          href="/trainers"
          className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3.5 text-sm font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
        >
          View All Coaches ({trainers.length}) →
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {featured.map((trainer) => (
          <Link
            key={trainer.id}
            href={`/trainers/${trainer.id}`}
            className="group block overflow-hidden rounded-[32px] border border-white/10 bg-[#11161D] transition-all duration-300 hover:-translate-y-2 hover:border-[#7CFF3B] hover:shadow-[0_20px_50px_rgba(124,255,59,0.12)]"
          >
            <div className="relative h-72 w-full overflow-hidden bg-[#0d1217]">
              {trainer.image ? (
                <Image
                  src={trainer.image}
                  alt={trainer.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
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
              <div className="absolute top-4 right-4 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#7CFF3B] border border-[#7CFF3B]/30">
                ★ {trainer.rating}
              </div>
            </div>

            <div className="p-6 pt-2 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white group-hover:text-[#7CFF3B] transition">
                  {trainer.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400 font-medium">
                  {trainer.specialty}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {trainer.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <span className="text-gray-400">{trainer.experience} Exp</span>
                <span className="text-gray-400">{trainer.clients}+ Clients</span>
                <span className="font-bold text-white">₹{trainer.price}/mo</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}