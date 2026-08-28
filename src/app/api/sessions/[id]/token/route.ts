import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateJoinWindow, generateSessionVideoToken } from "@/lib/video";

export async function POST(
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

    // 1. Strict Server-Side Authorization: Must belong to session
    const isClient = session.clientId === user.id;
    const isTrainer = session.trainer.userId === user.id;

    if (!isClient && !isTrainer && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to join this coaching session." },
        { status: 403 }
      );
    }

    // 2. Strict Join Window Evaluation
    const joinEval = evaluateJoinWindow(
      session.scheduledStart,
      session.scheduledEnd,
      session.status
    );

    if (!joinEval.canJoin) {
      return NextResponse.json(
        {
          error: joinEval.message,
          canJoin: false,
          joinWindow: joinEval,
        },
        { status: 403 }
      );
    }

    // 3. If session is SCHEDULED, mark as LIVE and record startedAt
    if (session.status === "SCHEDULED") {
      await prisma.coachingSession.update({
        where: { id: session.id },
        data: {
          status: "LIVE",
          startedAt: session.startedAt || new Date(),
        },
      });
    }

    // 4. Generate participant token with LiveKit SDK
    const tokenResponse = await generateSessionVideoToken({
      sessionId: session.id,
      roomId: session.videoRoomId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      sessionTitle: session.title,
    });

    return NextResponse.json({
      success: true,
      ...tokenResponse,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        duration: session.duration,
        status: "LIVE",
        trainerName: session.trainer.user.name,
        clientName: session.client.name,
        isHost: isTrainer || user.role === "ADMIN",
      },
    });
  } catch (error) {
    console.error("Error generating video session token:", error);
    return NextResponse.json(
      { error: "Failed to generate video session access token" },
      { status: 500 }
    );
  }
}
