import { create } from "zustand";

interface LaserPoint {
  id: string;
  userId: string;
  x: number;
  y: number;
  createdAt: number;
}

interface LaserState {
  lasers: Map<string, LaserPoint>;
  addLaser: (id: string, userId: string, x: number, y: number) => void;
  removeLaser: (id: string) => void;
  updateLaser: (id: string, x: number, y: number) => void;
  clearRoomLasers: (roomId?: string) => void;
}

export const useLaserStore = create<LaserState>((set, get) => ({
  lasers: new Map(),

  addLaser: (id, userId, x, y) => {
    set((state) => {
      const next = new Map(state.lasers);
      next.set(id, { id, userId, x, y, createdAt: Date.now() });
      return { lasers: next };
    });
  },

  removeLaser: (id) => {
    set((state) => {
      const next = new Map(state.lasers);
      next.delete(id);
      return { lasers: next };
    });
  },

  updateLaser: (id, x, y) => {
    set((state) => {
      const next = new Map(state.lasers);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, x, y });
      }
      return { lasers: next };
    });
  },

  clearRoomLasers: () => {
    set({ lasers: new Map() });
  },
}));
