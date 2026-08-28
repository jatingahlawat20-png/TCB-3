import { generateLiveKitParticipantToken } from "./livekit";
import { JoinWindowEvaluation, VideoRoomTokenParams, VideoRoomTokenResponse } from "./types";

export * from "./types";
export * from "./livekit";

export const DEFAULT_JOIN_WINDOW_MINUTES = parseInt(
  process.env.SESSION_JOIN_WINDOW_MINUTES || "15",
  10
);

/**
 * Creates a unique deterministic room ID for a coaching session
 */
export function createVideoRoomId(sessionId: string): string {
  return `tcb3_session_${sessionId}`;
}

/**
 * Evaluates whether a user can currently enter a coaching session based on
 * the configured join window and session status.
 */
export function evaluateJoinWindow(
  scheduledStart: Date | string,
  scheduledEnd: Date | string,
  status: string,
  joinWindowMinutes: number = DEFAULT_JOIN_WINDOW_MINUTES
): JoinWindowEvaluation {
  const now = new Date();
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  const opensAt = new Date(start.getTime() - joinWindowMinutes * 60 * 1000);
  const bufferEnd = new Date(end.getTime() + 30 * 60 * 1000); // 30m grace period after end

  const minutesUntilStart = Math.ceil((start.getTime() - now.getTime()) / (60 * 1000));
  const minutesUntilOpen = Math.ceil((opensAt.getTime() - now.getTime()) / (60 * 1000));

  if (status === "CANCELLED") {
    return {
      canJoin: false,
      status: "CANCELLED",
      message: "This session has been cancelled.",
      minutesUntilOpen: 0,
      minutesUntilStart: 0,
      opensAt,
      scheduledStart: start,
      scheduledEnd: end,
    };
  }

  if (status === "COMPLETED") {
    return {
      canJoin: false,
      status: "ENDED",
      message: "This coaching session has already concluded.",
      minutesUntilOpen: 0,
      minutesUntilStart: 0,
      opensAt,
      scheduledStart: start,
      scheduledEnd: end,
    };
  }

  if (now < opensAt && status !== "LIVE") {
    return {
      canJoin: false,
      status: "TOO_EARLY",
      message: `Join window opens ${joinWindowMinutes} minutes before start time (at ${opensAt.toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )}).`,
      minutesUntilOpen: Math.max(1, minutesUntilOpen),
      minutesUntilStart: Math.max(1, minutesUntilStart),
      opensAt,
      scheduledStart: start,
      scheduledEnd: end,
    };
  }

  if (now > bufferEnd && status !== "LIVE") {
    return {
      canJoin: false,
      status: "ENDED",
      message: "The scheduled session time window has expired.",
      minutesUntilOpen: 0,
      minutesUntilStart: 0,
      opensAt,
      scheduledStart: start,
      scheduledEnd: end,
    };
  }

  return {
    canJoin: true,
    status: "OPEN",
    message: status === "LIVE" ? "Session is currently LIVE" : "Join window is open",
    minutesUntilOpen: 0,
    minutesUntilStart: Math.max(0, minutesUntilStart),
    opensAt,
    scheduledStart: start,
    scheduledEnd: end,
  };
}

/**
 * Universal video manager to produce authorized participant tokens
 */
export async function generateSessionVideoToken(
  params: VideoRoomTokenParams
): Promise<VideoRoomTokenResponse> {
  return generateLiveKitParticipantToken(params);
}
