import { useEffect } from "react";
import { useLaserStore } from "../store/useLaserStore";
import type { User } from "@shared/types";

interface LaserOverlayProps {
  users: User[];
  currentUserId: string;
}

export function LaserOverlay({ users, currentUserId }: LaserOverlayProps) {
  const lasers = useLaserStore((s) => s.lasers);
  const removeLaser = useLaserStore((s) => s.removeLaser);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      lasers.forEach((laser, id) => {
        if (now - laser.createdAt > 2000) {
          removeLaser(id);
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [lasers, removeLaser]);

  const laserArray = Array.from(lasers.values());

  return (
    <div className="pointer-events-none absolute inset-0">
      {laserArray.map((laser) => {
        const user = users.find((u) => u.id === laser.userId);
        const color = user?.color || "#ff0000";

        return (
          <div
            key={laser.id}
            className="absolute w-3 h-3 rounded-full opacity-80"
            style={{
              left: laser.x,
              top: laser.y,
              backgroundColor: color,
              boxShadow: `0 0 12px 3px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}
