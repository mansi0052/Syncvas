import { useCallback, useEffect, useRef, useState } from "react";
import { useLaserStore } from "../store/useLaserStore";
import { getSocket } from "./useSocket";

interface UseLaserProps {
  roomId: string;
  userId: string;
  isActive: boolean;
}

export function useLaser({ roomId, userId, isActive }: UseLaserProps) {
  const addLaser = useLaserStore((s) => s.addLaser);
  const removeLaser = useLaserStore((s) => s.removeLaser);
  const updateLaser = useLaserStore((s) => s.updateLaser);

  const [activeLaserId, setActiveLaserId] = useState<string | null>(null);

  // Listen for remote laser events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStart = (e: CustomEvent) => {
      const { laserId, userId: senderId, x, y } = e.detail;
      addLaser(laserId, senderId, x, y);
    };

    const handleMove = (e: CustomEvent) => {
      const { laserId, x, y } = e.detail;
      updateLaser(laserId, x, y);
    };

    const handleEnd = (e: CustomEvent) => {
      const { laserId } = e.detail;
      removeLaser(laserId);
    };

    window.addEventListener("laser-start", handleStart as EventListener);
    window.addEventListener("laser-move", handleMove as EventListener);
    window.addEventListener("laser-end", handleEnd as EventListener);

    return () => {
      window.removeEventListener("laser-start", handleStart as EventListener);
      window.removeEventListener("laser-move", handleMove as EventListener);
      window.removeEventListener("laser-end", handleEnd as EventListener);
    };
  }, [addLaser, updateLaser, removeLaser]);

  const startLaser = useCallback((x: number, y: number) => {
    const laserId = crypto.randomUUID();
    setActiveLaserId(laserId);
    addLaser(laserId, userId, x, y);
    getSocket()?.emit("laser-start", { roomId, laserId, userId, x, y });
  }, [roomId, userId, addLaser]);

  const moveLaser = useCallback((x: number, y: number) => {
    if (!activeLaserId) return;
    updateLaser(activeLaserId, x, y);
    getSocket()?.emit("laser-move", { roomId, laserId: activeLaserId, x, y });
  }, [roomId, activeLaserId, updateLaser]);

  const endLaser = useCallback(() => {
    if (!activeLaserId) return;
    getSocket()?.emit("laser-end", { roomId, laserId: activeLaserId });
    removeLaser(activeLaserId);
    setActiveLaserId(null);
  }, [roomId, activeLaserId, removeLaser]);

  return {
    startLaser,
    moveLaser,
    endLaser,
    isPointing: activeLaserId !== null,
  };
}
