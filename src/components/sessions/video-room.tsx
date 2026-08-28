"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication } from "livekit-client";

interface VideoRoomProps {
  sessionId: string;
}

export function VideoRoom({ sessionId }: VideoRoomProps) {
  const router = useRouter();

  // Session & Auth state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  // Media Streams & Remote Participant State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [remoteParticipantName, setRemoteParticipantName] = useState<string | null>(null);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
  const [isRemoteMicMuted, setIsRemoteMicMuted] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);

  // Local Controls State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Workout Timer state (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // In-call Chat drawer
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // End session dialog
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // DOM & Media Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // WebRTC Signaling & Peer Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const lastSeqRef = useRef<number>(0);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const makingOfferRef = useRef<boolean>(false);
  const isPolitePeerRef = useRef<boolean>(true); // Deterministic polite peer

  // Media state ref accessible by polling loop without triggering effect re-runs
  const localMediaStateRef = useRef({
    isCameraOff: false,
    isMicMuted: false,
    isSpeaking: false,
    isScreenSharing: false,
  });

  // Keep localMediaStateRef in sync with state
  useEffect(() => {
    localMediaStateRef.current = {
      isCameraOff,
      isMicMuted,
      isSpeaking: isLocalSpeaking,
      isScreenSharing,
    };
  }, [isCameraOff, isMicMuted, isLocalSpeaking, isScreenSharing]);

  // Signal sender helper
  const sendSignal = useCallback(
    async (type: string, payload: any) => {
      try {
        await fetch(`/api/sessions/${sessionId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            message: { type, payload },
          }),
        });
      } catch (err) {
        console.warn("Signal send error:", err);
      }
    },
    [sessionId]
  );

  // Reliable callback ref for Local Video Element
  const setLocalVideoElement = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
      node.play().catch((e) => console.warn("Local video play warning:", e));
    }
  }, []);

  // Reliable callback ref for Remote Video Element
  const setRemoteVideoElement = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
      node.play().catch((e) => console.warn("Remote video play warning:", e));
    }
  }, []);

  // Reliable callback ref for Remote Audio Element
  const setRemoteAudioElement = useCallback((node: HTMLAudioElement | null) => {
    remoteAudioRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
      node.play().catch((e) => console.warn("Remote audio play warning:", e));
    }
  }, []);

  // 1. Fetch Session Token & Setup Local Media Streams (Runs ONCE per sessionId)
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/sessions/${sessionId}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to enter video coaching session");
        }

        if (!isMounted) return;

        setTokenData(data);
        setSessionData(data.session);

        // Host is impolite peer (priority offerer); Client is polite peer (resolves collision)
        isPolitePeerRef.current = !data.isHost;

        // Initialize local camera and microphone stream
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          setLocalStream(stream);

          // Setup Audio Visualizer Meter for voice speech detection
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              analyser.smoothingTimeConstant = 0.3;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              let speakingDecayTimer: any = null;
              let consecutiveVoiceFrames = 0;
              let lastSpeakingState = false;

              const checkAudio = () => {
                if (!analyserRef.current || !isMounted) return;

                // If local mic is muted, never report speaking
                if (localMediaStateRef.current.isMicMuted) {
                  if (lastSpeakingState) {
                    lastSpeakingState = false;
                    setIsLocalSpeaking(false);
                    sendSignal("speaking", { isSpeaking: false });
                  }
                  requestAnimationFrame(checkAudio);
                  return;
                }

                analyserRef.current.getByteFrequencyData(dataArray);

                // Analyze voice band frequencies (bins 2 through 24 for human speech)
                let voiceEnergy = 0;
                let count = 0;
                for (let i = 2; i <= 24 && i < dataArray.length; i++) {
                  voiceEnergy += dataArray[i];
                  count++;
                }
                const avgVoice = count > 0 ? voiceEnergy / count : 0;

                // Threshold set to 35 to reject microphone noise floor
                const isVoiceActiveNow = avgVoice > 35;

                if (isVoiceActiveNow) {
                  consecutiveVoiceFrames++;
                  if (consecutiveVoiceFrames >= 2) {
                    if (!lastSpeakingState) {
                      lastSpeakingState = true;
                      setIsLocalSpeaking(true);
                      sendSignal("speaking", { isSpeaking: true });
                    }
                    if (speakingDecayTimer) clearTimeout(speakingDecayTimer);
                    speakingDecayTimer = setTimeout(() => {
                      if (isMounted) {
                        lastSpeakingState = false;
                        setIsLocalSpeaking(false);
                        sendSignal("speaking", { isSpeaking: false });
                      }
                    }, 400);
                  }
                } else {
                  consecutiveVoiceFrames = Math.max(0, consecutiveVoiceFrames - 1);
                }

                requestAnimationFrame(checkAudio);
              };
              checkAudio();
            }
          } catch (audioErr) {
            console.warn("Local audio meter setup warning:", audioErr);
          }
        } catch (mediaErr: any) {
          console.warn("Camera/mic permission warning:", mediaErr.message);
        }

        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Could not connect to session");
        setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [sessionId, sendSignal]);

  // 2. Continuous Local Video Element Stream Attachment
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isCameraOff, loading]);

  // 3. Continuous Remote Video & Audio Element Stream Attachment
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, hasRemoteParticipant, isRemoteCameraOff]);

  // 4. WebRTC Peer Connection & Real-Time Signaling Engine (Runs ONCE per session lifecycle)
  useEffect(() => {
    if (loading || !tokenData || !localStream) return;

    let isSubscribed = true;

    // Helper: Drain queued ICE candidates once remote description is set
    const drainPendingCandidates = async (pc: RTCPeerConnection) => {
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("Error applying queued ICE candidate:", e);
          }
        }
      }
    };

    // Branch A: Production LiveKit Cloud Mode
    if (!tokenData.isSandboxMode && tokenData.url && tokenData.token) {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      livekitRoomRef.current = room;

      const handleTrackSubscribed = (
        track: any,
        pub: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        setHasRemoteParticipant(true);
        setRemoteParticipantName(participant.name || participant.identity);

        if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
          track.attach(remoteVideoRef.current);
        } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
          track.attach(remoteAudioRef.current);
        }
      };

      const handleTrackUnsubscribed = (track: any) => {
        track.detach();
      };

      const handleActiveSpeakers = (speakers: any[]) => {
        const remoteIsSpeaking = speakers.some(
          (s) => s.identity !== tokenData.participantIdentity
        );
        setIsRemoteSpeaking(remoteIsSpeaking);
      };

      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setHasRemoteParticipant(true);
        setRemoteParticipantName(participant.name || participant.identity);
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        setHasRemoteParticipant(false);
      });

      room
        .connect(tokenData.url, tokenData.token)
        .then(async () => {
          if (!isSubscribed) return;

          // Scan pre-existing participants & published tracks
          room.remoteParticipants.forEach((participant) => {
            setHasRemoteParticipant(true);
            setRemoteParticipantName(participant.name || participant.identity);
            participant.trackPublications.forEach((pub) => {
              if (pub.isSubscribed && pub.track) {
                if (pub.track.kind === Track.Kind.Video && remoteVideoRef.current) {
                  pub.track.attach(remoteVideoRef.current);
                } else if (pub.track.kind === Track.Kind.Audio && remoteAudioRef.current) {
                  pub.track.attach(remoteAudioRef.current);
                }
              }
            });
          });

          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
        })
        .catch((err) => {
          console.warn("LiveKit connection fallback to WebRTC:", err);
        });

      return () => {
        isSubscribed = false;
        room.disconnect();
      };
    }

    // Branch B: WebRTC Perfect Negotiation Signaling Engine
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });
    peerConnectionRef.current = pc;

    // Attach all local tracks to RTCPeerConnection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Symmetrical Track Arrival Handler (both Audio and Video)
    pc.ontrack = (event) => {
      let stream = remoteStreamRef.current;
      if (!stream) {
        stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
        remoteStreamRef.current = stream;
      }
      if (!stream.getTracks().includes(event.track)) {
        stream.addTrack(event.track);
      }
      setRemoteStream(stream);
      setHasRemoteParticipant(true);

      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      remoteVideoRef.current?.play().catch(() => {});

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current?.play().catch(() => {});
    };

    // ICE Candidate Generation
    pc.onicecandidate = (event) => {
      if (event.candidate && isSubscribed) {
        sendSignal("candidate", event.candidate);
      }
    };

    // Perfect Negotiation: onnegotiationneeded
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignal("offer", offer);
      } catch (err) {
        console.warn("Negotiation needed error:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    const initiateOffer = async () => {
      if (pc.signalingState === "closed") return;
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignal("offer", offer);
      } catch (err) {
        console.warn("initiateOffer error:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // Announce presence & discover already-joined participants
    fetch(`/api/sessions/${sessionId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        state: localMediaStateRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isSubscribed) return;
        if (data.seq) lastSeqRef.current = data.seq;

        if (data.success && data.participants && data.participants.length > 0) {
          // A peer is ALREADY PRESENT in the room
          setHasRemoteParticipant(true);
          const peer = data.participants[0];
          setRemoteParticipantName(peer.userName || peer.userId);
          setIsRemoteCameraOff(Boolean(peer.isCameraOff));
          setIsRemoteMicMuted(Boolean(peer.isMicMuted));
          setIsRemoteSpeaking(Boolean(peer.isSpeaking));
          setIsRemoteScreenSharing(Boolean(peer.isScreenSharing));

          // Trigger offer if stable
          if (pc.signalingState === "stable") {
            initiateOffer();
          }
        }
      })
      .catch((err) => console.warn("Join signal error:", err));

    // High-frequency signaling loop (500ms) with sequence filtering
    const poller = setInterval(async () => {
      if (!isSubscribed || pc.signalingState === "closed") return;

      try {
        const res = await fetch(`/api/sessions/${sessionId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "poll",
            lastSeq: lastSeqRef.current,
            state: localMediaStateRef.current,
          }),
        });

        const data = await res.json();
        if (!data.success) return;

        if (data.maxSeq && data.maxSeq > lastSeqRef.current) {
          lastSeqRef.current = data.maxSeq;
        }

        // Synchronize active participants list
        if (data.participants && data.participants.length > 0) {
          setHasRemoteParticipant(true);
          const activePeer = data.participants[0];
          setRemoteParticipantName(activePeer.userName || activePeer.userId);
          if (activePeer.isCameraOff !== undefined) setIsRemoteCameraOff(activePeer.isCameraOff);
          if (activePeer.isMicMuted !== undefined) setIsRemoteMicMuted(activePeer.isMicMuted);
          if (activePeer.isSpeaking !== undefined) setIsRemoteSpeaking(activePeer.isSpeaking);
          if (activePeer.isScreenSharing !== undefined) setIsRemoteScreenSharing(activePeer.isScreenSharing);
        }

        // Process message queue with duplicate suppression
        if (data.messages && data.messages.length > 0) {
          // Sort messages so SDP offer/answers are processed before ICE candidates in the same batch
          const sorted = [...data.messages].sort((a, b) => {
            const order: Record<string, number> = { join: 0, offer: 1, answer: 2, candidate: 3, state: 4, speaking: 5, chat: 6, leave: 7 };
            return (order[a.type] ?? 99) - (order[b.type] ?? 99);
          });

          for (const msg of sorted) {
            if (processedMessageIdsRef.current.has(msg.id)) continue;
            processedMessageIdsRef.current.add(msg.id);

            if (msg.seq && msg.seq > lastSeqRef.current) {
              lastSeqRef.current = msg.seq;
            }

            if (msg.type === "join") {
              setHasRemoteParticipant(true);
              if (msg.senderName) setRemoteParticipantName(msg.senderName);
              if (pc.signalingState === "stable") {
                await initiateOffer();
              }
            } else if (msg.type === "offer") {
              const offer = msg.payload;
              const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";

              const ignoreOffer = !isPolitePeerRef.current && offerCollision;
              if (ignoreOffer) {
                console.warn("Collision detected: impolite peer ignoring offer");
                continue;
              }

              setHasRemoteParticipant(true);
              if (msg.senderName) setRemoteParticipantName(msg.senderName);

              if (offerCollision) {
                await Promise.all([
                  pc.setLocalDescription({ type: "rollback" }),
                  pc.setRemoteDescription(new RTCSessionDescription(offer)),
                ]);
              } else {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
              }

              await drainPendingCandidates(pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal("answer", answer);
            } else if (msg.type === "answer") {
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
                await drainPendingCandidates(pc);
              }
            } else if (msg.type === "candidate") {
              const candidate = msg.payload;
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (iceErr) {
                  console.warn("ICE candidate error:", iceErr);
                }
              } else {
                pendingCandidatesRef.current.push(candidate);
              }
            } else if (msg.type === "state") {
              if (msg.payload.isCameraOff !== undefined) setIsRemoteCameraOff(msg.payload.isCameraOff);
              if (msg.payload.isMicMuted !== undefined) setIsRemoteMicMuted(msg.payload.isMicMuted);
              if (msg.payload.isScreenSharing !== undefined) setIsRemoteScreenSharing(msg.payload.isScreenSharing);
            } else if (msg.type === "speaking") {
              setIsRemoteSpeaking(Boolean(msg.payload?.isSpeaking));
            } else if (msg.type === "chat") {
              setMessages((prev) => [...prev, msg.payload]);
            } else if (msg.type === "leave") {
              setHasRemoteParticipant(false);
              setRemoteStream(null);
            }
          }
        }
      } catch (pollErr) {
        console.warn("Signaling poll warning:", pollErr);
      }
    }, 500);

    return () => {
      isSubscribed = false;
      clearInterval(poller);
      pc.close();
    };
  }, [loading, tokenData, sessionId, sendSignal, localStream]);

  // 5. Workout Timer
  useEffect(() => {
    if (loading || error) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, error]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // 6. Independent Media Controls

  // Microphone Toggle (Audio Track Mute/Unmute)
  const toggleMic = () => {
    if (localStreamRef.current) {
      const nextMuted = !isMicMuted;
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
      setIsMicMuted(nextMuted);

      if (livekitRoomRef.current?.localParticipant) {
        livekitRoomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
      }

      sendSignal("state", { isMicMuted: nextMuted });
    }
  };

  // Camera Toggle (Video Track Enable/Disable)
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const nextCameraOff = !isCameraOff;
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !nextCameraOff));
      setIsCameraOff(nextCameraOff);

      if (livekitRoomRef.current?.localParticipant) {
        livekitRoomRef.current.localParticipant.setCameraEnabled(!nextCameraOff);
      }

      sendSignal("state", { isCameraOff: nextCameraOff });
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (livekitRoomRef.current?.localParticipant) {
          livekitRoomRef.current.localParticipant.setScreenShareEnabled(true);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(true);
        sendSignal("state", { isScreenSharing: true });

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          sendSignal("state", { isScreenSharing: false });

          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (peerConnectionRef.current) {
              const senders = peerConnectionRef.current.getSenders();
              const videoSender = senders.find((s) => s.track && s.track.kind === "video");
              if (videoSender && camTrack) {
                videoSender.replaceTrack(camTrack);
              }
            }
            if (livekitRoomRef.current?.localParticipant) {
              livekitRoomRef.current.localParticipant.setScreenShareEnabled(false);
            }
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        };
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (localStreamRef.current) {
          const camTrack = localStreamRef.current.getVideoTracks()[0];
          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find((s) => s.track && s.track.kind === "video");
            if (videoSender && camTrack) {
              videoSender.replaceTrack(camTrack);
            }
          }
          if (livekitRoomRef.current?.localParticipant) {
            livekitRoomRef.current.localParticipant.setScreenShareEnabled(false);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
        setIsScreenSharing(false);
        sendSignal("state", { isScreenSharing: false });
      }
    } catch (err) {
      console.warn("Screen share error:", err);
    }
  };

  // 7. End Session / Leave Room
  const handleEndSession = async (completeSession: boolean) => {
    setEndingSession(true);
    try {
      if (completeSession && sessionData?.isHost) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        });
      }

      await fetch(`/api/sessions/${sessionId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
      }

      router.push(sessionData?.isHost ? "/trainer/dashboard" : "/dashboard");
    } catch (err) {
      console.error("Error ending session:", err);
      router.push("/dashboard");
    } finally {
      setEndingSession(false);
    }
  };

  // 8. In-Call Chat Message Send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageObj = {
      id: Date.now(),
      sender: tokenData?.participantName || "Me",
      content: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, messageObj]);
    sendSignal("chat", messageObj);
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B0F] flex flex-col items-center justify-center text-white p-6">
        <div className="h-12 w-12 rounded-full border-4 border-[#7CFF3B] border-t-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to TCB-3 Coaching Video Room...</h2>
        <p className="text-xs text-gray-400 mt-2">Setting up camera, microphone, and WebRTC encrypted stream</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080B0F] flex flex-col items-center justify-center text-white p-6">
        <div className="w-full max-w-md rounded-[32px] border border-rose-500/30 bg-[#111622] p-8 text-center shadow-2xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join Session</h2>
          <p className="text-xs text-gray-300 mb-6 leading-relaxed">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] hover:bg-[#68e02d]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const otherParticipantDisplay =
    remoteParticipantName || (sessionData?.isHost ? sessionData?.clientName : sessionData?.trainerName);
  const isRemoteVideoActive = Boolean(hasRemoteParticipant && remoteStream && !isRemoteCameraOff);

  return (
    <div className="min-h-screen bg-[#080B0F] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Invisible Audio Element for Clear Remote Audio Playback */}
      <audio ref={setRemoteAudioElement} autoPlay playsInline className="hidden" />

      {/* Top Bar / Header */}
      <header className="border-b border-white/10 bg-[#0C1017]/95 px-6 py-3.5 backdrop-blur-md z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-black text-lg text-white">
            <span className="text-[#7CFF3B]">TCB-3</span>
            <span className="text-xs rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-2.5 py-0.5 text-[#7CFF3B] font-bold uppercase">
              1-on-1 Live
            </span>
          </Link>

          <div className="hidden md:block h-4 w-px bg-white/20" />

          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-white truncate max-w-sm">
              {sessionData?.title || "Live Coaching Session"}
            </h1>
            <p className="text-[11px] text-gray-400">
              Coach: <span className="text-[#7CFF3B] font-semibold">{sessionData?.trainerName}</span> • Athlete:{" "}
              <span className="text-white font-semibold">{sessionData?.clientName}</span>
            </p>
          </div>
        </div>

        {/* Live Timer & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono font-bold">
            <span className="h-2 w-2 rounded-full bg-[#7CFF3B] animate-ping" />
            <span className="text-white">{formatTimer(elapsedSeconds)}</span>
            <span className="text-gray-500">/ {sessionData?.duration || 60}:00</span>
          </div>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`relative rounded-2xl border px-4 py-2 text-xs font-bold transition cursor-pointer ${
              chatOpen
                ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B]"
                : "border-white/10 bg-white/5 text-gray-300 hover:text-white"
            }`}
          >
            💬 Chat
            {messages.length > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#7CFF3B]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Video Viewport */}
      <main className="relative flex-1 p-4 md:p-6 flex gap-4 overflow-hidden">
        <div className="relative flex-1 rounded-[32px] overflow-hidden border border-white/10 bg-[#0B0F15] shadow-2xl flex items-center justify-center">
          {/* Main Remote Video (Coach/Client Feed) */}
          <video
            ref={setRemoteVideoElement}
            autoPlay
            playsInline
            className={`w-full h-full object-cover rounded-[32px] ${isRemoteVideoActive ? "block" : "hidden"}`}
          />

          {/* Remote Feed Placeholder when remote video is disabled or peer is connecting */}
          {!isRemoteVideoActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0B0F15]">
              <div className="relative">
                <div
                  className={`h-28 w-28 rounded-full bg-gradient-to-br from-[#7CFF3B]/20 to-[#111622] border-2 flex items-center justify-center text-4xl font-black text-[#7CFF3B] shadow-[0_0_50px_rgba(124,255,59,0.2)] transition-all ${
                    isRemoteSpeaking ? "border-[#7CFF3B] scale-105 shadow-[0_0_60px_rgba(124,255,59,0.5)]" : "border-[#7CFF3B]/40"
                  }`}
                >
                  {otherParticipantDisplay?.[0] || "P"}
                </div>
                {isRemoteSpeaking && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#7CFF3B] px-2.5 py-0.5 text-[9px] font-black text-black animate-pulse">
                    Speaking
                  </div>
                )}
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">
                {otherParticipantDisplay || (sessionData?.isHost ? "Client Athlete" : "Coach")}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {hasRemoteParticipant
                  ? isRemoteCameraOff
                    ? "Camera Disabled by Remote Peer"
                    : "Connecting video feed..."
                  : "Waiting for other participant to join room..."}
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-4 py-1.5 text-xs text-gray-300 backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasRemoteParticipant ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>
                  {hasRemoteParticipant ? "Encrypted Live Peer Connected" : "Room Ready • Awaiting Peer Join"}
                </span>
              </div>
            </div>
          )}

          {/* Remote Participant Label on Main Feed */}
          {isRemoteVideoActive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl bg-black/60 border border-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md z-10">
              <span className="h-2 w-2 rounded-full bg-[#7CFF3B]" />
              <span>{otherParticipantDisplay}</span>
              {isRemoteMicMuted && <span className="text-rose-400 text-xs">🔇</span>}
              {isRemoteScreenSharing && (
                <span className="rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 text-[9px] font-black">
                  🖥️ Screen
                </span>
              )}
              {isRemoteSpeaking && (
                <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-[9px] font-black text-black animate-pulse">
                  Speaking
                </span>
              )}
            </div>
          )}

          {/* Local Picture-in-Picture Self Video */}
          <div className="absolute bottom-6 right-6 w-48 sm:w-64 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 bg-[#111622] shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-10">
            <video
              ref={setLocalVideoElement}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraOff ? "hidden" : "block"}`}
            />
            {isCameraOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0C1017] text-gray-400">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-[10px] font-bold uppercase">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <span>{tokenData?.participantName || "You"} (Self)</span>
              {isMicMuted && <span className="text-rose-400">🔇</span>}
              {isScreenSharing && <span className="text-cyan-400">🖥️</span>}
              {isLocalSpeaking && !isMicMuted && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#7CFF3B] animate-ping" />
              )}
            </div>
          </div>
        </div>

        {/* In-Call Chat Drawer */}
        {chatOpen && (
          <aside className="w-80 sm:w-96 rounded-[32px] border border-white/10 bg-[#0C1017] p-5 flex flex-col justify-between shadow-2xl z-20 animate-fadeIn">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">In-Call Messaging</h4>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[60vh]">
              {messages.length > 0 ? (
                messages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                      <span className="text-[#7CFF3B]">{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="mt-1 text-xs text-white leading-relaxed">{m.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-8">
                  No in-call messages yet. Notes and form cues sent here are synced to your coaching room.
                </p>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-white/10">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message or workout note..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#7CFF3B] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#68e02d] cursor-pointer"
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* Bottom Floating Controls Bar */}
      <footer className="p-4 md:p-6 flex items-center justify-center z-20">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0C1017]/95 px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition cursor-pointer ${
              isMicMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? "🔇" : "🎤"}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition cursor-pointer ${
              isCameraOff
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? "🚫" : "📹"}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-full transition cursor-pointer ${
              isScreenSharing
                ? "bg-[#7CFF3B]/20 text-[#7CFF3B] border border-[#7CFF3B]/40"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            🖥️
          </button>

          <div className="h-6 w-px bg-white/20 mx-1" />

          {/* End / Leave Call Button */}
          <button
            onClick={() => setEndModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-xs font-bold text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] transition hover:bg-rose-700 cursor-pointer"
          >
            <span>🔴</span>
            <span>{sessionData?.isHost ? "End Session" : "Leave Call"}</span>
          </button>
        </div>
      </footer>

      {/* End Call Modal Confirmation */}
      {endModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0C1017] p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              {sessionData?.isHost ? "End Coaching Session?" : "Leave Video Call?"}
            </h3>
            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              {sessionData?.isHost
                ? "Ending the session will conclude the video room for both participants and mark the session as COMPLETED in your coaching history."
                : "You can leave the call now and return to your client dashboard."}
            </p>

            <div className="flex flex-col gap-3">
              {sessionData?.isHost ? (
                <>
                  <button
                    onClick={() => handleEndSession(true)}
                    disabled={endingSession}
                    className="w-full rounded-2xl bg-rose-600 py-3.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                  >
                    {endingSession ? "Concluding Session..." : "✓ End Session & Mark Completed"}
                  </button>
                  <button
                    onClick={() => handleEndSession(false)}
                    disabled={endingSession}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                  >
                    Leave Temporarily (Keep Session Open)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleEndSession(false)}
                  disabled={endingSession}
                  className="w-full rounded-2xl bg-rose-600 py-3.5 text-xs font-bold text-white transition hover:bg-rose-700 cursor-pointer"
                >
                  ✓ Leave Call & Return to Dashboard
                </button>
              )}

              <button
                onClick={() => setEndModalOpen(false)}
                disabled={endingSession}
                className="w-full text-center text-xs text-gray-400 hover:text-white pt-2 cursor-pointer"
              >
                Cancel / Return to Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
