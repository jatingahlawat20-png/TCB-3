import { AccessToken } from "livekit-server-sdk";
import { VideoRoomTokenParams, VideoRoomTokenResponse } from "./types";

export function getLiveKitConfig() {
  return {
    url: process.env.LIVEKIT_URL || "wss://tcb3-demo.livekit.cloud",
    apiKey: process.env.LIVEKIT_API_KEY || "devkey",
    apiSecret: process.env.LIVEKIT_API_SECRET || "secret_tcb3_livekit_sandbox_key_112233",
  };
}

/**
 * Generate a cryptographically signed participant token for a LiveKit room.
 * Keeps all API keys and secrets strictly on the server.
 */
export async function generateLiveKitParticipantToken(
  params: VideoRoomTokenParams
): Promise<VideoRoomTokenResponse> {
  const config = getLiveKitConfig();
  const isHost = params.role === "TRAINER" || params.role === "ADMIN";

  const isSandbox =
    !process.env.LIVEKIT_URL ||
    process.env.LIVEKIT_URL.includes("tcb3-demo") ||
    !process.env.LIVEKIT_API_KEY ||
    process.env.LIVEKIT_API_KEY === "devkey";

  const at = new AccessToken(config.apiKey, config.apiSecret, {
    identity: params.userId,
    name: params.userName,
    ttl: "4h",
  });

  at.addGrant({
    room: params.roomId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
    roomRecord: false,
  });

  const token = await at.toJwt();

  return {
    token,
    url: config.url,
    roomId: params.roomId,
    participantIdentity: params.userId,
    participantName: params.userName,
    isHost,
    isSandboxMode: isSandbox,
    expiresInSeconds: 14400, // 4 hours
  };
}
