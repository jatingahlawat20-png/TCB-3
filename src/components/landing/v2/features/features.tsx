export function Features() {
  const features = [
    "Verified Trainers",
    "Free 3-Day Chat",
    "Video Consultation",
    "Custom Workout Plans",
    "Diet Tracking",
    "Progress Monitoring",
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-12 text-center text-5xl font-bold text-white">
        Why Choose TCB-3?
      </h2>

      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-3xl border border-white/10 bg-[#11161d] p-8"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-lime-500 text-2xl">
              ✓
            </div>

            <h3 className="text-2xl font-bold text-white">{feature}</h3>

            <p className="mt-4 text-gray-400">
              Premium experience designed for both clients and professional
              trainers.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}