import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navigation/navbar";
import { ClientSessionsManager } from "@/components/sessions/client-sessions-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientSessionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/sessions");
  }

  if (user.role === "TRAINER") {
    redirect("/trainer/sessions");
  }

  // 1. Fetch client coaching sessions
  const sessions = await prisma.coachingSession.findMany({
    where: { clientId: user.id },
    include: {
      trainer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { scheduledStart: "asc" },
  });

  // 2. Fetch active accepted coaches for booking
  const acceptedRequests = await prisma.coachingRequest.findMany({
    where: {
      clientId: user.id,
      status: "ACCEPTED",
    },
    include: {
      trainer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      package: { select: { name: true } },
    },
  });

  const activeTrainersMap = new Map();
  acceptedRequests.forEach((req) => {
    if (!activeTrainersMap.has(req.trainerId)) {
      activeTrainersMap.set(req.trainerId, {
        id: req.trainerId,
        name: req.trainer.user.name,
        specialty: req.trainer.specialty,
        packageName: req.package?.name,
        coachingRequestId: req.id,
      });
    }
  });
  const activeTrainers = Array.from(activeTrainersMap.values());

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Video Coaching
              </span>
              <span className="text-xs text-gray-400">1-on-1 Real-Time Programming</span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              My Coaching Sessions
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Scheduled workouts, live video calls, and past session history with your coaches
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              ← Client Dashboard
            </Link>
            <Link
              href="/messages"
              className="rounded-2xl bg-[#7CFF3B] px-6 py-3.5 text-xs font-bold text-black shadow-[0_0_25px_rgba(124,255,59,0.3)] hover:bg-[#68e326]"
            >
              Direct Messages →
            </Link>
          </div>
        </div>

        {/* Client Sessions Manager */}
        <div className="mt-10">
          <ClientSessionsManager
            initialSessions={sessions}
            activeTrainers={activeTrainers}
          />
        </div>
      </section>
    </main>
  );
}
