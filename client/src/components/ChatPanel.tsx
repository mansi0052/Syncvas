import { useEffect, useRef, useState } from "react";
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
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-md border border-r-0 border-gray-300 bg-cyan-500 px-2.5 py-3.5 text-[10px] text-gray-900 dark:border-gray-600 dark:bg-cyan-600 dark:text-gray-100"
        style={{ writingMode: "vertical-rl" }}
      >
        {unreadCount > 0 ? `Chat (${unreadCount})` : "Chat"}
      </button>

      {open && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Chat</span>
            </div>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="mt-8 text-center text-[11px] text-gray-500 dark:text-gray-400">
                No messages yet
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.userId === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  <div className="text-[9px] text-gray-600 dark:text-gray-400 px-1 mb-0.5">
                    {!isOwn && msg.username}
                  </div>
                  <div
                    className={`px-2.5 py-1.5 rounded-md text-[11px] max-w-[75%] ${
                      isOwn
                        ? "bg-cyan-500 text-white"
                        : "bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {typingUsers.length > 0 && (
              <div className="text-[10px] text-gray-600 dark:text-cyan-300">
                {typingUsers.join(", ")} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-2.5 dark:border-gray-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-white text-gray-900 text-[11px] px-3 py-2 rounded border border-gray-300 outline-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-cyan-500"
            />
          </div>
        </div>
      )}
    </>
  );
}
