import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Verify Webhook Signature
    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature received");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`Received Razorpay webhook event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const existing = await prisma.payment.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (existing && existing.status !== "PAID") {
          await prisma.payment.update({
            where: { id: existing.id },
            data: {
              status: "PAID",
              razorpayPaymentId: paymentId || existing.razorpayPaymentId,
              paidAt: new Date(),
            },
          });

          let finalCoachingRequestId = existing.coachingRequestId;
          if (existing.coachingRequestId) {
            await prisma.coachingRequest.update({
              where: { id: existing.coachingRequestId },
              data: { status: "ACCEPTED" },
            });
          } else {
            const existingReq = await prisma.coachingRequest.findFirst({
              where: {
                clientId: existing.clientId,
                trainerId: existing.trainerId,
              },
              orderBy: { createdAt: "desc" },
            });

            if (existingReq) {
              const updatedReq = await prisma.coachingRequest.update({
                where: { id: existingReq.id },
                data: {
                  status: "ACCEPTED",
                  packageId: existing.packageId || existingReq.packageId,
                },
              });
              finalCoachingRequestId = updatedReq.id;
            } else {
              const newReq = await prisma.coachingRequest.create({
                data: {
                  clientId: existing.clientId,
                  trainerId: existing.trainerId,
                  packageId: existing.packageId,
                  goal: "1-on-1 Personalized Coaching",
                  message: "Direct package purchase",
                  status: "ACCEPTED",
                  startDate: new Date(),
                },
              });
              finalCoachingRequestId = newReq.id;
            }

            if (finalCoachingRequestId) {
              await prisma.payment.update({
                where: { id: existing.id },
                data: { coachingRequestId: finalCoachingRequestId },
              });
            }
          }

          // Ensure conversation exists between client and trainer
          await prisma.conversation.upsert({
            where: {
              clientId_trainerId: {
                clientId: existing.clientId,
                trainerId: existing.trainerId,
              },
            },
            update: {},
            create: {
              clientId: existing.clientId,
              trainerId: existing.trainerId,
            },
          });
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId, status: "PENDING" },
          data: {
            status: "FAILED",
            failureReason: paymentEntity?.error_description || "Payment authorization failed",
          },
        });
      }
    }

    return NextResponse.json({ status: "ok", processed: true });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
