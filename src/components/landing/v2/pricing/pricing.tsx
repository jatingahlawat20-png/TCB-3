import Link from "next/link";

export function Pricing() {
  const plans = [
    {
      name: "Discovery Trial",
      price: "₹0",
      period: "3-day free window",
      description: "Start a conversation with any verified trainer before committing to paid coaching.",
      features: [
        "Direct chat with selected coach",
        "Goal assessment & fit review",
        "No credit card required",
        "Media & text messaging",
      ],
      cta: "Explore Coaches",
      href: "/trainers",
      popular: false,
    },
    {
      name: "1-on-1 Coaching",
      price: "₹1,999+",
      period: "per month",
      description: "Complete individual coaching designed around your schedule and physical targets.",
      features: [
        "Personalized training program",
        "Nutrition & macros guidance",
        "Weekly form checks & updates",
        "Direct in-app communication",
        "Progressive workout adjustments",
      ],
      cta: "Find Your Trainer",
      href: "/trainers",
      popular: true,
    },
    {
      name: "Elite Performance",
      price: "₹2,999+",
      period: "per month",
      description: "Advanced preparation for competitive athletes, powerlifters, and rapid transformations.",
      features: [
        "Comprehensive periodization plan",
        "Video analysis for all lifts",
        "Daily accountability check-ins",
        "Priority message response",
        "Contest / photoshoot peak prep",
      ],
      cta: "Browse Elite Coaches",
      href: "/trainers",
      popular: false,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row mb-14">
        <div>
          <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
            Transparent Plans
          </span>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Coaching Built for You
          </h2>
        </div>
        <Link
          href="/pricing"
          className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3.5 text-sm font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
        >
          View Full Plan Comparison →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col justify-between rounded-[32px] border p-8 transition-all duration-300 ${
              plan.popular
                ? "border-[#7CFF3B] bg-gradient-to-b from-[#152317] to-[#11161d] shadow-[0_20px_60px_rgba(124,255,59,0.12)] -translate-y-2"
                : "border-white/10 bg-[#11161d] hover:border-white/20"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7CFF3B] px-4 py-1 text-xs font-black uppercase tracking-wider text-black">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              <p className="mt-3 text-sm text-gray-400 min-h-[40px]">
                {plan.description}
              </p>

              <div className="mt-6 border-y border-white/10 py-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-400">/{plan.period}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="text-[#7CFF3B]">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href={plan.href}
                className={`block w-full rounded-2xl py-4 text-center text-sm font-bold transition-all ${
                  plan.popular
                    ? "bg-[#7CFF3B] text-black hover:scale-[1.02] hover:bg-[#68e326] hover:shadow-[0_0_25px_rgba(124,255,59,0.25)]"
                    : "border border-white/10 bg-white/5 text-white hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
