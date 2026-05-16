import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@shared/types";

interface CursorOverlayProps {
  users: User[];
}

const CURSOR_TIMEOUT = 3000;

export function CursorOverlay({ users }: CursorOverlayProps) {
  const now = Date.now();
  const activeUsers = users.filter(
    (user) =>
      user.cursorX !== undefined &&
      user.cursorY !== undefined &&
      (now - (user.lastSeen || 0)) < CURSOR_TIMEOUT
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {activeUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.2 }}
            className="absolute"
            style={{
              left: user.cursorX ?? 0,
              top: user.cursorY ?? 0,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="relative flex items-center gap-2">
              <div
                className="h-10 w-10 rounded-full bg-white/10 p-1 text-xs text-gray-900 dark:text-slate-300 shadow-lg"
                style={{
                  borderColor: user.color,
                  borderWidth: 1,
                  borderStyle: "solid",
                }}
              >
                <span className="block h-full w-full rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
              </div>
               <div className="rounded-full bg-white/95 dark:bg-syncvas-panel/95 px-3 py-1 text-xs text-gray-800 dark:text-slate-200 backdrop-blur">
                {user.username}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
