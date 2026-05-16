import { useEffect, useMemo, useRef, useCallback } from "react";
import { io, type Socket, type ManagerOptions } from "socket.io-client";

import { useSyncvasStore } from "../store/useSyncvasStore";
import type { ChatMessage, StickyNote, StrokeData, User } from "@shared/types";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  "http://localhost:3001";

type SocketEventHandlers = {
  "connect": () => void;
  "disconnect": () => void;
  "room-state": (state: {
    users: User[];
    messages: ChatMessage[];
  }) => void;
  "user-joined": (payload: { userId: string; username: string; color: string; users: User[] }) => void;
  "user-left": (payload: { userId: string; users: User[] }) => void;
  "stroke-added": (stroke: StrokeData) => void;
  "cursor-updated": (payload: { userId: string; x: number; y: number }) => void;
  "sticky-added": (payload: { sticky: StickyNote }) => void;
  "sticky-updated": (payload: { stickyId: string; changes: Partial<StickyNote> }) => void;
  "sticky-deleted": (payload: { stickyId: string }) => void;
  "chat-message": (message: ChatMessage) => void;
  "canvas-cleared": () => void;
  "laser-start": (payload: { laserId: string; userId: string; x: number; y: number }) => void;
  "laser-move": (payload: { laserId: string; x: number; y: number }) => void;
  "laser-end": (payload: { laserId: string }) => void;
};

let globalSocket: Socket | null = null;

export function getSocket(): Socket | null {
  return globalSocket;
}

