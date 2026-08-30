import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { TrainerVerificationManager } from "@/components/admin/trainer-verification-manager";

export const dynamic = "force-dynamic";

export default async function AdminTrainersPage() {
  const user = await requireUser(["ADMIN"]);

  // Fetch all trainer profiles with their user records and packages
  let trainers: any[] = [];
  try {
    trainers = await prisma.trainerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        packages: {
          orderBy: { price: "asc" },
        },
      },
      orderBy: [
        { verified: "asc" },
        { user: { createdAt: "desc" } },
      ],
    });
  } catch (err) {
    console.error("Error loading trainers for admin:", err);
  }

  const pendingCount = trainers.filter(
    (t) => (t.status === "PENDING" || !t.verified) && t.status !== "INACTIVE"
  ).length;
  const verifiedCount = trainers.filter((t) => t.status === "ACTIVE" && t.verified).length;

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-xs font-bold text-gray-400 hover:text-white"
              >
                ← Super Admin Console
              </Link>
              <span className="text-gray-600">•</span>
              <span className="rounded-full bg-red-500/10 border border-red-500/30 px-3 py-0.5 text-xs font-bold text-red-400 uppercase tracking-wider">
                Verification Portal
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Trainer Verification Center
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Review new coach applications, inspect credentials, and manage marketplace verification status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trainers"
              target="_blank"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            >
              Public Marketplace ↗
            </Link>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Coaches</p>
            <p className="mt-2 text-3xl font-black text-white">{trainers.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Pending Review</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{pendingCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Verified Coaches</p>
            <p className="mt-2 text-3xl font-black text-[#7CFF3B]">{verifiedCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Admin</p>
            <p className="mt-2 text-base font-bold text-white truncate">{user.name}</p>
          </div>
        </div>

        {/* Trainer Verification Manager */}
        <div className="mt-10">
          <TrainerVerificationManager initialTrainers={trainers} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
