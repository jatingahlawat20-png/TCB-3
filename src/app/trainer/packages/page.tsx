import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { PackageManager } from "@/components/trainer/package-manager";

export const dynamic = "force-dynamic";

export default async function TrainerPackagesPage() {
  const user = await requireUser(["TRAINER", "ADMIN"]);

  let packages: any[] = [];
  if (user.trainerProfile) {
    try {
      packages = await prisma.coachingPackage.findMany({
        where: { trainerId: user.trainerProfile.id },
        orderBy: { price: "asc" },
      });
    } catch (err) {
      console.error("Error loading packages:", err);
    }
  }

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Coach Management Portal
              </span>
              <Link
                href="/trainer/dashboard"
                className="text-xs text-gray-400 hover:text-[#7CFF3B] transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Coaching Packages
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Configure your personal coaching packages, pricing, and deliverables.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <PackageManager initialPackages={packages} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
