export function Stats() {
  const stats = [
    { number: "500+", label: "Verified Trainers" },
    { number: "15K+", label: "Happy Clients" },
    { number: "98%", label: "Success Rate" },
    { number: "4.9★", label: "Average Rating" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-[#11161d] p-8 text-center"
          >
            <h2 className="text-5xl font-black text-lime-400">
              {stat.number}
            </h2>

            <p className="mt-4 text-gray-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}