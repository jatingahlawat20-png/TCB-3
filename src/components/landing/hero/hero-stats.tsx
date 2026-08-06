const stats = [
  {
    value: "2,500+",
    label: "Verified Trainers",
  },
  {
    value: "50K+",
    label: "Active Clients",
  },
  {
    value: "4.9★",
    label: "Average Rating",
  },
];

export function HeroStats() {
  return (
    <div className="relative z-10 mt-10 grid gap-5 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#7CFF3B]/40 hover:shadow-[0_0_40px_rgba(124,255,59,0.15)]"
        >
          <h3 className="text-4xl font-black text-[#7CFF3B]">
            {stat.value}
          </h3>

          <p className="mt-2 text-sm tracking-wide text-gray-300">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}