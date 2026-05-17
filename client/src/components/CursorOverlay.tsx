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
      {activeUsers.map((user) => (
        <div
          key={user.id}
          className="absolute"
          style={{
            left: user.cursorX ?? 0,
            top: user.cursorY ?? 0,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="relative flex items-center gap-1.5">
            <div
              className="h-7 w-7 rounded-full bg-white p-0.5 text-[9px] text-gray-900 shadow-sm border"
              style={{ borderColor: user.color }}
            >
              <span className="block h-full w-full rounded-full" style={{ backgroundColor: user.color }} />
            </div>
            <div className="rounded bg-white px-1.5 py-0.5 text-[9px] text-gray-800 shadow-sm">
              {user.username}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
