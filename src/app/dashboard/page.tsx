import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { PaymentHistoryTable } from "@/components/payments/payment-history-table";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { SessionCard } from "@/components/sessions/session-card";
import { evaluateJoinWindow } from "@/lib/video";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const user = await requireUser(["CLIENT", "ADMIN"]);

  // Fetch real coaching requests, unread message count, and payment history
  let sentRequests: any[] = [];
  let unreadCount = 0;
  let recentConversation: any = null;
  let clientPayments: any[] = [];
  let rawPaymentsData: any[] = [];
  let clientSessions: any[] = [];
  let activeWorkoutProgram: any = null;
  let todayWorkoutDay: any = null;
  let isCompletedToday = false;
  let activeNutritionPlan: any = null;
  let todayCalories = 0;
  let todayProtein = 0;

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [requestsData, unreadData, convData, paymentsData, sessionsData, programData, nutritionData, foodLogsData] = await Promise.all([
      prisma.coachingRequest.findMany({
        where: { clientId: user.id },
        include: {
          package: true,
          trainer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({
        where: {
          conversation: { clientId: user.id },
          senderId: { not: user.id },
          readAt: null,
        },
      }),
      prisma.conversation.findFirst({
        where: { clientId: user.id },
        include: {
          trainer: {
            include: {
              user: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { clientId: user.id },
        include: {
          package: true,
          trainer: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.coachingSession.findMany({
        where: { clientId: user.id },
        include: {
          trainer: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { scheduledStart: "asc" },
      }),
      prisma.workoutProgram.findFirst({
        where: { clientId: user.id, isActive: true },
        include: {
          trainer: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          workoutDays: {
            orderBy: { orderIndex: "asc" },
            include: {
              exercises: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          workoutLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      }),
      prisma.nutritionPlan.findFirst({
        where: { clientId: user.id, isActive: true },
      }),
      prisma.foodLog.findMany({
        where: { clientId: user.id, loggedDate: { gte: startOfToday } },
      }),
    ]);

    sentRequests = requestsData;
    unreadCount = unreadData;
    recentConversation = convData;
    rawPaymentsData = paymentsData;
    clientSessions = sessionsData;
    activeWorkoutProgram = programData;
    activeNutritionPlan = nutritionData;

    todayCalories = Math.round(foodLogsData.reduce((acc, curr) => acc + curr.calories, 0));
    todayProtein = Math.round(foodLogsData.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;

    if (programData && programData.workoutDays.length > 0) {
      const currentDayOfWeek = new Date().getDay();
      todayWorkoutDay =
        programData.workoutDays.find((d) => d.dayOfWeek === currentDayOfWeek) ||
        programData.workoutDays[programData.workoutLogs.length % programData.workoutDays.length] ||
        programData.workoutDays[0];

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      isCompletedToday = programData.workoutLogs.some(
        (l: any) => l.workoutDayId === todayWorkoutDay?.id && new Date(l.createdAt) >= startOfToday
      );
    }

    clientPayments = paymentsData.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      packageName: p.package?.name || "Coaching Package",
      packageDuration: p.package?.duration || "1 Month",
      trainerName: p.trainer?.user?.name || "Assigned Coach",
      trainerEmail: p.trainer?.user?.email || "",
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching client dashboard data:", err);
  }

  // 1. Combine Coaching Requests and Direct Package Payments for complete history
  const combinedHistory = [...sentRequests];

  // Add any paid payments that don't have an exact matching coaching request in sentRequests
  for (const payment of rawPaymentsData) {
    const hasMatchingReq = sentRequests.some(
      (r) => r.id === payment.coachingRequestId || (r.trainerId === payment.trainerId && payment.status === "PAID")
    );
    if (!hasMatchingReq && payment.trainer) {
      combinedHistory.push({
        id: `payment-req-${payment.id}`,
        clientId: payment.clientId,
        trainerId: payment.trainerId,
        packageId: payment.packageId,
        message: `Direct package purchase: ${payment.package?.name || "1-on-1 Coaching"}`,
        goal: "1-on-1 Personalized Coaching",
        startDate: payment.paidAt || payment.createdAt,
        status: payment.status === "PAID" ? "ACCEPTED" : "PENDING",
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        package: payment.package,
        trainer: payment.trainer,
        isSyntheticFromPayment: true,
        paymentId: payment.id,
      });
    }
  }

  // 2. Helper to determine if a coaching request or trainer relationship has a verified payment
  const isRequestPaid = (req: any) => {
    if (req.isSyntheticFromPayment) return true;
    return rawPaymentsData.some(
      (p) =>
        p.status?.toUpperCase() === "PAID" &&
        (p.coachingRequestId === req.id ||
          (p.trainerId === req.trainerId && (p.packageId === req.packageId || !req.packageId || !p.packageId)))
    );
  };

  // 3. Comprehensive Multi-Source Active Coaching Resolution
  // Source A: Verified PAID payment (Highest Priority)
  const latestPaidPayment = rawPaymentsData.find((p) => p.status?.toUpperCase() === "PAID");

  // Source B: Accepted Coaching Request
  const acceptedRequest = combinedHistory.find((r) => r.status?.toUpperCase() === "ACCEPTED");
  const isAcceptedPaid = acceptedRequest ? isRequestPaid(acceptedRequest) : false;

  // Source C: Active Workout Program assigned by a coach
  const activeProgramWithCoach = activeWorkoutProgram?.trainer ? activeWorkoutProgram : null;

  let activeCoaching: {
    trainerId: string;
    trainerName: string;
    trainerEmail: string;
    trainerSpecialty: string;
    trainerBio?: string | null;
    trainerAvatarUrl?: string | null;
    trainerRating: number;
    trainerExperience: number;
    packageName: string;
    packageDuration: string;
    packagePrice: number;
    packageBenefits: string[];
    startDate: Date;
    endDate: Date;
    daysRemaining: number;
    goal: string;
    coachingRequestId?: string;
    paymentId?: string;
    isPaid: boolean;
    statusBadgeText: string;
  } | null = null;

  if (latestPaidPayment) {
    const trainerProfile = latestPaidPayment.trainer;
    const trainerUser = trainerProfile?.user;
    const trainerName = trainerUser?.name || "Assigned Coach";
    const trainerEmail = trainerUser?.email || "";
    const trainerSpecialty = trainerProfile?.specialty || "Certified Personal Trainer";
    const trainerBio = trainerProfile?.bio || null;
    const trainerAvatarUrl = trainerProfile?.avatarUrl || null;
    const trainerRating = trainerProfile?.rating || 4.9;
    const trainerExperience = trainerProfile?.experience || 6;
    const trainerId = latestPaidPayment.trainerId;

    const matchingReq = combinedHistory.find(
      (r) => r.id === latestPaidPayment.coachingRequestId || r.trainerId === latestPaidPayment.trainerId
    );
    const startDate = latestPaidPayment.paidAt
      ? new Date(latestPaidPayment.paidAt)
      : latestPaidPayment.createdAt
      ? new Date(latestPaidPayment.createdAt)
      : new Date();
    const durationStr = latestPaidPayment.package?.duration || matchingReq?.package?.duration || "1 Month";

    const endDate = new Date(startDate);
    const lowerDuration = durationStr.toLowerCase();
    if (lowerDuration.includes("3 month") || lowerDuration.includes("quarter")) {
      endDate.setDate(endDate.getDate() + 90);
    } else if (lowerDuration.includes("6 month")) {
      endDate.setDate(endDate.getDate() + 180);
    } else if (lowerDuration.includes("year") || lowerDuration.includes("12 month")) {
      endDate.setDate(endDate.getDate() + 365);
    } else if (lowerDuration.includes("week")) {
      const weeks = parseInt(durationStr) || 4;
      endDate.setDate(endDate.getDate() + weeks * 7);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    const diffMs = endDate.getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    activeCoaching = {
      trainerId,
      trainerName,
      trainerEmail,
      trainerSpecialty,
      trainerBio,
      trainerAvatarUrl,
      trainerRating,
      trainerExperience,
      packageName: latestPaidPayment.package?.name || matchingReq?.package?.name || "1-on-1 Monthly Coaching",
      packageDuration: durationStr,
      packagePrice: (latestPaidPayment.amount || 99900) / 100,
      packageBenefits: latestPaidPayment.package?.benefits || [
        "Customized Workout Split",
        "Targeted Calorie & Macro Goals",
        "Direct Text & Audio Chat",
        "Weekly Check-in & Reviews",
      ],
      startDate,
      endDate,
      daysRemaining,
      goal: matchingReq?.goal || activeProgramWithCoach?.goal || "1-on-1 Physique & Strength Transformation",
      coachingRequestId: matchingReq?.id || latestPaidPayment.coachingRequestId || undefined,
      paymentId: latestPaidPayment.id,
      isPaid: true,
      statusBadgeText: "✓ Active Coaching (Paid)",
    };
  } else if (acceptedRequest) {
    const trainerProfile = acceptedRequest.trainer;
    const trainerUser = trainerProfile?.user;
    const trainerName = trainerUser?.name || "Assigned Coach";
    const trainerEmail = trainerUser?.email || "";
    const trainerSpecialty = trainerProfile?.specialty || "Certified Personal Trainer";
    const trainerBio = trainerProfile?.bio || null;
    const trainerAvatarUrl = trainerProfile?.avatarUrl || null;
    const trainerRating = trainerProfile?.rating || 4.9;
    const trainerExperience = trainerProfile?.experience || 6;
    const trainerId = acceptedRequest.trainerId;

    const startDate = acceptedRequest.startDate
      ? new Date(acceptedRequest.startDate)
      : acceptedRequest.createdAt
      ? new Date(acceptedRequest.createdAt)
      : new Date();
    const durationStr = acceptedRequest.package?.duration || "1 Month";
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (durationStr.includes("3") ? 90 : 30));
    const diffMs = endDate.getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    activeCoaching = {
      trainerId,
      trainerName,
      trainerEmail,
      trainerSpecialty,
      trainerBio,
      trainerAvatarUrl,
      trainerRating,
      trainerExperience,
      packageName: acceptedRequest.package?.name || "1-on-1 Monthly Coaching",
      packageDuration: durationStr,
      packagePrice: acceptedRequest.package?.price || acceptedRequest.trainer?.price || 999,
      packageBenefits: acceptedRequest.package?.benefits || [
        "Customized Workout Split",
        "Targeted Calorie & Macro Goals",
        "Direct Text & Audio Chat",
        "Weekly Check-in & Reviews",
      ],
      startDate,
      endDate,
      daysRemaining,
      goal: acceptedRequest.goal,
      coachingRequestId: acceptedRequest.id,
      isPaid: isAcceptedPaid,
      statusBadgeText: isAcceptedPaid ? "✓ Active Coaching (Paid)" : "✓ Active 1-on-1 Coaching",
    };
  } else if (activeProgramWithCoach) {
    const trainerProfile = activeProgramWithCoach.trainer;
    const trainerUser = trainerProfile?.user;
    const trainerName = trainerUser?.name || "Assigned Coach";
    const trainerEmail = trainerUser?.email || "";
    const trainerSpecialty = trainerProfile?.specialty || "Certified Personal Trainer";
    const trainerBio = trainerProfile?.bio || null;
    const trainerAvatarUrl = trainerProfile?.avatarUrl || null;
    const trainerRating = trainerProfile?.rating || 4.9;
    const trainerExperience = trainerProfile?.experience || 6;
    const trainerId = activeProgramWithCoach.trainerId;

    const startDate = activeProgramWithCoach.startDate
      ? new Date(activeProgramWithCoach.startDate)
      : activeProgramWithCoach.createdAt
      ? new Date(activeProgramWithCoach.createdAt)
      : new Date();
    const endDate = activeProgramWithCoach.endDate
      ? new Date(activeProgramWithCoach.endDate)
      : new Date(startDate.getTime() + (activeProgramWithCoach.durationWeeks || 4) * 7 * 24 * 60 * 60 * 1000);
    const diffMs = endDate.getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    activeCoaching = {
      trainerId,
      trainerName,
      trainerEmail,
      trainerSpecialty,
      trainerBio,
      trainerAvatarUrl,
      trainerRating,
      trainerExperience,
      packageName: activeProgramWithCoach.name || "Custom Periodized Split",
      packageDuration: `${activeProgramWithCoach.durationWeeks || 4} Weeks`,
      packagePrice: activeProgramWithCoach.trainer?.price || 999,
      packageBenefits: [
        "Customized Workout Split",
        "Prescribed Exercises & Sets/Reps",
        "Progression Tracking",
      ],
      startDate,
      endDate,
      daysRemaining,
      goal: activeProgramWithCoach.goal || "Hypertrophy & Strength",
      isPaid: true,
      statusBadgeText: "✓ Active Programming",
    };
  }

  // Pending payment request: Coach accepted request, awaiting client payment checkout (only if no other active coaching)
  const pendingPaymentRequest = !activeCoaching && acceptedRequest && !isAcceptedPaid ? acceptedRequest : null;

  // Pending review request: Sent by client, awaiting coach decision
  const pendingReviewRequest = !activeCoaching && !pendingPaymentRequest ? combinedHistory.find((r) => r.status === "PENDING") : null;

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Header greeting */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Client Portal
              </span>
              <span className="text-xs text-gray-400">
                Member ID: {user.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Welcome, {user.name}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Account Role: <span className="font-semibold text-white">Client</span> • {user.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/workouts"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-5 py-3.5 text-sm font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:scale-105 hover:bg-[#68e326]"
            >
              <span>🏋️ Workouts</span>
              {activeWorkoutProgram && (
                <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-black text-[#7CFF3B]">
                  {isCompletedToday ? "✓ Done" : "Today"}
                </span>
              )}
            </Link>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-sm font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            >
              <span>📅 Video Sessions</span>
              {clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length > 0 && (
                <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-xs font-black text-black">
                  {clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length}
                </span>
              )}
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11161D] px-5 py-3.5 text-sm font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            >
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-xs font-black text-black">
                  {unreadCount} new
                </span>
              )}
            </Link>
            <Link
              href="/trainers"
              className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3.5 text-sm font-bold text-gray-300 transition hover:text-white"
            >
              Browse Coaches →
            </Link>
          </div>
        </div>

        {/* Overview Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Today's Assigned Workout Card */}
            {activeWorkoutProgram && todayWorkoutDay && (
              <div className="rounded-[32px] border border-[#7CFF3B]/30 bg-gradient-to-br from-[#11161D] via-[#141C25] to-[#11161D] p-8 shadow-[0_0_35px_rgba(124,255,59,0.12)]">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#7CFF3B] px-3 py-1 text-xs font-black text-black uppercase tracking-wider">
                        🎯 Today&apos;s Workout
                      </span>
                      {isCompletedToday ? (
                        <span className="rounded-full bg-[#7CFF3B]/20 border border-[#7CFF3B]/40 px-3 py-1 text-xs font-bold text-[#7CFF3B]">
                          ✓ Completed Today
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-3 py-1 text-xs font-bold text-yellow-300">
                          ⚡ Ready to Train
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
                      {todayWorkoutDay.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-400">
                      {todayWorkoutDay.exercises.length} prescribed movements • {activeWorkoutProgram.name}
                    </p>
                  </div>

                  <Link
                    href="/workouts"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-4 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326]"
                  >
                    <span>🚀 {isCompletedToday ? "View / Log Session" : "Start Workout"}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Active Coaching / My Trainer Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-bold text-white">My Active Coaching</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Current coach, enrolled package, and programming status</p>
                </div>
                {activeCoaching ? (
                  <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3.5 py-1 text-xs font-black text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>{activeCoaching.statusBadgeText}</span>
                  </div>
                ) : pendingPaymentRequest ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                    Payment Required to Activate
                  </span>
                ) : pendingReviewRequest ? (
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400">
                    Pending Coach Response
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                    No Active Coach
                  </span>
                )}
              </div>

              {activeCoaching ? (
                <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-[#7CFF3B]/30 bg-gradient-to-br from-[#7CFF3B]/10 via-transparent to-[#7CFF3B]/5 p-6 shadow-[0_0_30px_rgba(124,255,59,0.05)]">
                  {/* Coach Profile & Package Hero */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      {activeCoaching.trainerAvatarUrl ? (
                        <img
                          src={activeCoaching.trainerAvatarUrl}
                          alt={activeCoaching.trainerName}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-[#7CFF3B]/50 shadow-md"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7CFF3B] to-[#244613] text-2xl font-black text-black shadow-md">
                          {activeCoaching.trainerName[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">
                            {activeCoaching.trainerName}
                          </h3>
                          <span className="rounded-full bg-[#7CFF3B]/20 border border-[#7CFF3B]/40 px-2 py-0.5 text-[10px] font-black text-[#7CFF3B]">
                            ✓ Verified Coach
                          </span>
                        </div>
                        <p className="text-xs text-[#7CFF3B] font-semibold mt-0.5">
                          {activeCoaching.trainerSpecialty} • {activeCoaching.trainerExperience} yrs exp • ⭐ {activeCoaching.trainerRating}
                        </p>
                        <p className="text-xs text-gray-300 mt-1.5">
                          Enrolled Plan: <span className="text-white font-bold">{activeCoaching.packageName}</span> (₹{activeCoaching.packagePrice.toLocaleString("en-IN")} / {activeCoaching.packageDuration})
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right bg-black/30 border border-white/5 rounded-xl p-3 sm:bg-transparent sm:border-0 sm:p-0">
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Billing / Cycle</span>
                      <p className="text-sm font-black text-[#7CFF3B]">
                        {activeCoaching.daysRemaining > 0 ? `${activeCoaching.daysRemaining} Days Remaining` : "Renewal Due"}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        Started {activeCoaching.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • Valid until {activeCoaching.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Active Goal */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-gray-300">
                    <span className="font-bold text-[#7CFF3B] uppercase tracking-wider text-[10px] block mb-1">
                      🎯 Primary Coaching Goal
                    </span>
                    <span className="font-medium text-white text-sm">{activeCoaching.goal}</span>
                  </div>

                  {/* Programming Highlights Snapshots */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/workouts"
                      className="rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-[#7CFF3B]/50 hover:bg-white/[0.08]"
                    >
                      <div className="text-xs text-gray-400 font-bold">🏋️ Workouts</div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {activeWorkoutProgram ? activeWorkoutProgram.name : "Custom Periodization"}
                      </div>
                      <div className="text-[11px] text-[#7CFF3B] mt-0.5">
                        {activeWorkoutProgram ? `${activeWorkoutProgram.workoutDays.length} training days/week` : "Ready to view →"}
                      </div>
                    </Link>

                    <Link
                      href="/nutrition"
                      className="rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-[#7CFF3B]/50 hover:bg-white/[0.08]"
                    >
                      <div className="text-xs text-gray-400 font-bold">🥗 Nutrition & Macros</div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {activeNutritionPlan ? `${activeNutritionPlan.dailyCalories} kcal / day` : "Prescribed Targets"}
                      </div>
                      <div className="text-[11px] text-[#7CFF3B] mt-0.5">
                        {activeNutritionPlan ? `${todayCalories} kcal consumed today` : "Open nutrition →"}
                      </div>
                    </Link>

                    <Link
                      href="/sessions"
                      className="rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-[#7CFF3B]/50 hover:bg-white/[0.08]"
                    >
                      <div className="text-xs text-gray-400 font-bold">📹 1-on-1 Video</div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length > 0
                          ? `${clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length} Session(s) Scheduled`
                          : "Live Coaching"}
                      </div>
                      <div className="text-[11px] text-[#7CFF3B] mt-0.5">
                        {clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length > 0
                          ? "View upcoming calls →"
                          : "Schedule call →"}
                      </div>
                    </Link>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#7CFF3B]/20 pt-4">
                    <div className="text-xs text-gray-400">
                      Package: <span className="font-semibold text-white">{activeCoaching.packageName}</span> • Status: <span className="text-[#7CFF3B] font-bold">Active</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/messages?trainerId=${activeCoaching.trainerId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-black text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] transition hover:scale-105 hover:bg-[#68e326]"
                      >
                        <span>💬 Message Coach</span>
                      </Link>
                      <Link
                        href="/workouts"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                      >
                        Workouts
                      </Link>
                      <Link
                        href="/nutrition"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                      >
                        Nutrition
                      </Link>
                      <Link
                        href="/sessions"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                      >
                        Sessions
                      </Link>
                      <a
                        href="#payments-history"
                        className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-gray-300 transition hover:text-white hover:border-white/30"
                      >
                        Invoices
                      </a>
                    </div>
                  </div>
                </div>
              ) : pendingPaymentRequest ? (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎉</span>
                        <h4 className="font-bold text-white text-base">
                          Coach {pendingPaymentRequest.trainer.user.name} Accepted Your Request!
                        </h4>
                      </div>
                      <p className="text-xs text-gray-300 mt-1.5">
                        Package: <span className="font-bold text-white">{pendingPaymentRequest.package?.name || "1-on-1 Coaching"}</span> ({pendingPaymentRequest.package?.duration || "1 Month"} — ₹{pendingPaymentRequest.package?.price || 999})
                      </p>
                      <p className="text-xs text-amber-300 mt-1">
                        Complete your package payment below to officially activate 1-on-1 programming and begin training.
                      </p>
                    </div>

                    {pendingPaymentRequest.package && (
                      <CheckoutButton
                        packageId={pendingPaymentRequest.package.id}
                        packageName={pendingPaymentRequest.package.name}
                        price={pendingPaymentRequest.package.price}
                        duration={pendingPaymentRequest.package.duration}
                        trainerName={pendingPaymentRequest.trainer.user.name}
                        coachingRequestId={pendingPaymentRequest.id}
                        buttonText={`Pay & Activate (₹${pendingPaymentRequest.package.price})`}
                        className="rounded-xl bg-[#7CFF3B] px-5 py-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326]"
                      />
                    )}
                  </div>
                </div>
              ) : pendingReviewRequest ? (
                <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        Request Pending with Coach {pendingReviewRequest.trainer.user.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Package: {pendingReviewRequest.package?.name || "1-on-1 Coaching"} ({pendingReviewRequest.package?.duration || "1 Month"}) • Submitted {new Date(pendingReviewRequest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-300 italic">
                    "{pendingReviewRequest.message}"
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B0F14] p-8 text-center">
                  <div className="text-4xl mb-3">🏋️‍♂️</div>
                  <h3 className="text-lg font-bold text-white">
                    You haven't selected a trainer yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                    Compare verified specialists in strength, fat loss, and mobility. Every coaching package starts with a 3-day complimentary chat.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/trainers"
                      className="inline-block rounded-xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black transition hover:scale-105"
                    >
                      Find Your Coach Now →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Coaching Sessions Card */}
            {clientSessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE").length > 0 && (
              <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Upcoming Video Sessions</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Live 1-on-1 video training calls with your coach</p>
                  </div>
                  <Link
                    href="/sessions"
                    className="text-xs font-bold text-[#7CFF3B] hover:underline"
                  >
                    View All ({clientSessions.length}) →
                  </Link>
                </div>

                <div className="space-y-4">
                  {clientSessions
                    .filter((s) => s.status === "SCHEDULED" || s.status === "LIVE")
                    .slice(0, 2)
                    .map((session) => {
                      const joinEval = evaluateJoinWindow(
                        session.scheduledStart,
                        session.scheduledEnd,
                        session.status
                      );
                      return (
                        <SessionCard
                          key={session.id}
                          id={session.id}
                          title={session.title}
                          description={session.description}
                          scheduledStart={session.scheduledStart}
                          scheduledEnd={session.scheduledEnd}
                          duration={session.duration}
                          status={session.status}
                          videoRoomId={session.videoRoomId}
                          trainerName={session.trainer.user.name}
                          trainerSpecialty={session.trainer.specialty || "Certified Trainer"}
                          isHost={false}
                          joinWindow={joinEval}
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* Coaching Requests & Packages History */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-bold text-white">Coaching Requests & Packages History</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Applications sent, enrolled packages, and coaching plans</p>
                </div>
                <span className="text-xs text-gray-400">
                  {combinedHistory.length} Total
                </span>
              </div>

              {combinedHistory.length > 0 ? (
                <div className="mt-6 divide-y divide-white/10">
                  {combinedHistory.map((req) => {
                    const isPaid = isRequestPaid(req);
                    const trainerName = req.trainer?.user?.name || "Assigned Coach";
                    const trainerPrice = req.package?.price || req.trainer?.price || 999;
                    const trainerId = req.trainer?.id || req.trainerId;

                    return (
                      <div key={req.id} className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-bold text-white">{trainerName}</h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                req.status === "ACCEPTED"
                                  ? isPaid
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : req.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {req.status === "ACCEPTED"
                                ? isPaid
                                  ? "✓ Enrolled & Paid"
                                  : "Accepted • Payment Pending"
                                : req.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Package: <span className="text-white font-medium">{req.package?.name || "1-on-1 Coaching"}</span> ({req.package?.duration || "1 Month"} — ₹{trainerPrice}) • Goal: {req.goal}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                            "{req.message}"
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {req.package && req.status === "ACCEPTED" && !isPaid && (
                            <CheckoutButton
                              packageId={req.package.id}
                              packageName={req.package.name}
                              price={req.package.price}
                              duration={req.package.duration}
                              trainerName={trainerName}
                              coachingRequestId={req.id.startsWith("payment-req-") ? undefined : req.id}
                              buttonText={`Pay ₹${req.package.price}`}
                              className="inline-flex items-center justify-center rounded-xl bg-[#7CFF3B] px-3.5 py-1.5 text-xs font-bold text-black transition hover:bg-[#68e02d]"
                            />
                          )}
                          {isPaid && (
                            <span className="rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-1.5 text-xs font-bold text-green-400">
                              ✓ Paid & Active
                            </span>
                          )}
                          {trainerId && (
                            <Link
                              href={`/messages?trainerId=${trainerId}`}
                              className="text-xs font-semibold text-[#7CFF3B] hover:underline"
                            >
                              Chat →
                            </Link>
                          )}
                          {trainerId && (
                            <Link
                              href={`/trainers/${trainerId}`}
                              className="text-xs font-semibold text-gray-400 hover:text-white"
                            >
                              Profile
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  No requests sent yet. Browse the marketplace to connect with a coach.
                </div>
              )}
            </div>

            {/* Payment History & Invoices Section */}
            <div id="payments-history" className="rounded-[32px] border border-white/10 bg-[#11161D] p-8 shadow-md">
              <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Payment History & Invoices</h3>
                  <p className="text-xs text-gray-400">All your verified coaching transactions and official receipts</p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                  {clientPayments.length} Invoices
                </span>
              </div>
              <PaymentHistoryTable payments={clientPayments} />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* My Active Program Summary Card */}
            {activeWorkoutProgram && (
              <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white">My Program</h3>
                  <Link
                    href="/workouts"
                    className="text-xs font-bold text-[#7CFF3B] hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="mt-4 space-y-2.5">
                  <p className="font-black text-white text-base">{activeWorkoutProgram.name}</p>
                  <p className="text-xs text-gray-400">
                    <span className="text-[#7CFF3B] font-semibold">Goal:</span> {activeWorkoutProgram.goal}
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0B0F15] p-3 text-xs">
                    <span className="text-gray-400">Schedule:</span>
                    <span className="font-bold text-white">
                      {activeWorkoutProgram.weeklyStructure || `${activeWorkoutProgram.workoutDays.length} Days / Week`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0B0F15] p-3 text-xs">
                    <span className="text-gray-400">Logs Completed:</span>
                    <span className="font-bold text-[#7CFF3B]">
                      {activeWorkoutProgram.workoutLogs.length} Workouts
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* My Nutrition Summary Card */}
            {activeNutritionPlan && (
              <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white">Daily Nutrition</h3>
                  <Link
                    href="/nutrition"
                    className="text-xs font-bold text-[#7CFF3B] hover:underline"
                  >
                    Nutrition Diary →
                  </Link>
                </div>
                <div className="mt-4 space-y-2.5">
                  <p className="font-black text-white text-base">{activeNutritionPlan.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Calories Today:</span>
                    <span className="font-bold text-white font-mono">
                      {todayCalories.toLocaleString()} / {activeNutritionPlan.dailyCalories.toLocaleString()} kcal
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#7CFF3B]"
                      style={{
                        width: `${Math.min(100, Math.round((todayCalories / activeNutritionPlan.dailyCalories) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0B0F15] p-3 text-xs">
                    <span className="text-blue-400 font-semibold">Protein Target:</span>
                    <span className="font-bold text-white">
                      {todayProtein}g / {activeNutritionPlan.proteinGrams}g
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Messages Quick Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white">Direct Chat</h3>
                <Link
                  href="/messages"
                  className="text-xs font-bold text-[#7CFF3B] hover:underline"
                >
                  Open Inbox →
                </Link>
              </div>

              {recentConversation ? (
                <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Coach {recentConversation.trainer.user.name}
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-[10px] font-black text-black">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {recentConversation.messages[0]?.content || "No messages yet. Say hi to your coach!"}
                  </p>
                  <Link
                    href={`/messages?conversationId=${recentConversation.id}`}
                    className="mt-3 block text-center rounded-xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 py-2 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20"
                  >
                    Reply to Coach →
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-4 text-center">
                  No chat conversations yet. Connect with a trainer to unlock direct messaging.
                </p>
              )}
            </div>

            {/* Quick Profile Summary */}
            <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 shadow-md">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">
                Account Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Name:</span>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Email:</span>
                  <span className="text-white font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Account Type:</span>
                  <span className="text-[#7CFF3B] font-bold">Client</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Joined:</span>
                  <span className="text-white">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
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
