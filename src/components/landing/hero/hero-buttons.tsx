import Link from "next/link";

export function HeroButtons() {
  return (
    <div className="relative z-10 flex flex-wrap gap-4">
      <Link
        href="/trainers"
        className="inline-flex items-center justify-center rounded-2xl bg-[#7CFF3B] px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(124,255,59,0.35)]"
      >
        Browse Trainers
      </Link>

      <Link
        href="/trainers/apply"
        className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-[#7CFF3B]/60 hover:bg-white/10"
      >
        Become a Trainer
      </Link>
    </div>
  );
}