import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { TrainerRequestsManager } from "@/components/trainer/requests-manager";
import { EarningsLedger } from "@/components/trainer/earnings-ledger";
import { paiseToRupees } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ onboarding?: string }>;
};

export default async function TrainerDashboardPage(props: Props) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const isJustPublished = searchParams?.onboarding === "published";
  const user = await requireUser(["TRAINER", "ADMIN"]);

  // Fetch incoming coaching requests, packages, conversations, unread count, and payments
  let incomingRequests: any[] = [];
  let packages: any[] = [];
  let unreadCount = 0;
  let recentConversations: any[] = [];
  let financialMetrics = {
    totalGross: 0,
    totalPlatformFee: 0,
    totalNetEarnings: 0,
    paidCount: 0,
  };
  let ledgerItems: any[] = [];
  let trainerSessions: any[] = [];

  if (user.trainerProfile) {
    try {
      const [requestsData, packagesData, unreadData, convsData, paymentsData, sessionsData] = await Promise.all([
        prisma.coachingRequest.findMany({
          where: {
            trainerId: user.trainerProfile.id,
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            package: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.coachingPackage.findMany({
          where: {
            trainerId: user.trainerProfile.id,
          },
          orderBy: { price: "asc" },
        }),
        prisma.message.count({
          where: {
            conversation: { trainerId: user.trainerProfile.id },
            senderId: { not: user.id },
            readAt: null,
          },
        }),
        prisma.conversation.findMany({
          where: { trainerId: user.trainerProfile.id },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          take: 3,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.payment.findMany({
          where: { trainerId: user.trainerProfile.id },
          include: {
            package: true,
            client: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.coachingSession.findMany({
          where: { trainerId: user.trainerProfile.id },
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { scheduledStart: "asc" },
        }),
      ]);

      incomingRequests = requestsData.map((req) => {
        const isPaid = paymentsData.some(
          (p) =>
            p.status === "PAID" &&
            (p.coachingRequestId === req.id ||
              (p.trainerId === user.trainerProfile?.id && p.packageId === req.packageId && p.clientId === req.clientId))
        );
        return {
          ...req,
          isPaid,
        };
      });
      packages = packagesData;
      unreadCount = unreadData;
      recentConversations = convsData;
      trainerSessions = sessionsData;

      const paidPayments = paymentsData.filter((p) => p.status === "PAID");
      const grossPaise = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const feePaise = paidPayments.reduce((acc, curr) => acc + curr.platformFee, 0);
      const netPaise = paidPayments.reduce((acc, curr) => acc + curr.trainerEarnings, 0);

      financialMetrics = {
        totalGross: paiseToRupees(grossPaise),
        totalPlatformFee: paiseToRupees(feePaise),
        totalNetEarnings: paiseToRupees(netPaise),
        paidCount: paidPayments.length,
      };

      ledgerItems = paymentsData.map((p) => ({
        id: p.id,
        grossAmount: paiseToRupees(p.amount),
        platformFee: paiseToRupees(p.platformFee),
        netEarnings: paiseToRupees(p.trainerEarnings),
        currency: p.currency,
        status: p.status,
        packageName: p.package?.name || "Coaching Package",
        packageDuration: p.package?.duration || "1 Month",
        clientName: p.client.name,
        clientEmail: p.client.email,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
      }));
    } catch (err) {
      console.error("Error fetching trainer dashboard data:", err);
    }
  }

  const pendingRequests = incomingRequests.filter((r) => r.status === "PENDING");
  const acceptedClients = incomingRequests.filter((r) => r.status === "ACCEPTED");

  const rejectionTag = user.trainerProfile?.tags.find((t) => t.startsWith("rejection_reason:"));
  const rejectionReason = rejectionTag ? rejectionTag.replace("rejection_reason:", "") : null;
  const isVerified = Boolean(user.trainerProfile?.verified && user.trainerProfile?.status === "ACTIVE");
  const isNeedsChanges = Boolean(user.trainerProfile?.status === "INACTIVE" || rejectionReason);
  const isPending = Boolean(!isVerified && !isNeedsChanges && user.trainerProfile?.status === "PENDING");

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {isJustPublished && (
          <div className="mb-8 rounded-3xl border border-[#7CFF3B]/40 bg-gradient-to-r from-[#142316] via-[#11161D] to-[#142316] p-6 shadow-[0_15px_40px_rgba(124,255,59,0.15)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🎉</span>
                <div>
                  <h3 className="text-xl font-black text-white">You're Live on TCB-3!</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Your coaching profile has been automatically verified and published. Clients can now discover you in the marketplace.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/trainers/${user.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                >
                  View Public Profile →
                </Link>
                <Link
                  href="/trainers"
                  className="rounded-xl bg-[#7CFF3B] px-4 py-2 text-xs font-black text-black transition hover:scale-105 hover:bg-[#68e326]"
                >
                  Explore Marketplace →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Header greeting */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Coach Management Portal
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isVerified
                    ? "bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-[#7CFF3B]"
                    : isNeedsChanges
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                    : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                }`}
              >
                {isVerified
                  ? "✓ Verified Trainer"
                  : isNeedsChanges
                  ? "⚠️ Verification Needs Changes"
                  : "⏳ Verification Pending"}
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Welcome, Coach {user.name}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Account Role: <span className="font-semibold text-[#7CFF3B]">Trainer</span> • {user.email} • {user.trainerProfile?.specialty || "Personal Trainer"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trainer/onboarding"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-gray-200 transition hover:border-[#7CFF3B] hover:text-white"
            >
              <span>⚙️ Edit Profile</span>
            </Link>
            <Link
              href="/trainer/programs"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-5 py-3 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:scale-105 hover:bg-[#68e326]"
            >
              <span>🏋️ Programs</span>
            </Link>
            <Link
              href="/trainer/sessions"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            >
              <span>📅 Sessions</span>
              {trainerSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length > 0 && (
                <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-[10px] font-black text-black">
                  {trainerSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length}
                </span>
              )}
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            >
              <span>Direct Messages</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-[10px] font-black text-black">
                  {unreadCount} new
                </span>
              )}
            </Link>
            <Link
              href="/trainer/packages"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-gray-300 transition hover:text-white"
            >
              Packages ({packages.length})
            </Link>
            <Link
              href={user.trainerProfile ? `/trainers/${user.id}` : "/trainers"}
              target="_blank"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3 text-xs font-bold text-gray-300 transition hover:text-white"
            >
              Public Profile ↗
            </Link>
          </div>
        </div>

        {/* Dynamic Verification Status Banners */}
        {isNeedsChanges && (
          <div className="mt-8 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-white">Verification Needs Changes</h3>
                <p className="mt-1 text-sm text-rose-200">
                  <strong className="text-white">Admin Feedback:</strong>{" "}
                  {rejectionReason || "Please update your professional credentials and coaching methodology."}
                </p>
                <p className="mt-1 text-xs text-rose-300">
                  Your profile is temporarily hidden until you update and resubmit.
                </p>
              </div>
            </div>
            <Link
              href="/trainer/onboarding"
              className="rounded-2xl bg-rose-500 px-6 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition hover:bg-rose-600 shrink-0 text-center"
            >
              Update Profile & Resubmit →
            </Link>
          </div>
        )}

        {isPending && (
          <div className="mt-8 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⏳</span>
              <div>
                <h3 className="text-base font-bold text-white">Verification Under Review</h3>
                <p className="mt-1 text-xs text-yellow-200">
                  Your coaching profile has been submitted and is currently live on the marketplace as <strong>"Verification Pending"</strong>. TCB-3 administrators are reviewing your credentials.
                </p>
              </div>
            </div>
            <Link
              href="/trainer/onboarding"
              className="rounded-2xl border border-yellow-500/30 bg-yellow-500/20 px-5 py-2.5 text-xs font-bold text-yellow-300 hover:bg-yellow-500/30 shrink-0 text-center"
            >
              Review / Edit Profile
            </Link>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Clients</p>
            <p className="mt-2 text-3xl font-black text-white">{acceptedClients.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Pending Requests</p>
            <p className="mt-2 text-3xl font-black text-[#7CFF3B]">{pendingRequests.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Unread Messages</p>
            <p className="mt-2 text-3xl font-black text-white">{unreadCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Packages</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{packages.filter(p => p.active).length}</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Main Column (Interactive Requests & Clients & Financial Ledger) */}
          <div className="space-y-8 lg:col-span-2">
            <TrainerRequestsManager initialRequests={incomingRequests} />
            <EarningsLedger metrics={financialMetrics} ledger={ledgerItems} />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Direct Client Messages Quick Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white">Client Messages</h3>
                <Link
                  href="/messages"
                  className="text-xs font-bold text-[#7CFF3B] hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {recentConversations.length > 0 ? (
                  recentConversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/messages?conversationId=${conv.id}`}
                      className="block rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 transition hover:border-[#7CFF3B]/40"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-xs">{conv.client.name}</p>
                        <span className="text-[10px] text-gray-500">
                          {new Date(conv.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        {conv.messages[0]?.content || "No messages yet"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-3 text-center">
                    No conversations yet. When clients message, they will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Packages Quick Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white">Your Packages</h3>
                <Link
                  href="/trainer/packages"
                  className="text-xs font-bold text-[#7CFF3B] hover:underline"
                >
                  Manage →
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3.5"
                    >
                      <div>
                        <p className="font-bold text-white text-xs">{pkg.name}</p>
                        <p className="text-[10px] text-gray-400">{pkg.duration}</p>
                      </div>
                      <span className="text-xs font-black text-[#7CFF3B]">₹{pkg.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-2">
                    No packages created yet.
                  </p>
                )}
              </div>
            </div>

            {/* Trainer Profile Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">
                Profile Overview
              </h3>
              <div className="mt-4 space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Specialty</p>
                  <p className="text-white font-medium">{user.trainerProfile?.specialty || "Personal Trainer"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bio</p>
                  <p className="text-xs text-gray-300 leading-relaxed mt-1">{user.trainerProfile?.bio || "Certified coach on TCB-3."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
