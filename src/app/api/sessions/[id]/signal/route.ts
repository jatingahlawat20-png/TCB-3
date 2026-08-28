import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ParticipantPresence {
  userId: string;
  userName: string;
  role: "CLIENT" | "TRAINER" | "ADMIN";
  joinedAt: number;
  lastSeen: number;
  isCameraOff?: boolean;
  isMicMuted?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
}

export interface SignalMessage {
  id: string;
  seq: number;
  senderId: string;
  senderName: string;
  type: "offer" | "answer" | "candidate" | "state" | "speaking" | "chat" | "leave" | "join";
  payload: any;
  timestamp: number;
}

interface RoomState {
  messages: SignalMessage[];
  participants: Map<string, ParticipantPresence>;
  seqCounter: number;
}

// In-memory signaling store keyed by sessionId
const roomStateStore = new Map<string, RoomState>();

function getOrCreateRoom(sessionId: string): RoomState {
  let room = roomStateStore.get(sessionId);
  if (!room) {
    room = {
      messages: [],
      participants: new Map(),
      seqCounter: 0,
    };
    roomStateStore.set(sessionId, room);
  }
  return room;
}

// Cleanup stale sessions (inactive for > 15 mins) and old messages (> 5 mins)
function cleanupStaleData(sessionId: string) {
  const room = roomStateStore.get(sessionId);
  if (!room) return;

  const now = Date.now();
  const msgCutoff = now - 5 * 60 * 1000;
  room.messages = room.messages.filter((m) => m.timestamp > msgCutoff);

  // Remove participants inactive for > 60 seconds
  for (const [userId, p] of room.participants.entries()) {
    if (now - p.lastSeen > 60 * 1000) {
      room.participants.delete(userId);
    }
  }

  if (room.messages.length === 0 && room.participants.size === 0) {
    roomStateStore.delete(sessionId);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Verify session access
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
      include: {
        trainer: { select: { userId: true } },
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

    cleanupStaleData(sessionId);
    const room = getOrCreateRoom(sessionId);
    const body = await req.json();
    const { action, message, lastSeq = 0, lastTimestamp = 0, state } = body;
    const now = Date.now();

    // Update participant presence
    const userRole = isTrainer ? "TRAINER" : user.role === "ADMIN" ? "ADMIN" : "CLIENT";
    const existingPresence = room.participants.get(user.id);
    const currentPresence: ParticipantPresence = {
      userId: user.id,
      userName: user.name,
      role: userRole,
      joinedAt: existingPresence ? existingPresence.joinedAt : now,
      lastSeen: now,
      isCameraOff: state?.isCameraOff ?? existingPresence?.isCameraOff ?? false,
      isMicMuted: state?.isMicMuted ?? existingPresence?.isMicMuted ?? false,
      isSpeaking: state?.isSpeaking ?? existingPresence?.isSpeaking ?? false,
      isScreenSharing: state?.isScreenSharing ?? existingPresence?.isScreenSharing ?? false,
    };
    room.participants.set(user.id, currentPresence);

    if (action === "join") {
      room.seqCounter++;
      const joinMsg: SignalMessage = {
        id: `sig_join_${now}_${Math.random().toString(36).substring(2, 7)}`,
        seq: room.seqCounter,
        senderId: user.id,
        senderName: user.name,
        type: "join",
        payload: {
          role: userRole,
          presence: currentPresence,
        },
        timestamp: now,
      };
      room.messages.push(joinMsg);

      // Return active participants already in room
      const existingOthers = Array.from(room.participants.values()).filter(
        (p) => p.userId !== user.id && now - p.lastSeen < 30 * 1000
      );

      return NextResponse.json({
        success: true,
        joined: true,
        seq: room.seqCounter,
        participants: existingOthers,
        serverTime: now,
      });
    }

    if (action === "send" && message) {
      room.seqCounter++;
      const newMsg: SignalMessage = {
        id: `sig_${now}_${Math.random().toString(36).substring(2, 7)}`,
        seq: room.seqCounter,
        senderId: user.id,
        senderName: user.name,
        type: message.type,
        payload: message.payload,
        timestamp: now,
      };

      // Update state presence if this message changes media states
      if (message.type === "state" && message.payload) {
        if (message.payload.isCameraOff !== undefined) {
          currentPresence.isCameraOff = message.payload.isCameraOff;
        }
        if (message.payload.isMicMuted !== undefined) {
          currentPresence.isMicMuted = message.payload.isMicMuted;
        }
        if (message.payload.isScreenSharing !== undefined) {
          currentPresence.isScreenSharing = message.payload.isScreenSharing;
        }
        room.participants.set(user.id, currentPresence);
      } else if (message.type === "speaking" && message.payload) {
        currentPresence.isSpeaking = Boolean(message.payload.isSpeaking);
        room.participants.set(user.id, currentPresence);
      }

      room.messages.push(newMsg);
      if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200);
      }

      return NextResponse.json({
        success: true,
        messageId: newMsg.id,
        seq: newMsg.seq,
        timestamp: newMsg.timestamp,
      });
    }

    if (action === "poll") {
      // Return messages sent by OTHER participants with seq > lastSeq or timestamp > lastTimestamp
      let unread: SignalMessage[];
      if (lastSeq > 0) {
        unread = room.messages.filter(
          (m) => m.seq > lastSeq && m.senderId !== user.id
        );
      } else if (lastTimestamp > 0) {
        unread = room.messages.filter(
          (m) => m.timestamp > lastTimestamp && m.senderId !== user.id
        );
      } else {
        // Initial poll returns last 30 messages
        unread = room.messages.filter((m) => m.senderId !== user.id).slice(-30);
      }

      const activeParticipants = Array.from(room.participants.values()).filter(
        (p) => p.userId !== user.id && now - p.lastSeen < 30 * 1000
      );

      return NextResponse.json({
        success: true,
        messages: unread,
        maxSeq: room.seqCounter,
        participants: activeParticipants,
        serverTime: now,
      });
    }

    if (action === "leave") {
      room.participants.delete(user.id);
      room.seqCounter++;
      const leaveMsg: SignalMessage = {
        id: `leave_${now}`,
        seq: room.seqCounter,
        senderId: user.id,
        senderName: user.name,
        type: "leave",
        payload: { userId: user.id },
        timestamp: now,
      };
      room.messages.push(leaveMsg);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Signaling error:", error);
    return NextResponse.json({ error: "Signaling failed" }, { status: 500 });
  }
}
