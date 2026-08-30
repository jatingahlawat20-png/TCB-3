import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paiseToRupees } from "@/lib/razorpay";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "CLIENT") {
      const payments = await prisma.payment.findMany({
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
      });

      const formatted = payments.map((p) => ({
        id: p.id,
        amount: paiseToRupees(p.amount),
        currency: p.currency,
        status: p.status,
        packageName: p.package?.name || "Custom Coaching Package",
        packageDuration: p.package?.duration || "1 Month",
        trainerName: p.trainer?.user?.name || "Personal Coach",
        trainerEmail: p.trainer?.user?.email || "",
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }));

      return NextResponse.json({
        role: "CLIENT",
        payments: formatted,
      });
    }

    if (user.role === "TRAINER") {
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!trainerProfile) {
        return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 });
      }

      const payments = await prisma.payment.findMany({
        where: { trainerId: trainerProfile.id },
        include: {
          package: true,
          client: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate aggregated metrics for PAID records
      const paidRecords = payments.filter((p) => p.status === "PAID");
      const grossPaise = paidRecords.reduce((acc, curr) => acc + curr.amount, 0);
      const feePaise = paidRecords.reduce((acc, curr) => acc + curr.platformFee, 0);
      const netPaise = paidRecords.reduce((acc, curr) => acc + curr.trainerEarnings, 0);

      const formatted = payments.map((p) => ({
        id: p.id,
        grossAmount: paiseToRupees(p.amount),
        platformFee: paiseToRupees(p.platformFee),
        netEarnings: paiseToRupees(p.trainerEarnings),
        currency: p.currency,
        status: p.status,
        packageName: p.package?.name || "Coaching Package",
        packageDuration: p.package?.duration || "1 Month",
        clientName: p.client?.name || "Client",
        clientEmail: p.client?.email || "",
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }));

      return NextResponse.json({
        role: "TRAINER",
        metrics: {
          totalGross: paiseToRupees(grossPaise),
          totalPlatformFee: paiseToRupees(feePaise),
          totalNetEarnings: paiseToRupees(netPaise),
          paidCount: paidRecords.length,
        },
        ledger: formatted,
      });
    }

    // Fallback for ADMIN
    const allPayments = await prisma.payment.findMany({
      include: {
        package: true,
        client: { select: { name: true, email: true } },
        trainer: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      role: "ADMIN",
      payments: allPayments.map((p) => ({
        ...p,
        amount: paiseToRupees(p.amount),
        platformFee: paiseToRupees(p.platformFee),
        trainerEarnings: paiseToRupees(p.trainerEarnings),
      })),
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
  }
}
