import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLaserStore } from "../store/useLaserStore";
import type { User } from "@shared/types";

interface LaserOverlayProps {
  users: User[];
  currentUserId: string;
}

export function LaserOverlay({ users, currentUserId }: LaserOverlayProps) {
  const lasers = useLaserStore((s) => s.lasers);
  const removeLaser = useLaserStore((s) => s.removeLaser);

  // Auto-clean old lasers
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

  // Convert Map to array for rendering
  const laserArray = Array.from(lasers.values());

  return (
    <div className="pointer-events-none absolute inset-0">
      {laserArray.map((laser) => {
        const user = users.find((u) => u.id === laser.userId);
        const isOwn = laser.userId === currentUserId;
        const color = user?.color || "#ff0000";

        return (
          <motion.div
            key={laser.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.8, 0], scale: [1, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-4 h-4 rounded-full"
            style={{
              left: laser.x,
              top: laser.y,
              backgroundColor: color,
              boxShadow: `0 0 20px 4px ${color}`,
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  `0 0 10px 2px ${color}`,
                  `0 0 30px 8px ${color}`,
                  `0 0 10px 2px ${color}`,
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
