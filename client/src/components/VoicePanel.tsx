import { useVoiceStore } from "../store/useVoiceStore";
import type { User } from "@shared/types";

interface VoicePanelProps {
  users: User[];
  onToggleMute: () => void;
  onTogglePushToTalk: () => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isVoiceActive: boolean;
}

export function VoicePanel({
  users,
  onToggleMute,
  onTogglePushToTalk,
  onStartVoice,
  onStopVoice,
  isVoiceActive,
}: VoicePanelProps) {
  const { isMuted, isPushToTalk, speakingUsers } = useVoiceStore();

  return (
    <>
      {isVoiceActive && (
        <div className="fixed right-0 top-20 z-20 w-72 bg-white border-l border-gray-200 rounded-md p-3.5 dark:bg-gray-800 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-gray-900 dark:text-gray-100">Voice Room</span>
            </div>
            <button
              onClick={onStopVoice}
              className="text-[10px] text-red-500 hover:text-red-600"
            >
              Leave
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-1.5 mb-3.5">
            <button
              onClick={onToggleMute}
              className={`flex-1 py-1.5 rounded text-[10px] transition ${
                 isMuted
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {isMuted ? "🔇 Muted" : "🎤 Speaking"}
            </button>
            <button
              onClick={onTogglePushToTalk}
              className={`flex-1 py-1.5 rounded text-[10px] transition ${
                 isPushToTalk
                    ? "bg-cyan-100 text-cyan-800"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {isPushToTalk ? "Push-to-Talk" : "Always On"}
            </button>
          </div>

          {/* Participants */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
              Participants
            </div>
            {users.map((user) => {
              const isSpeaking = speakingUsers.has(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-1.5 p-1.5 rounded ${
                    isSpeaking
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  } dark:bg-gray-700 dark:border-gray-600`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-medium text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400">
                      {isSpeaking ? "Speaking..." : "Silent"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isPushToTalk && !isMuted && (
            <div className="mt-2.5 p-1.5 bg-cyan-50 border border-cyan-200 rounded text-[10px] text-cyan-800 text-center dark:bg-cyan-900/20 dark:border-cyan-700">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">Space</kbd> to talk
            </div>
          )}
        </div>
      )}
    </>
  );
}
