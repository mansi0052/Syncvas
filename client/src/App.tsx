import { useEffect, useMemo, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";

import { useSocket } from "./hooks/useSocket";
import { useYjs } from "./hooks/useYjs";
import { useCanvas } from "./hooks/useCanvas";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useLaser } from "./hooks/useLaser";
import { useExport } from "./hooks/useExport";
import { useSyncvasStore } from "./store/useSyncvasStore";
import { useVoiceStore } from "./store/useVoiceStore";
import { loadTemplate, templates } from "./utils/templates";

import { UserPresence } from "./components/UserPresence";
import { Toolbar } from "./components/Toolbar";
import { ChatPanel } from "./components/ChatPanel";
import { StickyNote as StickyNoteComponent } from "./components/StickyNote";
import { CursorOverlay } from "./components/CursorOverlay";
import { VoicePanel } from "./components/VoicePanel";
import { LaserOverlay } from "./components/LaserOverlay";
import { Minimap } from "./components/Minimap";
import type { StrokeData, StickyNote, User } from "@shared/types";

function HomePage() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "create") {
      setRoomId(crypto.randomUUID().slice(0, 8));
    } else {
      setRoomId("");
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const userId = crypto.randomUUID();
    const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const finalRoomId = mode === "create" ? roomId : roomId.trim();

    if (mode === "join" && !finalRoomId) return;

    navigate(`/room/${finalRoomId}?user=${encodeURIComponent(username)}&id=${userId}&color=${color}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Syncvas
          </h1>
          <p className="text-gray-800/60 dark:text-white/60">Real-time collaborative whiteboard</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
               mode === "create"
                 ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                 : "bg-white/10 text-gray-900 dark:text-slate-300 border border-white/10 hover:bg-white/20"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
               mode === "join"
                 ? "bg-violet-500 text-black shadow-lg shadow-violet-500/30"
                 : "bg-white/10 text-gray-900 dark:text-slate-300 border border-white/10 hover:bg-white/20"
             }`}
          >
            Join Room
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 border border-white/10 backdrop-blur-xl p-8 rounded-3xl space-y-5">
          <div>
            <label className="block text-sm text-gray-900/70 dark:text-slate-400 mb-2">Display Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
               className="w-full bg-white/10 text-gray-900 dark:text-slate-300 px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-800/40 dark:placeholder:text-slate-500"
              maxLength={20}
            />
          </div>

          {mode === "join" && (
            <div>
            <label className="block text-sm text-gray-900/70 dark:text-slate-400 mb-2">Room ID</label>
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-white/10 text-gray-900 dark:text-slate-300 px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-cyan-500 transition-colors font-mono placeholder:text-gray-800/40 dark:placeholder:text-slate-500"
              />
            </div>
          )}

          {mode === "create" && (
            <div className="p-4 bg-white/10 rounded-xl border border-white/10">
               <div className="text-sm text-gray-900/60 dark:text-slate-400 mb-1">Your room will be</div>
              <div className="text-lg font-mono text-cyan-400">
                {roomId || "(generating…)"}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={mode === "join" ? !roomId.trim() : !username.trim()}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              mode === "create"
                ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-black hover:from-cyan-400 hover:to-violet-400"
                : "bg-gradient-to-r from-violet-500 to-pink-500 text-black hover:from-violet-400 hover:to-pink-400"
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          >
            {mode === "create" ? "Create & Join Room" : "Join Room"}
          </button>
        </form>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-gray-900/60 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">●</span> Multiplayer drawing
          </div>
          <div className="flex items-center gap-2">
            <span className="text-violet-400">●</span> Sticky notes
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400">●</span> Live chat
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">●</span> Real-time sync
          </div>
        </div>
      </div>
    </div>
  );
}

function Canvas() {
  const params = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get("id") || "";
  const username = decodeURIComponent(searchParams.get("user") || "Anonymous");
  const color = searchParams.get("color") || "#00e5ff";
  const roomId = params.roomId || "";

  const store = useSyncvasStore();
  const voiceStore = useVoiceStore();
  const [textInput, setTextInput] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const { clearCanvas: yjsClearCanvas, addStroke, addSticky, updateSticky: updateYjsSticky, deleteSticky: deleteYjsSticky, deleteStroke, moveStrokeToFront, moveStrokeToBack, moveStickyToFront, moveStickyToBack, undo, redo } = useYjs(roomId, userId);
  const { registerCanvas, exportPNG, exportPDF } = useExport();

  const { joinRoom, leaveRoom, sendStroke, sendCursor, sendSticky, updateSticky, deleteSticky, sendChatMessage, requestClearCanvas, sendTyping, onTyping, offTyping } = useSocket({
    onCanvasCleared: () => {
      yjsClearCanvas();
    },
  });

  useEffect(() => {
    const handleTyping = (name: string) => {
      console.log(`${name} is typing`);
    };
    onTyping(handleTyping);
    return () => offTyping();
  }, [onTyping, offTyping]);

  const { startVoice, stopVoice, toggleMute, togglePushToTalk, error: voiceError } = useVoiceChat({
    roomId,
    userId,
    username,
  });

  const { startLaser, moveLaser, endLaser } = useLaser({
    roomId,
    userId,
    isActive: store.isLaserActive,
  });

  const {
    strokes,
    stickies,
    messages,
    users,
    activeTool,
    strokeColor,
    fillColor,
    strokeWidth,
    strokeDash,
    zoom,
    offsetX,
    offsetY,
    chatOpen,
    unreadCount,
    toast,
    isLaserActive,
    selectedIds,
  } = store;

  const handleSelectAll = () => {
    const allIds: string[] = [...strokes.map((s) => s.id), ...stickies.map((s) => s.id)];
    store.setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    store.setSelectedIds([]);
    store.setSelectionBounds(null);
  };

  const handleDuplicate = () => {
    store.duplicateSelected();
  };

  const handleBringToFront = () => {
    selectedIds.forEach((id) => {
      const stroke = strokes.find((s) => s.id === id);
      const sticky = stickies.find((s) => s.id === id);
      if (stroke) moveStrokeToFront(id);
      if (sticky) moveStickyToFront(id);
    });
  };

  const handleSendToBack = () => {
    selectedIds.forEach((id) => {
      const stroke = strokes.find((s) => s.id === id);
      const sticky = stickies.find((s) => s.id === id);
      if (stroke) moveStrokeToBack(id);
      if (sticky) moveStickyToBack(id);
    });
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => {
      const stroke = strokes.find((s) => s.id === id);
      const sticky = stickies.find((s) => s.id === id);
      if (stroke) {
        deleteStroke(id);
      }
      if (sticky) {
        deleteYjsSticky(id);
      }
    });
    store.setSelectedIds([]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
      handleDeleteSelected();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      handleSelectAll();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      handleDuplicate();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, strokes, stickies]);

  useEffect(() => {
    console.log(`[App] Setting up room: ${roomId}, user: ${username} (${userId})`);
    store.setRoomMeta(roomId, userId, username, color);
    joinRoom(roomId, userId, username, color);

    // Auto-start voice when joining
    setIsVoiceActive(true);
    startVoice();

    return () => {
      console.log(`[App] Leaving room: ${roomId}`);
      stopVoice();
      leaveRoom(roomId, userId);
      store.resetRoomState();
      voiceStore.reset();
    };
  }, [roomId, userId, username, color]);

  const handleStrokeComplete = (stroke: StrokeData) => {
    addStroke(stroke);
    if (activeTool === "text") {
      setTextInput("");
    }
  };

  const handlePan = (x: number, y: number) => {
    store.setOffset(x, y);
  };

  const handleZoom = (newZoom: number) => {
    store.setZoom(newZoom);
  };

  const handleClear = () => {
    yjsClearCanvas();
    requestClearCanvas(roomId);
  };

  const handleAddSticky = () => {
    const centerX = -offsetX / zoom + (window.innerWidth / 2) / zoom;
    const centerY = -offsetY / zoom + (window.innerHeight / 2) / zoom;
    const sticky: StickyNote = {
      id: crypto.randomUUID(),
      userId,
      x: centerX - 100,
      y: centerY - 75,
      width: 200,
      height: 150,
      text: "New note",
      color: ["yellow", "pink", "green", "blue", "purple", "violet"][Math.floor(Math.random() * 6)] as any,
      timestamp: Date.now(),
    };
    addSticky(sticky);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = loadTemplate(templateId);
    if (!template) return;

    template.strokes.forEach((stroke) => {
      stroke.userId = userId;
      stroke.id = crypto.randomUUID();
      addStroke(stroke);
    });
    template.stickies.forEach((sticky) => {
      sticky.userId = userId;
      sticky.id = crypto.randomUUID();
      addSticky(sticky);
    });

    setTemplateMenuOpen(false);
  };

  const toggleLaser = () => {
    store.setLaserActive(!store.isLaserActive);
  };

  const toggleVoiceRoom = () => {
    if (isVoiceActive) {
      stopVoice();
      setIsVoiceActive(false);
    } else {
      startVoice();
      setIsVoiceActive(true);
    }
  };

  const handleCursorMove = (x: number, y: number) => {
    sendCursor(roomId, userId, x, y);
  };

  const { canvasRef, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel } = useCanvas({
    strokes,
    stickies,
    activeTool,
    strokeColor,
    fillColor,
    strokeWidth,
    strokeDash,
    zoom,
    offsetX,
    offsetY,
    textInput,
    isLaserActive: store.isLaserActive,
    onStrokeComplete: handleStrokeComplete,
    onPan: handlePan,
    onZoom: handleZoom,
    onLaserStart: startLaser,
    onLaserMove: moveLaser,
    onLaserEnd: endLaser,
    selectedIds: selectedIds,
    onSelect: store.setSelectedIds,
    moveSelected: store.moveSelected,
  });

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <UserPresence users={users} roomId={roomId} />

      <canvas
        ref={(canvas) => {
          canvasRef.current = canvas;
          registerCanvas(canvas);
        }}
        className="absolute inset-0 w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      <CursorOverlay users={users} />

      <LaserOverlay users={users} currentUserId={userId} />

      {stickies.map((note) => (
        <StickyNoteComponent
          key={note.id}
          note={note}
          scale={zoom}
          onDrag={(id: string, x: number, y: number) => {
            updateYjsSticky(id, { x, y });
            updateSticky(roomId, id, { x, y });
          }}
          onUpdate={(id: string, changes: Partial<StickyNote>) => {
            updateYjsSticky(id, changes);
            updateSticky(roomId, id, changes);
          }}
          onDelete={(id: string) => {
            deleteYjsSticky(id);
            deleteSticky(roomId, id);
          }}
        />
      ))}

      <Toolbar
        activeTool={activeTool}
        strokeColor={strokeColor}
        fillColor={fillColor}
        strokeWidth={strokeWidth}
        strokeDash={strokeDash}
        zoom={zoom}
        textInput={textInput}
        isVoiceActive={isVoiceActive}
        isLaserActive={store.isLaserActive}
        selectedCount={selectedIds.length}
        onToolChange={(tool) => {
          store.setTool(tool);
          if (tool !== "select") {
            store.setSelectedIds([]);
            store.setSelectionBounds(null);
          }
        }}
        onColorChange={(color) => store.setStrokeColor(color)}
        onFillColorChange={(color) => store.setFillColor(color)}
        onWidthChange={(width) => store.setStrokeWidth(width)}
        onDashChange={(dash) => store.setStrokeDash(dash)}
        onTextChange={setTextInput}
        onClear={handleClear}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => store.setZoom(Math.min(5, zoom + 0.1))}
        onZoomOut={() => store.setZoom(Math.max(0.2, zoom - 0.1))}
        onAddSticky={handleAddSticky}
        onToggleVoice={toggleVoiceRoom}
        onToggleLaser={toggleLaser}
        onBringToFront={() => handleBringToFront()}
        onSendToBack={() => handleSendToBack()}
        onDuplicate={handleDuplicate}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
        onToggleTemplate={() => setTemplateMenuOpen(!templateMenuOpen)}
      />

      {/* Template picker modal */}
      {templateMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setTemplateMenuOpen(false)}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gray-900 dark:text-slate-200 text-lg font-semibold mb-4">Choose Template</h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <span className="text-3xl">{t.thumbnail}</span>
                  <span className="text-gray-900 dark:text-slate-300 text-sm">{t.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setTemplateMenuOpen(false)}
               className="mt-4 w-full py-2 rounded-lg bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ChatPanel
        open={chatOpen}
        messages={messages}
        currentUserId={userId}
        currentUsername={username}
        onToggle={() => store.setChatOpen(!chatOpen)}
        onSend={(msg) => sendChatMessage(roomId, msg)}
         unreadCount={unreadCount}
       />

       <VoicePanel
         users={users}
         isVoiceActive={isVoiceActive}
         onToggleMute={toggleMute}
         onTogglePushToTalk={togglePushToTalk}
         onStartVoice={startVoice}
         onStopVoice={() => {
           stopVoice();
           setIsVoiceActive(false);
         }}
       />

       <Minimap />

       {toast && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl px-6 py-4 rounded-2xl text-gray-900 dark:text-slate-200 border border-white/10">
           {toast}
         </div>
       )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<Canvas />} />
    </Routes>
  );
}
