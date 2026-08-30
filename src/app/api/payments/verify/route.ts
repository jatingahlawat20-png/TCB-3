import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment verification parameters" },
        { status: 400 }
      );
    }

    // 1. Locate the Payment record by order ID
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: {
        package: true,
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    }

    // Security check: ensure the payment belongs to the calling user
    if (existingPayment.clientId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. IDEMPOTENCY GUARD: If already marked PAID, ensure coaching request & conversation exist before returning
    if (existingPayment.status === "PAID") {
      let finalCoachingRequestId = existingPayment.coachingRequestId;
      if (existingPayment.coachingRequestId) {
        await prisma.coachingRequest.update({
          where: { id: existingPayment.coachingRequestId },
          data: { status: "ACCEPTED" },
        });
      } else {
        const existingReq = await prisma.coachingRequest.findFirst({
          where: {
            clientId: existingPayment.clientId,
            trainerId: existingPayment.trainerId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (existingReq) {
          const updatedReq = await prisma.coachingRequest.update({
            where: { id: existingReq.id },
            data: {
              status: "ACCEPTED",
              packageId: existingPayment.packageId || existingReq.packageId,
            },
          });
          finalCoachingRequestId = updatedReq.id;
        } else {
          const newReq = await prisma.coachingRequest.create({
            data: {
              clientId: existingPayment.clientId,
              trainerId: existingPayment.trainerId,
              packageId: existingPayment.packageId,
              goal: "1-on-1 Personalized Coaching",
              message: `Direct package purchase: ${existingPayment.package?.name || "1-on-1 Coaching"}`,
              status: "ACCEPTED",
              startDate: new Date(),
            },
          });
          finalCoachingRequestId = newReq.id;
        }

        if (finalCoachingRequestId) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { coachingRequestId: finalCoachingRequestId },
          });
        }
      }

      await prisma.conversation.upsert({
        where: {
          clientId_trainerId: {
            clientId: existingPayment.clientId,
            trainerId: existingPayment.trainerId,
          },
        },
        update: {},
        create: {
          clientId: existingPayment.clientId,
          trainerId: existingPayment.trainerId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment was previously verified and coaching relationship confirmed.",
        payment: existingPayment,
      });
    }

    // 3. Cryptographic Signature Verification
    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.error(
        `[Payment Verification Failure] Order ${razorpay_order_id} failed signature verification with payment ID ${razorpay_payment_id}.`
      );

      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "FAILED",
          failureReason: "Cryptographic signature verification failed.",
        },
      });

      return NextResponse.json(
        { error: "Invalid payment signature verification failed" },
        { status: 400 }
      );
    }

    // 4. Update Payment to PAID with verified timestamp
    const updatedPayment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
      include: {
        package: true,
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    console.log(
      `[Payment Success] Order ${razorpay_order_id} verified successfully. Amount: ₹${updatedPayment.amount / 100} (${updatedPayment.package?.name || "Package"}). Status updated to PAID.`
    );

    // 5. Connect / activate coaching relationship
    let finalCoachingRequestId = existingPayment.coachingRequestId;
    if (existingPayment.coachingRequestId) {
      await prisma.coachingRequest.update({
        where: { id: existingPayment.coachingRequestId },
        data: { status: "ACCEPTED" },
      });
    } else {
      // Direct package purchase: find existing request or create an active ACCEPTED coaching request
      const existingReq = await prisma.coachingRequest.findFirst({
        where: {
          clientId: existingPayment.clientId,
          trainerId: existingPayment.trainerId,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingReq) {
        const updatedReq = await prisma.coachingRequest.update({
          where: { id: existingReq.id },
          data: {
            status: "ACCEPTED",
            packageId: existingPayment.packageId || existingReq.packageId,
          },
        });
        finalCoachingRequestId = updatedReq.id;
      } else {
        const newReq = await prisma.coachingRequest.create({
          data: {
            clientId: existingPayment.clientId,
            trainerId: existingPayment.trainerId,
            packageId: existingPayment.packageId,
            goal: "1-on-1 Personalized Coaching",
            message: `Direct package purchase: ${existingPayment.package?.name || "1-on-1 Coaching"}`,
            status: "ACCEPTED",
            startDate: new Date(),
          },
        });
        finalCoachingRequestId = newReq.id;
      }

      if (finalCoachingRequestId) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { coachingRequestId: finalCoachingRequestId },
        });
      }
    }

    // 6. Ensure Conversation exists between Client and Trainer for chat access
    await prisma.conversation.upsert({
      where: {
        clientId_trainerId: {
          clientId: existingPayment.clientId,
          trainerId: existingPayment.trainerId,
        },
      },
      update: {},
      create: {
        clientId: existingPayment.clientId,
        trainerId: existingPayment.trainerId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully and coaching package activated.",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Internal server error during verification" }, { status: 500 });
  }
}
