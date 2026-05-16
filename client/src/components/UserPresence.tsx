import { AnimatePresence, motion } from "framer-motion";
import { useThemeStore } from "../store/useThemeStore";
import type { User } from "@shared/types";

interface UserPresenceProps {
  users: User[];
  roomId: string;
}

export function UserPresence({ users, roomId }: UserPresenceProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-syncvas-panel/80 px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-3xl bg-cyan-400/15 px-4 py-1.5 text-sm font-semibold text-cyan-100">
          Syncvas
        </div>
        <div className="text-sm text-slate-400">Room ID:</div>
        <div className="rounded-full border border-cyan-500/30 bg-white/5 px-3 py-1.5 text-sm text-gray-800 dark:text-white font-mono">
          {roomId}
        </div>
      </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-10 h-5 rounded-full bg-white/20 border border-white/10 transition-colors hover:bg-white/30 flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <motion.div
              initial={false}
              animate={{ x: theme === "dark" ? 0 : 18 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white shadow-lg flex items-center justify-center text-[8px]"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </motion.div>
          </button>

        {/* Users */}
         <div className="flex items-center gap-2">
           <AnimatePresence mode="popLayout">
             {users.map((user) => (
               <motion.div
                 key={user.id}
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.15 }}
                  className="group relative flex items-center gap-1.5 rounded-3xl bg-white/5 px-2 py-1 text-xs text-gray-800 dark:text-white"
               >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-gray-800 dark:text-white"
                   style={{ backgroundColor: user.color }}
                 >
                   {user.username.slice(0, 2).toUpperCase()}
                 </span>
                 <span className="max-w-[60px] truncate">{user.username}</span>
                 <span className="absolute -bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] text-slate-200 group-hover:block whitespace-nowrap">
                   {user.username}
                 </span>
               </motion.div>
             ))}
           </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
