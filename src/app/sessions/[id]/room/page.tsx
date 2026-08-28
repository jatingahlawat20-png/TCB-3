import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoRoom } from "@/components/sessions/video-room";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SessionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const session = await prisma.coachingSession.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      trainer: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!session) {
    return (
      <main className="min-h-screen bg-[#080B0F] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#111622] p-8 shadow-2xl">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-black mb-2">Session Not Found</h1>
          <p className="text-xs text-gray-400 mb-6">
            The requested coaching session could not be located or has been removed.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] hover:bg-[#68e02d]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Authorization check
  const isClient = session.clientId === user.id;
  const isTrainer = session.trainer.userId === user.id;

  if (!isClient && !isTrainer && user.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-[#080B0F] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-full max-w-md rounded-[32px] border border-rose-500/30 bg-[#111622] p-8 shadow-2xl">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-rose-400 mb-2">Access Denied</h1>
          <p className="text-xs text-gray-300 mb-6 leading-relaxed">
            You are not authorized to participate in this coaching session. Only the assigned client and personal trainer can enter this video room.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] hover:bg-[#68e02d]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <VideoRoom sessionId={session.id} />;
}
