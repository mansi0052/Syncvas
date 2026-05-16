import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@shared/types";

interface ChatPanelProps {
  open: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  currentUsername: string;
  onToggle: () => void;
  onSend: (message: ChatMessage) => void;
  unreadCount: number;
  typingUsers?: string[];
  onTyping?: () => void;
}

export function ChatPanel({
  open,
  messages,
  currentUserId,
  currentUsername,
  onToggle,
  onSend,
  unreadCount,
  typingUsers = [],
  onTyping,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: currentUserId,
      username: currentUsername,
      text,
      timestamp: Date.now(),
    };

    onSend(message);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onTyping?.();
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-2xl border border-r-0 border-white/10 bg-cyan-500/95 px-3 py-4 text-xs text-gray-900 dark:text-slate-900 backdrop-blur hover:bg-cyan-500 transition-colors shadow-lg"
        style={{ writingMode: "vertical-rl" }}
      >
        {unreadCount > 0 ? `Chat (${unreadCount})` : "Chat"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed right-0 top-0 z-40 flex h-full w-[360px] flex-col border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0c1420]/98 backdrop-blur-xl transition-colors"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-5 py-4 bg-white/90 dark:bg-transparent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                <span className="font-semibold text-gray-900 dark:text-white">Live Chat</span>
              </div>
              <button
                onClick={onToggle}
                className="text-gray-800/60 dark:text-white/60 hover:text-gray-800 dark:hover:text-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-[#0c1420]/80">
               {messages.length === 0 && (
                 <div className="text-center text-sm text-gray-800/40 dark:text-white/40 mt-10">
                   No messages yet
                 </div>
               )}

              {messages.map((msg) => {
                const isOwn = msg.userId === currentUserId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
                      <div className="text-[10px] text-gray-800/60 dark:text-white/40 px-1">
                        {!isOwn && msg.username}
                      </div>
                    <div
                        className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                          isOwn
                            ? "bg-cyan-500 text-white border border-cyan-400/30"
                            : "bg-white/90 dark:bg-white/10 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-white/20"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}

                {typingUsers.length > 0 && (
                  <div className="text-xs text-gray-800 dark:text-cyan-300 dark:bg-white/10 px-2 py-1 rounded-full animate-pulse inline-block">
                    {typingUsers.join(", ")} typing...
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>

              <div className="border-t border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-black/20">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                 placeholder="Type a message..."
                  className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm px-4 py-3 rounded-xl outline-none border-2 border-gray-300 dark:border-cyan-500/30 focus:border-cyan-400 transition-all placeholder:text-gray-800/40 dark:placeholder:text-white/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
