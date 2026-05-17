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
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-3.5 py-2 dark:border-gray-600 dark:bg-gray-800">
      <div className="flex items-center gap-2.5">
        <div className="rounded-md bg-cyan-100 px-2.5 py-1 text-[10px] font-medium text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
          Syncvas
        </div>
        <div className="text-[10px] text-gray-600 dark:text-gray-400">Room:</div>
        <div className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {roomId}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="text-[10px] text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div className="flex items-center gap-1.5">
          {users.map((user) => (
            <div
              key={user.id}
              className="relative flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-medium text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