export function useSocket(options?: { onCanvasCleared?: () => void }) {
  const socketRef = useRef<Socket | null>(null);
  const store = useSyncvasStore();
  const { onCanvasCleared } = options || {};

  const socket = useMemo(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    console.log(`[Socket] Creating socket connection to ${SERVER_URL}`);
    const instance = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: false,
    } as ManagerOptions);

    socketRef.current = instance;
    globalSocket = instance;
    return instance;
  }, []);

  useEffect(() => {
    const s = socket;

    console.log("[Socket] Setting up event handlers");

    const handleConnect = () => {
      console.log("[Socket] Connected to server");
      store.setConnected(true);
      store.setOffline(false);
      store.setToast("Welcome to Syncvas");
      setTimeout(() => store.setToast(""), 2600);
    };

    const handleDisconnect = () => {
      console.log("[Socket] Disconnected from server");
      store.setConnected(false);
      store.setOffline(true);
    };

    const handleRoomState = (state: Parameters<SocketEventHandlers["room-state"]>[0]) => {
      console.log("[Socket] room-state received:", { users: state.users.length, messages: state.messages.length });
      store.setUsers(state.users);
      store.setMessages(state.messages);
    };

    const handleUserJoined = (payload: Parameters<SocketEventHandlers["user-joined"]>[0]) => {
      console.log(`[Socket] user-joined: ${payload.username} (${payload.userId})`);
      store.setUsers(payload.users);
    };

    const handleUserLeft = (payload: Parameters<SocketEventHandlers["user-left"]>[0]) => {
      console.log(`[Socket] user-left: ${payload.userId}`);
      store.setUsers(payload.users);
    };

    const handleStrokeAdded = (stroke: StrokeData) => {
      console.log(`[Socket] stroke-added from ${stroke.userId}:`, { tool: stroke.tool, points: stroke.points.length, color: stroke.color });
      const state = useSyncvasStore.getState();
      if (!state.strokes.some((s) => s.id === stroke.id)) {
        store.addStroke(stroke);
        console.log("[Socket] Added stroke, total strokes now:", state.strokes.length + 1);
      } else {
        console.log("[Socket] Duplicate stroke, skipping");
      }
    };

    const handleCursorUpdated = (payload: Parameters<SocketEventHandlers["cursor-updated"]>[0]) => {
      store.updateCursor(payload.userId, payload.x, payload.y);
    };

    const handleStickyAdded = (payload: Parameters<SocketEventHandlers["sticky-added"]>[0]) => {
      const state = useSyncvasStore.getState();
      if (!state.stickies.some((note) => note.id === payload.sticky.id)) {
        store.addSticky(payload.sticky);
      }
    };

    const handleStickyUpdated = (payload: Parameters<SocketEventHandlers["sticky-updated"]>[0]) => {
      store.updateSticky(payload.stickyId, payload.changes);
    };

    const handleStickyDeleted = (payload: Parameters<SocketEventHandlers["sticky-deleted"]>[0]) => {
      store.deleteSticky(payload.stickyId);
    };

    const handleChatMessage = (message: ChatMessage) => {
      console.log(`[Socket] chat-message from ${message.username}: "${message.text}"`);
      const state = useSyncvasStore.getState();
      if (!state.messages.some((m) => m.id === message.id)) {
        store.addMessage(message);
        console.log("[Socket] Added message, total:", state.messages.length + 1);
        if (!state.chatOpen) store.incrementUnread();
      } else {
        console.log("[Socket] Duplicate message, skipping");
      }
    };

    const handleCanvasCleared = () => {
      store.clearCanvas();
      onCanvasCleared?.();
    };

    const handleLaserStart = (payload: Parameters<SocketEventHandlers["laser-start"]>[0]) => {
      window.dispatchEvent(new CustomEvent("laser-start", { detail: payload }));
    };

    const handleLaserMove = (payload: Parameters<SocketEventHandlers["laser-move"]>[0]) => {
      window.dispatchEvent(new CustomEvent("laser-move", { detail: payload }));
    };

    const handleLaserEnd = (payload: Parameters<SocketEventHandlers["laser-end"]>[0]) => {
      window.dispatchEvent(new CustomEvent("laser-end", { detail: payload }));
    };

    // Register all handlers
    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("room-state", handleRoomState);
    s.on("user-joined", handleUserJoined);
    s.on("user-left", handleUserLeft);
    s.on("stroke-added", handleStrokeAdded);
    s.on("cursor-updated", handleCursorUpdated);
    s.on("sticky-added", handleStickyAdded);
    s.on("sticky-updated", handleStickyUpdated);
    s.on("sticky-deleted", handleStickyDeleted);
    s.on("chat-message", handleChatMessage);
    s.on("canvas-cleared", handleCanvasCleared);
    s.on("laser-start", handleLaserStart);
    s.on("laser-move", handleLaserMove);
    s.on("laser-end", handleLaserEnd);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("room-state", handleRoomState);
      s.off("user-joined", handleUserJoined);
      s.off("user-left", handleUserLeft);
      s.off("stroke-added", handleStrokeAdded);
      s.off("cursor-updated", handleCursorUpdated);
      s.off("sticky-added", handleStickyAdded);
      s.off("sticky-updated", handleStickyUpdated);
      s.off("sticky-deleted", handleStickyDeleted);
      s.off("chat-message", handleChatMessage);
      s.off("canvas-cleared", handleCanvasCleared);
      s.off("laser-start", handleLaserStart);
      s.off("laser-move", handleLaserMove);
      s.off("laser-end", handleLaserEnd);
    };
  }, [socket, store, onCanvasCleared]);

   const joinRoom = useCallback((
     roomId: string,
     userId: string,
     username: string,
     color: string
   ) => {
     console.log(`[Socket] Joining room ${roomId} as ${username}`);
     socket.connect();
     socket.emit("join-room", { roomId, userId, username, color });
   }, [socket]);

  const leaveRoom = useCallback((
    roomId: string,
    userId: string
  ) => {
    socket.emit("leave-room", { roomId, userId });
    socket.disconnect();
  }, [socket]);

  const sendStroke = useCallback((roomId: string, stroke: StrokeData) => {
    socket.emit("draw-stroke", { roomId, stroke });
  }, [socket]);

  const sendCursor = useCallback((roomId: string, userId: string, x: number, y: number) => {
    socket.emit("cursor-move", { roomId, userId, x, y });
  }, [socket]);

  const sendSticky = useCallback((roomId: string, sticky: StickyNote) => {
    socket.emit("add-sticky", { roomId, sticky });
  }, [socket]);

  const updateRemoteSticky = useCallback((roomId: string, stickyId: string, changes: Partial<StickyNote>) => {
    socket.emit("update-sticky", { roomId, stickyId, changes });
  }, [socket]);

  const deleteRemoteSticky = useCallback((roomId: string, stickyId: string) => {
    socket.emit("delete-sticky", { roomId, stickyId });
  }, [socket]);

  const sendChatMessage = useCallback((roomId: string, message: ChatMessage) => {
    socket.emit("chat-message", { roomId, ...message });
    store.addMessage(message);
  }, [socket, store]);

  const requestClearCanvas = useCallback((roomId: string) => {
    socket.emit("clear-canvas", { roomId });
    store.clearCanvas();
  }, [socket, store]);

  const sendTyping = useCallback((roomId: string, username: string) => {
    socket.emit("typing", { roomId, username });
  }, [socket]);

  const onTyping = useCallback((callback: (username: string) => void) => {
    socket.on("typing", ({ username }: { username: string }) => callback(username));
  }, [socket]);

  const offTyping = useCallback(() => {
    socket.off("typing");
  }, [socket]);

  const sendLaserStart = useCallback((roomId: string, laserId: string, userId: string, x: number, y: number) => {
    socket.emit("laser-start", { roomId, laserId, userId, x, y });
  }, [socket]);

  const sendLaserMove = useCallback((roomId: string, laserId: string, x: number, y: number) => {
    socket.emit("laser-move", { roomId, laserId, x, y });
  }, [socket]);

  const sendLaserEnd = useCallback((roomId: string, laserId: string) => {
    socket.emit("laser-end", { roomId, laserId });
  }, [socket]);

  return {
    socket,
    joinRoom,
    leaveRoom,
    sendStroke,
    sendCursor,
    sendSticky,
    updateSticky: updateRemoteSticky,
    deleteSticky: deleteRemoteSticky,
    sendChatMessage,
    requestClearCanvas,
    sendTyping,
    onTyping,
    offTyping,
    sendLaserStart,
    sendLaserMove,
    sendLaserEnd,
  };
}
