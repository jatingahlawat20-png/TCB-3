import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { TrainerOnboardingWizard } from "@/components/trainer/onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function TrainerOnboardingPage() {
  const user = await requireUser(["TRAINER", "ADMIN"]);

  const existingProfile = await prisma.trainerProfile.findUnique({
    where: { userId: user.id },
    include: {
      packages: {
        orderBy: { price: "asc" },
      },
    },
  });

  const rejectionTag = existingProfile?.tags.find((t) => t.startsWith("rejection_reason:"));
  const rejectionReason = rejectionTag ? rejectionTag.replace("rejection_reason:", "") : null;

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
            TCB-3 Coach Network
          </span>
          <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
            {existingProfile ? "Update Your Coaching Profile" : "Become a TCB-3 Trainer"}
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Publish your coaching profile to the TCB-3 marketplace. Every coach profile is reviewed by our administration team to maintain elite training standards.
          </p>
        </div>

        {rejectionReason && (
          <div className="mb-8 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-white text-base">Verification Needs Changes</h4>
                <p className="mt-1 text-rose-300">
                  <strong className="text-white">Admin Feedback:</strong> {rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}

        <TrainerOnboardingWizard
          initialName={user.name}
          initialProfile={existingProfile}
        />
      </section>

      <Footer />
    </main>
  );
}
