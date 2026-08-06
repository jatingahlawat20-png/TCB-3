export function FeaturedTrainers() {
  const trainers = [
    {
      name: "Aryan Singh",
      role: "Strength Coach",
      exp: "8 Years",
      rating: "4.9",
    },
    {
      name: "Neha Sharma",
      role: "Fat Loss Expert",
      exp: "6 Years",
      rating: "4.8",
    },
    {
      name: "Rahul Mehta",
      role: "Bodybuilding",
      exp: "10 Years",
      rating: "5.0",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-12 text-center text-5xl font-bold text-white">
        Featured Trainers
      </h2>

      <div className="grid gap-8 md:grid-cols-3">
        {trainers.map((trainer) => (
          <div
            key={trainer.name}
            className="rounded-3xl border border-white/10 bg-[#11161d] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-lime-400"
          >
            <div className="mb-6 h-24 w-24 rounded-full bg-lime-500/20" />

            <h3 className="text-2xl font-bold text-white">{trainer.name}</h3>

            <p className="mt-2 text-gray-400">{trainer.role}</p>

            <div className="mt-8 flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <h4 className="text-white">{trainer.exp}</h4>
              </div>

              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <h4 className="text-lime-400">⭐ {trainer.rating}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}