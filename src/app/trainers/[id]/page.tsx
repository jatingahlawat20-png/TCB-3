import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTrainerById } from "@/lib/trainers";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { CheckoutButton } from "@/components/payments/checkout-button";

export const dynamic = "force-dynamic";

type TrainerProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TrainerProfilePage({
  params,
}: TrainerProfilePageProps) {
  const { id } = await params;

  const trainer = await getTrainerById(id);

  if (!trainer) {
    notFound();
  }

  // Fetch real database packages for this trainer
  let packages: any[] = trainer.packages || [];
  if (packages.length === 0) {
    try {
      packages = await prisma.coachingPackage.findMany({
        where: {
          trainer: {
            OR: [
              { id: String(id) },
              { id: `profile_${id}` },
              { userId: `trainer_${id}` },
              { userId: String(id) },
              { user: { name: { equals: trainer.name, mode: "insensitive" } } },
            ],
          },
          active: true,
        },
        orderBy: { price: "asc" },
      });
    } catch (err) {
      console.error("Error fetching packages for trainer:", err);
    }
  }

  // Fallback default packages if none created yet
  if (packages.length === 0) {
    packages = [
      {
        id: "default_1",
        name: "1-on-1 Monthly Coaching",
        duration: "1 Month",
        price: trainer.price || 999,
        description: `Personalized 1-on-1 programming designed around your goals with ${trainer.name}.`,
        benefits: [
          "Custom workout split & periodization",
          "Targeted nutrition & macronutrient guide",
          "Weekly form checks & video critique",
          "Direct in-app text & audio messaging",
          "3-Day complimentary chat window",
        ],
      },
      {
        id: "default_2",
        name: "3-Month Transformation",
        duration: "3 Months",
        price: 2499,
        description: "Structured progressive overload and body recomposition protocol.",
        benefits: [
          "Complete 12-week periodization split",
          "Weekly technique & lifting video analysis",
          "Bi-weekly nutritional adjustments",
          "Priority message response (<4 hrs)",
          "Progress milestone tracking",
        ],
      },
      {
        id: "default_3",
        name: "Elite Performance & Prep",
        duration: "6 Months",
        price: 4499,
        description: "Maximum accountability program for competitive lifters and rapid transformations.",
        benefits: [
          "Comprehensive multi-phase periodization",
          "Daily accountability check-ins",
          "Unlimited lift video critiques",
          "Competition / photoshoot peaking protocol",
          "Custom supplement and recovery optimization",
        ],
      },
    ];
  }

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      {/* Profile Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="mb-6">
          <Link
            href="/trainers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-[#7CFF3B]"
          >
            ← Back to All Trainers
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main Profile Card */}
          <div className="space-y-8">
            <div className="rounded-[36px] border border-white/10 bg-[#11161D] p-8 md:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
                {/* Photo Portrait */}
                <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-[28px] border-2 border-[#7CFF3B]/30 bg-[#0d1217] shadow-xl">
                  {trainer.image ? (
                    <Image
                      src={trainer.image}
                      alt={trainer.name}
                      fill
                      sizes="176px"
                      priority
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7CFF3B] to-[#315b17] text-4xl font-black text-black">
                      {trainer.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black md:text-5xl">
                      {trainer.name}
                    </h1>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        trainer.verified
                          ? "bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-[#7CFF3B]"
                          : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                      }`}
                    >
                      {trainer.verified ? "✓ Verified Specialist" : "Under Review"}
                    </span>
                  </div>

                  <p className="mt-2 text-lg text-gray-300 font-medium">
                    {trainer.specialty}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-5 text-sm">
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                      ★ {trainer.rating} Rating
                    </span>

                    <span className="text-gray-300">
                      {trainer.clients}+ Clients Coached
                    </span>

                    <span className="text-gray-300">
                      {trainer.experience} Experience
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {trainer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biography & Philosophy */}
              <div className="mt-12 border-t border-white/10 pt-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7CFF3B]">
                  About the Coach
                </span>

                <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                  Coaching Built Around Your Biomechanics & Goals
                </h2>

                <p className="mt-4 max-w-3xl text-base leading-8 text-gray-300">
                  {trainer.bio}
                </p>
              </div>

              {/* Highlights Grid */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Experience</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {trainer.experience}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Clients</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {trainer.clients}+
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Average Rating</p>
                  <p className="mt-2 text-2xl font-black text-[#7CFF3B]">
                    ★ {trainer.rating}
                  </p>
                </div>
              </div>
            </div>

            {/* Coaching Packages Section */}
            <div className="rounded-[36px] border border-white/10 bg-[#11161D] p-8 md:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.5)]">
              <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Available Coaching Packages
              </span>

              <h2 className="mt-3 text-3xl font-black text-white">
                Select Your Coaching Tier
              </h2>

              <p className="mt-2 text-sm text-gray-400 max-w-xl">
                Choose a plan tailored to your timeline and coaching intensity. Every tier starts with our 3-day complimentary chat trial.
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0B0F14] p-6 transition hover:border-[#7CFF3B]/50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#7CFF3B]/10 text-[#7CFF3B] px-3 py-0.5 text-xs font-bold">
                          {pkg.duration}
                        </span>
                        <span className="text-2xl font-black text-white">
                          ₹{pkg.price}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-bold text-white">
                        {pkg.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {pkg.description}
                      </p>

                      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        {pkg.benefits.map((b: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                            <span className="text-[#7CFF3B]">✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                      <CheckoutButton
                        packageId={pkg.id}
                        packageName={pkg.name}
                        price={pkg.price}
                        duration={pkg.duration}
                        trainerName={trainer.name}
                        buttonText={`Enroll & Pay ₹${pkg.price}`}
                        className="flex w-full items-center justify-center rounded-xl bg-[#7CFF3B] py-3 text-xs font-bold text-black transition hover:scale-105 hover:bg-[#68e326]"
                      />
                      <Link
                        href={`/trainers/${trainer.id}/request?packageId=${pkg.id}`}
                        className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-[11px] font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                      >
                        or Request 3-Day Free Chat →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Quick Booking Card */}
          <aside className="h-fit rounded-[36px] border border-[#7CFF3B]/30 bg-[#11161D] p-8 md:p-10 shadow-[0_20px_70px_rgba(124,255,59,0.1)] lg:sticky lg:top-28">
            <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
              Complimentary Trial
            </span>

            <h2 className="mt-4 text-3xl font-black">
              Start Free 3-Day Chat
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Message {trainer.name.split(" ")[0]} directly to discuss your injuries, targets, and current lifting splits before committing to paid coaching.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Monthly Package Starting At
              </p>

              <p className="mt-2 text-4xl font-black text-white">
                ₹{trainer.price}
                <span className="ml-1 text-sm font-medium text-gray-400">
                  /month
                </span>
              </p>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-2.5">
                <span className="text-[#7CFF3B]">✓</span> Custom periodized training program
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[#7CFF3B]">✓</span> Targeted nutrition & macro targets
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[#7CFF3B]">✓</span> Weekly form checks & video analysis
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[#7CFF3B]">✓</span> Direct in-app text & audio chat
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-[#7CFF3B]">
                <span>✓</span> 3-Day complimentary chat included
              </div>
            </div>

            <Link
              href={`/trainers/${trainer.id}/request`}
              className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#7CFF3B] px-6 py-4 font-bold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-[#68e326] hover:shadow-[0_0_35px_rgba(124,255,59,0.3)]"
            >
              Request Coaching with {trainer.name.split(" ")[0]} →
            </Link>

            <p className="mt-4 text-center text-xs text-gray-500">
              Zero payment required to send coaching request.
            </p>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}