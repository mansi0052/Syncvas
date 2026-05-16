import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { PointerEvent, FocusEvent } from "react";
import type { StickyNote as StickyNoteType } from "@shared/types";

interface StickyNoteProps {
  note: StickyNoteType;
  scale?: number;
  onDrag: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, changes: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
}

const colorStyles: Record<StickyNoteType["color"], string> = {
  yellow: "from-yellow-200 to-yellow-100 border-yellow-300",
  pink: "from-pink-200 to-pink-100 border-pink-300",
  green: "from-emerald-200 to-emerald-100 border-emerald-300",
  blue: "from-sky-200 to-sky-100 border-sky-300",
  purple: "from-violet-200 to-violet-100 border-violet-300",
  violet: "from-violet-200 to-violet-100 border-violet-300",
};

export function StickyNote({ note, scale = 1, onDrag, onUpdate, onDelete }: StickyNoteProps) {
  const [dragging, setDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const rotation = `${(note.id.charCodeAt(0) % 7) - 3}deg`;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (showDeleteConfirm) return;
    if (event.target instanceof Element && deleteButtonRef.current?.contains(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    positionRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const deltaX = event.clientX - positionRef.current.x;
    const deltaY = event.clientY - positionRef.current.y;
    positionRef.current = { x: event.clientX, y: event.clientY };
    onDrag(note.id, note.x + deltaX / scale, note.y + deltaY / scale);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onUpdate(note.id, { text: event.currentTarget.textContent || note.text });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(note.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute z-10 rounded-3xl border bg-gradient-to-br ${colorStyles[note.color]} p-4 shadow-lg`}
      style={{
        left: note.x * scale,
        top: note.y * scale,
        width: note.width * scale,
        height: note.height * scale,
        transform: `rotate(${rotation})`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
          {note.color}
        </div>
        <div className="flex items-center gap-1">
          {showDeleteConfirm ? (
            <>
              <button
                onClick={confirmDelete}
                className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="text-xs px-2 py-0.5 rounded bg-white/20 text-slate-700 hover:bg-white/30 transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              ref={deleteButtonRef}
              onClick={handleDeleteClick}
              className="text-sm text-slate-700 transition-colors hover:text-red-600 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
              title="Delete sticky note"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        className="mt-3 min-h-[100px] break-words whitespace-pre-wrap rounded-3xl bg-white/70 px-3 py-3 text-sm font-caveat text-slate-900 outline-none"
      >
        {note.text}
      </div>
    </motion.div>
  );
}
