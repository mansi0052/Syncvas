import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { useSyncvasStore } from "../store/useSyncvasStore";
import type { StickyNote, StrokeData } from "@shared/types";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3001";

// Build proper Yjs WebSocket URL
const getYjsUrl = () => {
  const base = SERVER_URL.replace(/^http/, 'ws').replace(/\/$/, '');
  return `${base}/yjs`;
};

export function useYjs(
  roomId: string,
  userId: string
) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const syncToStore = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return;

    const strokes = doc.getArray<StrokeData>("strokes");
    const stickies = doc.getMap<StickyNote>("stickies");

    const store = useSyncvasStore.getState();
    store.setStrokes(strokes.toArray());
    store.setStickies(Array.from(stickies.values()));
  }, []);

   useEffect(() => {
     if (!roomId) return;

     const yjsUrl = getYjsUrl();
     console.log(`[Yjs] Connecting to ${yjsUrl} for room ${roomId}`);
     const doc = new Y.Doc();
     const provider = new WebsocketProvider(
       yjsUrl,
       roomId,
       doc
     );

     // Set up awareness for user presence
     provider.awareness.setLocalState({ user: { id: userId } });

    providerRef.current = provider;
    docRef.current = doc;

    const strokes = doc.getArray<StrokeData>("strokes");
    const stickies = doc.getMap<StickyNote>("stickies");

    const handleStrokesChange = () => {
      console.log("[Yjs] Strokes changed, syncing to store");
      syncToStore();
    };
    const handleStickiesChange = () => {
      console.log("[Yjs] Stickies changed, syncing to store");
      syncToStore();
    };

    strokes.observe(handleStrokesChange);
    stickies.observeDeep(handleStickiesChange);

    undoManagerRef.current = new Y.UndoManager([strokes, stickies]);

    const handleStatus = (event: { status: string }) => {
      console.log("[Yjs] Status:", event.status);
      useSyncvasStore.getState().setOffline(event.status !== "connected");
    };

    provider.on("status", handleStatus);
    provider.on("sync", () => {
      console.log("[Yjs] Synced");
      syncToStore();
    });

    syncToStore();

    return () => {
      strokes.unobserve(handleStrokesChange);
      stickies.unobserveDeep(handleStickiesChange);
      provider.off("status", handleStatus);
      provider.off("sync", syncToStore);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      docRef.current = null;
      undoManagerRef.current = null;
    };
  }, [roomId, syncToStore]);

  const addStroke = useCallback((stroke: StrokeData) => {
    const doc = docRef.current;
    if (!doc) return;
    doc.getArray<StrokeData>("strokes").push([stroke]);
  }, []);

  const addSticky = useCallback((sticky: StickyNote) => {
    const doc = docRef.current;
    if (!doc) return;
    doc.getMap<StickyNote>("stickies").set(sticky.id, sticky);
  }, []);

  const updateSticky = useCallback((id: string, changes: Partial<StickyNote>) => {
    const doc = docRef.current;
    if (!doc) return;
    const map = doc.getMap<StickyNote>("stickies");
    const existing = map.get(id);
    if (!existing) return;
    map.set(id, { ...existing, ...changes });
  }, []);

  const deleteSticky = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    doc.getMap<StickyNote>("stickies").delete(id);
  }, []);

  const deleteStroke = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const strokes = doc.getArray<StrokeData>("strokes");
    const arr = strokes.toArray();
    const index = arr.findIndex((s) => s.id === id);
    if (index !== -1) strokes.delete(index, 1);
  }, []);

  const moveStrokeToFront = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const strokes = doc.getArray<StrokeData>("strokes");
    const arr = strokes.toArray();
    const index = arr.findIndex((s) => s.id === id);
    if (index !== -1 && index !== arr.length - 1) {
      const [stroke] = strokes.slice(index, index + 1);
      strokes.delete(index, 1);
      strokes.push([stroke]);
    }
  }, []);

  const moveStrokeToBack = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const strokes = doc.getArray<StrokeData>("strokes");
    const arr = strokes.toArray();
    const index = arr.findIndex((s) => s.id === id);
    if (index > 0) {
      const [stroke] = strokes.slice(index, index + 1);
      strokes.delete(index, 1);
      strokes.insert(0, [stroke]);
    }
  }, []);

  const moveStickyToFront = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const stickies = doc.getMap<StickyNote>("stickies");
    const sticky = stickies.get(id);
    if (sticky) {
      stickies.delete(id);
      stickies.set(id, sticky); // re-insert at end (Map preserves insertion order)
    }
  }, []);

  const moveStickyToBack = useCallback((id: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const stickies = doc.getMap<StickyNote>("stickies");
    const sticky = stickies.get(id);
    if (sticky) {
      const all = Array.from(stickies.entries());
      const filtered = all.filter(([k]) => k !== id);
      stickies.clear();
      // Put the target first (back)
      stickies.set(id, sticky);
      for (const [k, v] of filtered) {
        stickies.set(k, v);
      }
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return;
    const strokes = doc.getArray<StrokeData>("strokes");
    strokes.delete(0, strokes.length);
  }, []);

  const undo = useCallback(() => {
    undoManagerRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    undoManagerRef.current?.redo();
  }, []);

  return {
    addStroke,
    addSticky,
    updateSticky,
    deleteSticky,
    deleteStroke,
    clearCanvas,
    undo,
    redo,
    moveStrokeToFront,
    moveStrokeToBack,
    moveStickyToFront,
    moveStickyToBack,
  };
}
