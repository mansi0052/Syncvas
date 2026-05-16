import { motion, AnimatePresence } from "framer-motion";
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
    <AnimatePresence>
      {isVoiceActive && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-20 z-20 w-72 bg-white/5 backdrop-blur-xl border-l border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-200">Voice Room</span>
            </div>
            <button
              onClick={onStopVoice}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Leave
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={onToggleMute}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                 isMuted
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-white/10 text-gray-900 dark:text-slate-300 border border-white/10 hover:bg-white/20"
              }`}
            >
              {isMuted ? "🔇 Muted" : "🎤 Speaking"}
            </button>
            <button
              onClick={onTogglePushToTalk}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                 isPushToTalk
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "bg-white/10 text-gray-900 dark:text-slate-300 border border-white/10 hover:bg-white/20"
              }`}
            >
              {isPushToTalk ? "Push-to-Talk" : "Always On"}
            </button>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div                 className="text-xs text-gray-800/60 dark:text-slate-400 mb-2">Participants</div>
            {users.map((user) => {
              const isSpeaking = speakingUsers.has(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isSpeaking
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-white/5 border border-transparent"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-gray-800 dark:text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                     <div className="text-sm text-gray-800 dark:text-white font-medium">{user.username}</div>
                     <div className="text-[10px] text-gray-800/50 dark:text-white/50">
                      {isSpeaking ? "Speaking..." : isMuted && user.id === useVoiceStore.getState().localUserId ? "Muted" : "Silent"}
                    </div>
                  </div>
                  {isSpeaking && (
                    <div className="flex gap-0.5 items-center h-4">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-green-400 rounded-full"
                          animate={{ height: [4, 12, 8, 16] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isPushToTalk && !isMuted && (
            <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> to talk
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
