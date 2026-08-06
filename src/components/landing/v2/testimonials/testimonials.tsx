export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="mb-12 text-center text-5xl font-bold text-white">
        Success Stories
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#11161d] p-8">
          <p className="text-lg leading-8 text-gray-300">
            "The best trainer platform I've ever used. My transformation in just
            5 months exceeded my expectations."
          </p>

          <h3 className="mt-8 text-xl font-bold text-white">
            — Rohan Kapoor
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11161d] p-8">
          <p className="text-lg leading-8 text-gray-300">
            "Found an amazing coach within two days. The free consultation made
            choosing the right trainer much easier."
          </p>

          <h3 className="mt-8 text-xl font-bold text-white">
            — Priya Sharma
          </h3>
        </div>
      </div>
    </section>
  );
}