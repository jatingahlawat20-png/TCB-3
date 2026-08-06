export function Categories() {
  const categories = [
    "Weight Loss",
    "Muscle Gain",
    "Bodybuilding",
    "Powerlifting",
    "Yoga",
    "CrossFit",
    "Calisthenics",
    "Nutrition",
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-12 text-center text-5xl font-bold text-white">
        Explore Categories
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category}
            className="rounded-2xl border border-white/10 bg-[#11161d] p-8 text-center text-xl font-semibold text-white transition hover:border-lime-400 hover:bg-lime-500/10"
          >
            {category}
          </div>
        ))}
      </div>
    </section>
  );
}