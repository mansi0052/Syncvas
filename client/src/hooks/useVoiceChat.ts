import { useEffect, useRef, useCallback, useState } from "react";
import { useVoiceStore } from "../store/useVoiceStore";
import { getSocket } from "./useSocket";

interface VoiceReadyPayload {
  roomId: string;
  userId: string;
  username: string;
}

interface VoiceUserReadyPayload {
  userId: string;
  username: string;
}

interface VoiceOfferPayload {
  callerId: string;
  callerUsername: string;
  sdp: RTCSessionDescriptionInit;
}

interface VoiceAnswerPayload {
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;
}

interface IceCandidatePayload {
  senderId: string;
  candidate: RTCIceCandidateInit;
}

interface UseVoiceChatProps {
  roomId: string;
  userId: string;
  username: string;
}

const SPEAKING_THRESHOLD = 30;

export function useVoiceChat({ roomId, userId, username }: UseVoiceChatProps) {
  const voiceStore = useVoiceStore();

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRefsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const speakingCheckRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize local audio stream
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      localStreamRef.current = stream;
      voiceStore.setVoiceEnabled(true);
      return stream;
    } catch (err) {
      console.error("[Voice] Mic access denied:", err);
      setError("Microphone access denied");
      voiceStore.setVoiceEnabled(false);
      return null;
    }
  }, [voiceStore]);

  // Create RTCPeerConnection
  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit("webrtc-ice-candidate", {
          roomId,
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      let audioEl = remoteAudioRefsRef.current.get(remoteUserId);

      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(console.error);
        remoteAudioRefsRef.current.set(remoteUserId, audioEl);
      } else {
        audioEl.srcObject = remoteStream;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Voice] Connection with ${remoteUserId}: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        voiceStore.removeUser(remoteUserId);
        pc.close();
        peerConnectionsRef.current.delete(remoteUserId);
      }
    };

    return pc;
  }, [roomId, voiceStore]);

  // Connect to a specific user
  const connectToUser = useCallback(async (targetUserId: string, targetUsername: string) => {
    if (!localStreamRef.current) return;

    const pc = createPeerConnection(targetUserId);

    // Add local audio tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket?.emit("voice-offer", {
        roomId,
        targetUserId,
        sdp: offer,
      });

      peerConnectionsRef.current.set(targetUserId, pc);
    } catch (err) {
      console.error("[Voice] Offer creation failed:", err);
    }
  }, [createPeerConnection, roomId]);

  // Handle incoming offer
  const handleOffer = useCallback(async (payload: { callerId: string; callerUsername: string; sdp: RTCSessionDescriptionInit }) => {
    const { callerId, callerUsername, sdp } = payload;

    if (!localStreamRef.current) {
      console.warn("[Voice] No local stream for incoming call");
      return;
    }

    const pc = createPeerConnection(callerId);

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit("voice-answer", {
        roomId,
        targetUserId: callerId,
        sdp: answer,
      });

      peerConnectionsRef.current.set(callerId, pc);
      voiceStore.addUser({
        id: callerId,
        username: callerUsername,
        color: "#00e5ff",
        isSpeaking: false,
      });
    } catch (err) {
      console.error("[Voice] Answer failed:", err);
    }
  }, [createPeerConnection, roomId, voiceStore]);

  // Handle answer
  const handleAnswer = useCallback((payload: { targetUserId: string; sdp: RTCSessionDescriptionInit }) => {
    const pc = peerConnectionsRef.current.get(payload.targetUserId);
    if (pc) {
      pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback((payload: { senderId: string; candidate: RTCIceCandidateInit }) => {
    const pc = peerConnectionsRef.current.get(payload.senderId);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  }, []);

  // Handle user ready
  const handleUserReady = useCallback(({ userId: readyUserId, username: readyUsername }: { userId: string; username: string }) => {
    console.log(`[Voice] User ready: ${readyUsername} (${readyUserId})`);

    if (isInitialized && !peerConnectionsRef.current.has(readyUserId)) {
      connectToUser(readyUserId, readyUsername);
    }
  }, [isInitialized, connectToUser]);

  // Speaking detection loop
  const startSpeakingDetection = useCallback(() => {
    if (speakingCheckRef.current) return;

    const check = async () => {
      if (!localStreamRef.current || voiceStore.isMuted) {
        voiceStore.updateUserSpeaking(userId, false);
        speakingCheckRef.current = requestAnimationFrame(check);
        return;
      }

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(localStreamRef.current);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        }

        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
          const isSpeaking = average > SPEAKING_THRESHOLD;

          // For push-to-talk mode, only mark as speaking if key is pressed (simplified for demo)
          const canSpeak = voiceStore.isPushToTalk ? true : true; // Would track keydown/keyup

          voiceStore.updateUserSpeaking(userId, isSpeaking && canSpeak, average);
        }
      } catch (err) {
        console.error("[Voice] Speaking detection error:", err);
      }

      speakingCheckRef.current = requestAnimationFrame(check);
    };

    check();
  }, [userId, voiceStore]);

  // Start voice chat
  const startVoice = useCallback(async () => {
    const stream = await initLocalStream();
    if (!stream) return;

    voiceStore.setLocalUserId(userId);
    voiceStore.addUser({
      id: userId,
      username,
      color: "#00e5ff",
      isSpeaking: false,
    });

    const socket = getSocket();
    socket?.emit("voice-ready", { roomId, userId, username });
    setIsInitialized(true);
    startSpeakingDetection();
  }, [userId, username, roomId, initLocalStream, voiceStore, startSpeakingDetection]);

  // Stop voice chat
  const stopVoice = useCallback(() => {
    const pcCount = peerConnectionsRef.current.size;
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    remoteAudioRefsRef.current.forEach((el) => el.pause());
    remoteAudioRefsRef.current.clear();

    if (speakingCheckRef.current) {
      cancelAnimationFrame(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    voiceStore.reset();
    setIsInitialized(false);
  }, [voiceStore]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        voiceStore.setMuted(!audioTrack.enabled);
      }
    }
  }, [voiceStore]);

  // Toggle push-to-talk
  const togglePushToTalk = useCallback(() => {
    voiceStore.setPushToTalk(!voiceStore.isPushToTalk);
  }, [voiceStore]);

  // Setup event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("voice-offer", handleOffer as any);
    socket.on("voice-answer", handleAnswer as any);
    socket.on("ice-candidate", handleIceCandidate as any);
    socket.on("voice-user-ready", handleUserReady as any);

    return () => {
      socket.off("voice-offer", handleOffer as any);
      socket.off("voice-answer", handleAnswer as any);
      socket.off("ice-candidate", handleIceCandidate as any);
      socket.off("voice-user-ready", handleUserReady as any);
    };
  }, [handleOffer, handleAnswer, handleIceCandidate, handleUserReady]);

  return {
    startVoice,
    stopVoice,
    toggleMute,
    togglePushToTalk,
    error,
    isVoiceActive: isInitialized,
  };
}
