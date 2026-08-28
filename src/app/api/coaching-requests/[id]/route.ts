import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return NextResponse.json(
        { error: "Unauthorized. Trainer account required to manage coaching requests." },
        { status: 401 }
      );
    }

    const coachingReq = await prisma.coachingRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trainer: true,
        package: true,
      },
    });

    if (!coachingReq) {
      return NextResponse.json(
        { error: "Coaching request not found" },
        { status: 404 }
      );
    }

    // Server-side strict authorization guard: must be the assigned trainer
    if (coachingReq.trainerId !== user.trainerProfile.id) {
      return NextResponse.json(
        { error: "Forbidden. You are not the coach assigned to this request." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || (status !== "ACCEPTED" && status !== "REJECTED" && status !== "CANCELLED")) {
      return NextResponse.json(
        { error: "Valid status required ('ACCEPTED', 'REJECTED', 'CANCELLED')" },
        { status: 400 }
      );
    }

    // Idempotency: if status is already set to target status, return cleanly
    if (coachingReq.status === status) {
      return NextResponse.json({
        message: `Coaching request is already ${status.toLowerCase()}`,
        request: coachingReq,
      });
    }

    // Single active relationship enforcement: If accepting, verify client doesn't already have an active relationship
    if (status === "ACCEPTED") {
      const existingActive = await prisma.coachingRequest.findFirst({
        where: {
          clientId: coachingReq.clientId,
          trainerId: coachingReq.trainerId,
          status: "ACCEPTED",
          id: { not: id },
        },
      });

      if (existingActive) {
        return NextResponse.json(
          {
            error: "This client already has an active coaching relationship with you. Multiple simultaneous active coaching relationships with the same client are prohibited.",
          },
          { status: 409 }
        );
      }
    }

    const updatedRequest = await prisma.coachingRequest.update({
      where: { id },
      data: {
        status,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package: true,
      },
    });

    if (status === "ACCEPTED") {
      try {
        const conv = await prisma.conversation.upsert({
          where: {
            clientId_trainerId: {
              clientId: coachingReq.clientId,
              trainerId: coachingReq.trainerId,
            },
          },
          create: {
            clientId: coachingReq.clientId,
            trainerId: coachingReq.trainerId,
          },
          update: {},
        });

        // Add welcome message if conversation has no messages
        const msgCount = await prisma.message.count({
          where: { conversationId: conv.id },
        });

        if (msgCount === 0) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: user.id,
              content: `Welcome to 1-on-1 coaching! I've accepted your coaching request for ${coachingReq.goal}. Let's discuss your plan and get started.`,
              messageType: "TEXT",
            },
          });
        }
      } catch (convErr) {
        console.error("Error creating conversation for accepted request:", convErr);
      }
    }

    return NextResponse.json({
      message: `Coaching request ${status.toLowerCase()} successfully`,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error("Error updating coaching request:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update coaching request status" },
      { status: 500 }
    );
  }
}
