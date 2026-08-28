import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVideoRoomId, evaluateJoinWindow } from "@/lib/video";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sessions: any[] = [];

    if (user.role === "CLIENT") {
      sessions = await prisma.coachingSession.findMany({
        where: { clientId: user.id },
        include: {
          trainer: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { scheduledStart: "asc" },
      });
    } else if (user.role === "TRAINER") {
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!trainerProfile) {
        return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 });
      }

      sessions = await prisma.coachingSession.findMany({
        where: { trainerId: trainerProfile.id },
        include: {
          client: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledStart: "asc" },
      });
    } else if (user.role === "ADMIN") {
      sessions = await prisma.coachingSession.findMany({
        include: {
          client: { select: { id: true, name: true, email: true } },
          trainer: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { scheduledStart: "asc" },
      });
    }

    const formatted = sessions.map((s) => {
      const joinEval = evaluateJoinWindow(s.scheduledStart, s.scheduledEnd, s.status);
      return {
        ...s,
        joinWindow: joinEval,
      };
    });

    return NextResponse.json({
      success: true,
      sessions: formatted,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { clientId, trainerId, title, description, scheduledStart, duration = 60, coachingRequestId } = body;

    if (!title || !scheduledStart) {
      return NextResponse.json(
        { error: "Missing required fields: title, scheduledStart" },
        { status: 400 }
      );
    }

    const start = new Date(scheduledStart);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledStart date" }, { status: 400 });
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 15 || parsedDuration > 180) {
      return NextResponse.json(
        { error: "Duration must be between 15 and 180 minutes." },
        { status: 400 }
      );
    }

    // 1. Validate start time is not in the deep past (allow 10m grace for immediate test calls)
    const now = new Date();
    if (start.getTime() < now.getTime() - 10 * 60 * 1000) {
      return NextResponse.json(
        { error: "Cannot schedule a session in the past." },
        { status: 400 }
      );
    }

    const end = new Date(start.getTime() + parsedDuration * 60 * 1000);

    let finalClientId = clientId;
    let finalTrainerId = trainerId;

    if (user.role === "CLIENT") {
      finalClientId = user.id;

      // If client didn't specify trainerId, look for their active accepted coaching relationship
      if (!finalTrainerId) {
        const clientRel = await prisma.coachingRequest.findFirst({
          where: {
            clientId: user.id,
            status: "ACCEPTED",
          },
          orderBy: { createdAt: "desc" },
        });
        if (clientRel) {
          finalTrainerId = clientRel.trainerId;
          if (!coachingRequestId) coachingRequestId = clientRel.id;
        }
      }

      if (!finalTrainerId) {
        return NextResponse.json(
          { error: "Please specify a trainer for this session or enroll with a coach first." },
          { status: 400 }
        );
      }

      // Verify active coaching relationship
      const activeRelationship = await prisma.coachingRequest.findFirst({
        where: {
          trainerId: finalTrainerId,
          clientId: user.id,
          status: "ACCEPTED",
        },
      });

      if (!activeRelationship) {
        return NextResponse.json(
          { error: "You do not have an active coaching relationship with this coach." },
          { status: 403 }
        );
      }
    } else if (user.role === "TRAINER") {
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!trainerProfile) {
        return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 });
      }

      finalTrainerId = trainerProfile.id;

      if (!finalClientId) {
        return NextResponse.json(
          { error: "Missing required field: clientId" },
          { status: 400 }
        );
      }

      // Verify active relationship
      const activeRelationship = await prisma.coachingRequest.findFirst({
        where: {
          trainerId: trainerProfile.id,
          clientId: finalClientId,
          status: "ACCEPTED",
        },
      });

      if (!activeRelationship) {
        return NextResponse.json(
          { error: "Client does not have an active coaching relationship with you." },
          { status: 403 }
        );
      }
    } else if (user.role === "ADMIN") {
      if (!finalClientId || !finalTrainerId) {
        return NextResponse.json(
          { error: "Admin must provide both clientId and trainerId." },
          { status: 400 }
        );
      }
    }

    // 2. CONFLICT CHECK: Ensure trainer has no overlapping sessions
    const overlappingSession = await prisma.coachingSession.findFirst({
      where: {
        trainerId: finalTrainerId,
        status: { in: ["SCHEDULED", "LIVE"] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
    });

    if (overlappingSession) {
      const isSelfTrainer = user.role === "TRAINER";
      return NextResponse.json(
        {
          error: isSelfTrainer
            ? `Schedule Conflict: You already have a session "${overlappingSession.title}" scheduled from ${new Date(
                overlappingSession.scheduledStart
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${new Date(
                overlappingSession.scheduledEnd
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
            : `Schedule Conflict: The coach already has a session scheduled from ${new Date(
                overlappingSession.scheduledStart
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${new Date(
                overlappingSession.scheduledEnd
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Please select a different time.`,
        },
        { status: 409 }
      );
    }

    // 3. Create Session in Database
    const newSession = await prisma.coachingSession.create({
      data: {
        clientId: finalClientId,
        trainerId: finalTrainerId,
        coachingRequestId: coachingRequestId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
        scheduledStart: start,
        scheduledEnd: end,
        duration: parsedDuration,
        status: "SCHEDULED",
        videoProvider: "livekit",
        videoRoomId: `tcb3_room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // 4. Automatically post announcement in client ↔ trainer conversation
    try {
      const conv = await prisma.conversation.findUnique({
        where: {
          clientId_trainerId: {
            clientId: finalClientId,
            trainerId: finalTrainerId,
          },
        },
      });

      if (conv) {
        const timeFormatted = start.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: user.id,
            content: `📅 New Coaching Session Scheduled: "${newSession.title}" on ${timeFormatted} (${parsedDuration} mins).`,
          },
        });
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { updatedAt: new Date() },
        });
      }
    } catch (msgErr) {
      console.warn("Could not post session message to chat:", msgErr);
    }

    const joinEval = evaluateJoinWindow(newSession.scheduledStart, newSession.scheduledEnd, newSession.status);

    return NextResponse.json({
      success: true,
      message: "Coaching session scheduled successfully.",
      session: {
        ...newSession,
        joinWindow: joinEval,
      },
    });
  } catch (error) {
    console.error("Error creating coaching session:", error);
    return NextResponse.json({ error: "Failed to schedule coaching session" }, { status: 500 });
  }
}
