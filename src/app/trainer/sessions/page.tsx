import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navigation/navbar";
import { TrainerSessionsManager } from "@/components/sessions/trainer-sessions-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TrainerSessionsPage() {
  const user = await requireUser(["TRAINER", "ADMIN"]);

  if (!user.trainerProfile) {
    redirect("/dashboard");
  }

  // 1. Fetch all coaching sessions for this trainer
  const sessions = await prisma.coachingSession.findMany({
    where: { trainerId: user.trainerProfile.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledStart: "asc" },
  });

  // 2. Fetch accepted active clients for scheduling dropdown
  const acceptedRequests = await prisma.coachingRequest.findMany({
    where: {
      trainerId: user.trainerProfile.id,
      status: "ACCEPTED",
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      package: { select: { name: true } },
    },
  });

  // Filter unique clients
  const activeClientsMap = new Map();
  acceptedRequests.forEach((req) => {
    if (!activeClientsMap.has(req.clientId)) {
      activeClientsMap.set(req.clientId, {
        id: req.clientId,
        name: req.client.name,
        email: req.client.email,
        packageName: req.package?.name,
        coachingRequestId: req.id,
      });
    }
  });
  const activeClients = Array.from(activeClientsMap.values());

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Trainer Portal
              </span>
              <span className="text-xs text-gray-400">1-on-1 Video Coaching Sessions</span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Coaching Sessions Hub
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Schedule, manage, and launch live high-definition video workouts with your enrolled athletes
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trainer/dashboard"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              ← Trainer Dashboard
            </Link>
            <Link
              href="/messages"
              className="rounded-2xl bg-white/10 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/20"
            >
              Client Messages
            </Link>
          </div>
        </div>

        {/* Sessions Manager */}
        <div className="mt-10">
          <TrainerSessionsManager
            initialSessions={sessions}
            activeClients={activeClients}
          />
        </div>
      </section>
    </main>
  );
}
