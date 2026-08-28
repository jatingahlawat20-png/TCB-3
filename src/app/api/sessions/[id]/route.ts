import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateJoinWindow } from "@/lib/video";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Coaching session not found" }, { status: 404 });
    }

    // Authorization: User must be the client or the trainer (or admin)
    const isClient = session.clientId === user.id;
    const isTrainer = session.trainer.userId === user.id;

    if (!isClient && !isTrainer && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this session." },
        { status: 403 }
      );
    }

    const joinEval = evaluateJoinWindow(
      session.scheduledStart,
      session.scheduledEnd,
      session.status
    );

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        isHost: isTrainer || user.role === "ADMIN",
        joinWindow: joinEval,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

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
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isClient = session.clientId === user.id;
    const isTrainer = session.trainer.userId === user.id;

    if (!isClient && !isTrainer && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Role-specific constraints
    if (status === "COMPLETED" && !isTrainer && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the trainer can complete and end the session for everyone." },
        { status: 403 }
      );
    }

    const updateData: any = { status };
    if (status === "LIVE" && !session.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === "COMPLETED") {
      updateData.endedAt = new Date();
    }

    const updatedSession = await prisma.coachingSession.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Notify in chat on completion
    if (status === "COMPLETED") {
      try {
        const conv = await prisma.conversation.findUnique({
          where: {
            clientId_trainerId: {
              clientId: session.clientId,
              trainerId: session.trainerId,
            },
          },
        });
        if (conv) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: user.id,
              content: `✅ Coaching session "${session.title}" completed. Great work today!`,
            },
          });
        }
      } catch (err) {
        console.warn("Could not log completion message in chat:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Session status updated to ${status}`,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
