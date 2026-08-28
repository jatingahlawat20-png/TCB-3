import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRazorpayOrder,
  getRazorpayConfig,
  rupeesToPaise,
  paiseToRupees,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, coachingRequestId } = body;

    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    // 1. Fetch package details SERVER-SIDE from Prisma. Never trust client prices!
    const coachingPackage = await prisma.coachingPackage.findUnique({
      where: { id: packageId },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!coachingPackage) {
      return NextResponse.json({ error: "Coaching package not found" }, { status: 404 });
    }

    if (!coachingPackage.active) {
      return NextResponse.json({ error: "This coaching package is currently unavailable" }, { status: 400 });
    }

    // 2. Perform safe integer minor-unit (paise) money calculations
    const config = getRazorpayConfig();
    const amountInPaise = rupeesToPaise(coachingPackage.price);
    const platformFeeRate = config.platformFeePercent / 100;
    const platformFeeInPaise = Math.round(amountInPaise * platformFeeRate);
    const trainerEarningsInPaise = amountInPaise - platformFeeInPaise;

    // 3. Create real Razorpay Sandbox Order
    const receipt = `rcpt_${user.id.slice(0, 5)}_${Date.now()}`;
    const rzpOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        packageId: coachingPackage.id,
        packageName: coachingPackage.name,
        trainerId: coachingPackage.trainerId,
        trainerName: coachingPackage.trainer.user.name,
        clientId: user.id,
        clientName: user.name,
        coachingRequestId: coachingRequestId || "",
      },
    });

    // 4. Create persistent PENDING Payment record in database
    const payment = await prisma.payment.create({
      data: {
        clientId: user.id,
        trainerId: coachingPackage.trainerId,
        packageId: coachingPackage.id,
        coachingRequestId: coachingRequestId || null,
        amount: amountInPaise,
        currency: "INR",
        platformFeeRate,
        platformFee: platformFeeInPaise,
        trainerEarnings: trainerEarningsInPaise,
        status: "PENDING",
        razorpayOrderId: rzpOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      amount: amountInPaise,
      amountRupees: paiseToRupees(amountInPaise),
      currency: "INR",
      key: config.keyId,
      isSandboxFallback: Boolean(rzpOrder.isSandboxFallback),
      packageName: coachingPackage.name,
      trainerName: coachingPackage.trainer.user.name,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json({ error: "Failed to initialize payment order" }, { status: 500 });
  }
}
