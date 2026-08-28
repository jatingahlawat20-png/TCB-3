export type VideoRoomTokenParams = {
  sessionId: string;
  roomId: string;
  userId: string;
  userName: string;
  role: "CLIENT" | "TRAINER" | "ADMIN";
  sessionTitle: string;
};

export type VideoRoomTokenResponse = {
  token: string;
  url: string;
  roomId: string;
  participantIdentity: string;
  participantName: string;
  isHost: boolean;
  isSandboxMode: boolean;
  expiresInSeconds: number;
};

export type JoinWindowEvaluation = {
  canJoin: boolean;
  status: "TOO_EARLY" | "OPEN" | "ENDED" | "CANCELLED";
  message: string;
  minutesUntilOpen: number;
  minutesUntilStart: number;
  opensAt: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
};
