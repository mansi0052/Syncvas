import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const socketIo = require("socket.io");
import type { Server as HTTPServer } from "http";

import {
  addMessage,
  addUser,
  createRoom,
  getRoom,
  removeUser,
} from "./rooms";
import { attachYjsServer } from "./yjsServer";
import type { ChatMessage, StickyNote, StrokeData, User } from "../../shared/types";

const app = express();
const port = Number(process.env.PORT || 3001);
const server = http.createServer(app);

// Attach Yjs WebSocket handler BEFORE Socket.io
// This ensures /yjs upgrades are handled by Yjs, not Socket.io
attachYjsServer(server);

const io = new socketIo.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const clientDist = path.join(process.cwd(), "../client/dist");
  app.use(express.static(clientDist));

  app.get("*", (_req: unknown, res: { sendFile: (p: string) => void }) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// In-memory store for voice chat readiness
const voiceReady = new Map<string, Set<string>>();

io.on("connection", (socket: any) => {
  try {
    // ========== Voice Chat Signaling ==========
    socket.on("voice-ready", ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      try {
        console.log(`[Voice] ${username} ready for voice in room ${roomId}`);

        const roomReady = voiceReady.get(roomId) || new Set<string>();
        roomReady.add(userId);
        voiceReady.set(roomId, roomReady);

        socket.to(roomId).emit("voice-user-ready", { userId, username });

        const readyUsers = Array.from(roomReady).filter(id => id !== userId);
        readyUsers.forEach((readyUserId) => {
          socket.emit("voice-user-ready", { userId: readyUserId, username });
        });
      } catch (err) {
        console.error("[Voice] Error in voice-ready:", err);
      }
    });

    socket.on("voice-offer", (payload: { roomId: string; targetUserId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const { targetUserId, sdp } = payload;
        socket.to(targetUserId).emit("voice-offer", {
          callerId: socket.data.userId,
          callerUsername: socket.data.username || "Unknown",
          sdp,
        });
      } catch (err) {
        console.error("[Voice] Error in voice-offer:", err);
      }
    });

    socket.on("voice-answer", (payload: { roomId: string; targetUserId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        socket.to(payload.targetUserId).emit("voice-answer", {
          targetUserId: socket.data.userId,
          sdp: payload.sdp,
        });
      } catch (err) {
        console.error("[Voice] Error in voice-answer:", err);
      }
    });

    socket.on("webrtc-ice-candidate", (payload: { roomId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => {
      try {
        socket.to(payload.targetUserId).emit("ice-candidate", {
          senderId: socket.data.userId,
          candidate: payload.candidate,
        });
      } catch (err) {
        console.error("[Voice] Error in ice-candidate:", err);
      }
    });

    // ========== Room Management ==========
    socket.on("join-room", (payload: { roomId: string; userId: string; username: string; color: string }) => {
      try {
        const { roomId, userId, username, color } = payload;
        const room = getRoom(roomId);
        const user: User = { id: userId, username, color, lastSeen: Date.now() };

        addUser(roomId, user);
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = userId;
        socket.data.username = username;

        io.to(roomId).emit("user-joined", { userId, username, color, users: room.users });
        socket.emit("room-state", {
          users: room.users,
          messages: room.messages,
        });

        console.log(`[Syncvas] ${username} joined room ${roomId}`);
      } catch (err) {
        console.error("[Room] Error in join-room:", err);
      }
    });

    socket.on("leave-room", (payload: { roomId: string; userId: string }) => {
      try {
        const { roomId, userId } = payload;
        removeUser(roomId, userId);
        socket.leave(roomId);

        socket.to(roomId).emit("voice-user-left", { userId });
        io.to(roomId).emit("user-left", { userId, users: getRoom(roomId).users });
        console.log(`[Syncvas] ${userId} left room ${roomId}`);
      } catch (err) {
        console.error("[Room] Error in leave-room:", err);
      }
    });

    // ========== Whiteboard State Sync ==========
    socket.on("draw-stroke", (payload: { roomId: string; stroke: StrokeData }) => {
      try {
        const { roomId, stroke } = payload;
        socket.to(roomId).emit("stroke-added", stroke);
      } catch (err) {
        console.error("[Whiteboard] Error in draw-stroke:", err);
      }
    });

    socket.on("cursor-move", (payload: { roomId: string; userId: string; x: number; y: number }) => {
      try {
        const { roomId, userId, x, y } = payload;
        const room = getRoom(roomId);
        room.users = room.users.map((user) =>
          user.id === userId ? { ...user, cursorX: x, cursorY: y, lastSeen: Date.now() } : user
        );
        socket.to(roomId).emit("cursor-updated", { userId, x, y });
      } catch (err) {
        console.error("[Whiteboard] Error in cursor-move:", err);
      }
    });

    socket.on("add-sticky", (payload: { roomId: string; sticky: StickyNote }) => {
      try {
        const { roomId, sticky } = payload;
        socket.to(roomId).emit("sticky-added", { sticky });
      } catch (err) {
        console.error("[Whiteboard] Error in add-sticky:", err);
      }
    });

    socket.on("update-sticky", (payload: { roomId: string; stickyId: string; changes: Partial<StickyNote> }) => {
      try {
        const { roomId, stickyId, changes } = payload;
        socket.to(roomId).emit("sticky-updated", { stickyId, changes });
      } catch (err) {
        console.error("[Whiteboard] Error in update-sticky:", err);
      }
    });

    socket.on("delete-sticky", (payload: { roomId: string; stickyId: string }) => {
      try {
        const { roomId, stickyId } = payload;
        socket.to(roomId).emit("sticky-deleted", { stickyId });
      } catch (err) {
        console.error("[Whiteboard] Error in delete-sticky:", err);
      }
    });

    socket.on("clear-canvas", (payload: { roomId: string }) => {
      try {
        io.to(payload.roomId).emit("canvas-cleared", {});
      } catch (err) {
        console.error("[Whiteboard] Error in clear-canvas:", err);
      }
    });

    // ========== Chat ==========
    socket.on("chat-message", (payload: ChatMessage & { roomId: string }) => {
      try {
        const { roomId, ...message } = payload;
        console.log(`[Server] Received chat from ${message.username} in room ${roomId}: "${message.text}"`);
        addMessage(roomId, message);
        io.to(roomId).emit("chat-message", message);
      } catch (err) {
        console.error("[Chat] Error in chat-message:", err);
      }
    });

  } catch (err) {
    console.error("[Socket] Connection handler error:", err);
    socket.disconnect(true);
  }
});

server.listen(port, () => {
  console.log(`[Syncvas] Server listening on http://localhost:${port}`);
});
