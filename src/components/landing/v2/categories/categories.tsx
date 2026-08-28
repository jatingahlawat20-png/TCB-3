import Link from "next/link";

export function Categories() {
  const categories = [
    { name: "Weight Loss", icon: "🔥", count: "12+ Coaches" },
    { name: "Muscle Gain", icon: "💪", count: "18+ Coaches" },
    { name: "Bodybuilding", icon: "🏆", count: "10+ Coaches" },
    { name: "Powerlifting", icon: "🏋️", count: "8+ Coaches" },
    { name: "Yoga", icon: "🧘", count: "6+ Coaches" },
    { name: "CrossFit", icon: "⚡", count: "9+ Coaches" },
    { name: "Calisthenics", icon: "🤸", count: "7+ Coaches" },
    { name: "Nutrition", icon: "🥗", count: "14+ Coaches" },
  ];

  return (
    <section id="categories" className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#7CFF3B]">
          Targeted Training
        </p>
        <h2 className="mt-2 text-4xl font-bold text-white md:text-5xl">
          Explore Categories
        </h2>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto">
          Choose your fitness objective to find specialists tailored to your goals.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/trainers?category=${encodeURIComponent(cat.name)}`}
            className="group block rounded-3xl border border-white/10 bg-[#11161d] p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#7CFF3B] hover:bg-[#7CFF3B]/5 hover:shadow-[0_15px_40px_rgba(124,255,59,0.08)]"
          >
            <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">
              {cat.icon}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-[#7CFF3B] transition">
              {cat.name}
            </h3>
            <p className="mt-2 text-xs text-gray-400">
              {cat.count}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}