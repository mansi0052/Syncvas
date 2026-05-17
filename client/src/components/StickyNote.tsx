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

const colorStyles: Record<StickyNoteType["color"], { bg: string; border: string }> = {
  yellow: { bg: "bg-yellow-100", border: "border-yellow-300" },
  pink: { bg: "bg-pink-100", border: "border-pink-300" },
  green: { bg: "bg-green-100", border: "border-green-300" },
  blue: { bg: "bg-blue-100", border: "border-blue-300" },
  purple: { bg: "bg-purple-100", border: "border-purple-300" },
  violet: { bg: "bg-purple-100", border: "border-purple-300" },
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
    <div
      className={`absolute z-10 rounded-md border ${colorStyles[note.color].bg} ${colorStyles[note.color].border} p-3 shadow-sm`}
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
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] text-gray-600">{note.color}</div>
        <div className="flex items-center gap-1">
          {showDeleteConfirm ? (
            <>
              <button
                onClick={confirmDelete}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                No
              </button>
            </>
          ) : (
            <button
              ref={deleteButtonRef}
              onClick={handleDeleteClick}
              className="text-[10px] text-gray-600 hover:text-red-600 rounded"
              title="Delete"
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
        className="mt-2 min-h-[80px] break-words rounded bg-white/80 px-2 py-1.5 text-[11px] text-gray-900 outline-none"
      >
        {note.text}
      </div>
    </div>
  );
}
