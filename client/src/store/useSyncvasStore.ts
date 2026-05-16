import { create } from "zustand";
import type { User, StrokeData, StickyNote, ChatMessage, Color, Tool, SelectionBounds } from "@shared/types";

interface SyncvasState {
  roomId: string;
  userId: string;
  username: string;
  color: Color;
  connected: boolean;
  offline: boolean;
  users: User[];
  strokes: StrokeData[];
  stickies: StickyNote[];
  messages: ChatMessage[];
  activeTool: Tool;
  strokeColor: Color;
  fillColor: Color;
  strokeWidth: number;
  strokeDash: number[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  chatOpen: boolean;
  unreadCount: number;
  toast: string;
  isLaserActive: boolean;
  selectedIds: string[];
  selectionBounds: SelectionBounds | null;
  layerOrder: string[]; // stroke/sticky ids from bottom to top

  setRoomMeta: (roomId: string, userId: string, username: string, color: string) => void;
  setConnected: (connected: boolean) => void;
  setOffline: (offline: boolean) => void;
  setUsers: (users: User[]) => void;
  updateCursor: (userId: string, x: number, y: number) => void;
  setStrokes: (strokes: StrokeData[]) => void;
  addStroke: (stroke: StrokeData) => void;
  setStickies: (stickies: StickyNote[]) => void;
  addSticky: (sticky: StickyNote) => void;
  updateSticky: (stickyId: string, changes: Partial<StickyNote>) => void;
  deleteSticky: (stickyId: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearCanvas: () => void;
  setTool: (tool: Tool) => void;
  setStrokeColor: (color: Color) => void;
  setFillColor: (color: Color) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeDash: (dash: number[]) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  setChatOpen: (open: boolean) => void;
  incrementUnread: () => void;
  resetRoomState: () => void;
  setToast: (toast: string) => void;
  setLaserActive: (active: boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  setSelectionBounds: (bounds: SelectionBounds | null) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  duplicateSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;
  deleteSelected: () => void;
}

export const useSyncvasStore = create<SyncvasState>((set, get) => ({
  roomId: "",
  userId: "",
  username: "",
  color: "#00e5ff",
  connected: false,
  offline: false,
  users: [],
  strokes: [],
  stickies: [],
  messages: [],
  activeTool: "pen",
  strokeColor: "#00e5ff",
  fillColor: "transparent",
  strokeWidth: 4,
  strokeDash: [],
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  chatOpen: true,  // Ensure chat is open by default
  unreadCount: 0,
  toast: "",
  isLaserActive: false,
  selectedIds: [],
  selectionBounds: null,
  layerOrder: [],

  setRoomMeta: (roomId, userId, username, color) => set({ roomId, userId, username, color }),

  setConnected: (connected) => set({ connected }),

  setOffline: (offline) => set({ offline }),

  setUsers: (users) => set({ users }),

  updateCursor: (userId, x, y) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, cursorX: x, cursorY: y, lastSeen: Date.now() } : user
      ),
    })),

  setStrokes: (strokes) => set({ strokes }),

  addStroke: (stroke) => set((state) => ({
    strokes: [...state.strokes.filter((s) => s.id !== stroke.id), stroke],
    layerOrder: [...state.layerOrder, stroke.id],
  })),

  setStickies: (stickies) => set({ stickies }),

  addSticky: (sticky) => set((state) => ({
    stickies: [...state.stickies.filter((s) => s.id !== sticky.id), sticky],
    layerOrder: [...state.layerOrder, sticky.id],
  })),

  updateSticky: (stickyId, changes) =>
    set((state) => ({
      stickies: state.stickies.map((sticky) =>
        sticky.id === stickyId ? { ...sticky, ...changes } : sticky
      ),
    })),

  deleteSticky: (stickyId) => set((state) => ({
    stickies: state.stickies.filter((sticky) => sticky.id !== stickyId),
    selectedIds: state.selectedIds.filter((id) => id !== stickyId),
    layerOrder: state.layerOrder.filter((id) => id !== stickyId),
  })),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  clearCanvas: () => set({ strokes: [], stickies: [], selectedIds: [], selectionBounds: null }),

  setTool: (tool) => set({ activeTool: tool }),

  setStrokeColor: (strokeColor: Color) => set({ strokeColor }),

  setFillColor: (fillColor: Color) => set({ fillColor }),

  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),

  setStrokeDash: (strokeDash) => set({ strokeDash }),

  setZoom: (zoom) => set({ zoom }),

  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),

  setChatOpen: (chatOpen) => set((state) => ({
    chatOpen,
    unreadCount: chatOpen ? 0 : state.unreadCount,
  })),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetRoomState: () => set({
    users: [],
    strokes: [],
    stickies: [],
    messages: [],
    connected: false,
    offline: false,
    unreadCount: 0,
    toast: "",
    selectedIds: [],
    selectionBounds: null,
    layerOrder: [],
  }),

  setToast: (toast) => set({ toast }),

  setLaserActive: (isLaserActive) => set({ isLaserActive }),

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  setSelectionBounds: (selectionBounds) => set({ selectionBounds }),

  bringToFront: (id) => set((state) => {
    const newOrder = state.layerOrder.filter((i) => i !== id);
    newOrder.push(id);
    return { layerOrder: newOrder };
  }),

  sendToBack: (id) => set((state) => {
    const newOrder = state.layerOrder.filter((i) => i !== id);
    newOrder.unshift(id);
    return { layerOrder: newOrder };
  }),

  duplicateSelected: () => set((state) => {
    const newStrokes = state.strokes.filter((s) => state.selectedIds.includes(s.id)).map((stroke) => ({
      ...stroke,
      id: crypto.randomUUID(),
      points: stroke.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
    }));
    const newStickies = state.stickies.filter((s) => state.selectedIds.includes(s.id)).map((sticky) => ({
      ...sticky,
      id: crypto.randomUUID(),
      x: sticky.x + 20,
      y: sticky.y + 20,
    }));
    return {
      strokes: [...state.strokes, ...newStrokes],
      stickies: [...state.stickies, ...newStickies],
      layerOrder: [...state.layerOrder, ...newStrokes.map((s) => s.id), ...newStickies.map((s) => s.id)],
      selectedIds: [...newStrokes.map((s) => s.id), ...newStickies.map((s) => s.id)],
    };
  }),

  moveSelected: (dx, dy) => set((state) => ({
    strokes: state.strokes.map((stroke) =>
      state.selectedIds.includes(stroke.id)
        ? { ...stroke, points: stroke.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
        : stroke
    ),
    stickies: state.stickies.map((sticky) =>
      state.selectedIds.includes(sticky.id)
        ? { ...sticky, x: sticky.x + dx, y: sticky.y + dy }
        : sticky
    ),
  })),

  deleteSelected: () => set((state) => ({
    strokes: state.strokes.filter((s) => !state.selectedIds.includes(s.id)),
    stickies: state.stickies.filter((s) => !state.selectedIds.includes(s.id)),
    selectedIds: [],
  })),
}));
