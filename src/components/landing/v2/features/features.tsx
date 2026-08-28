import Link from "next/link";

export function Features() {
  const features = [
    {
      title: "Verified Trainers",
      description: "Rigorous identity confirmation and background review for every coach.",
      icon: "🛡️",
    },
    {
      title: "Free 3-Day Chat",
      description: "Test compatibility and discuss goals before any paid coaching begins.",
      icon: "💬",
    },
    {
      title: "Video Form Analysis",
      description: "Upload lifting footage directly to your coach for technique breakdown.",
      icon: "🎥",
    },
    {
      title: "Custom Workout Plans",
      description: "Periodized splits designed around your equipment, schedule, and targets.",
      icon: "📋",
    },
    {
      title: "Diet & Macro Tracking",
      description: "Personalized nutrition targets and weekly dietary adjustments.",
      icon: "🥗",
    },
    {
      title: "Progress Analytics",
      description: "Track 1RM lifts, body composition metrics, and photo timelines.",
      icon: "📈",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row mb-14">
        <div>
          <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
            Why Choose TCB-3
          </span>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Coaching Ecosystem
          </h2>
        </div>
        <Link
          href="/features"
          className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3.5 text-sm font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
        >
          Explore All Features →
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-3xl border border-white/10 bg-[#11161d] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#7CFF3B] hover:shadow-[0_20px_50px_rgba(124,255,59,0.08)]"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3B]/10 text-2xl group-hover:scale-110 transition">
              {f.icon}
            </div>

            <h3 className="text-2xl font-bold text-white group-hover:text-[#7CFF3B] transition">
              {f.title}
            </h3>

            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}