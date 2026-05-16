import type { RoomState, User, StrokeData, StickyNote, ChatMessage } from "../../shared/types";

const rooms = new Map<string, RoomState>();

export function createRoom(roomId: string): RoomState {
  const room: RoomState = {
    strokes: [],
    stickies: [],
    users: [],
    messages: [],
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): RoomState {
  const room = rooms.get(roomId);
  return room ?? createRoom(roomId);
}

export function addUser(roomId: string, user: User): RoomState {
  const room = getRoom(roomId);
  room.users = room.users.filter((u) => u.id !== user.id);
  room.users.push(user);
  return room;
}

export function removeUser(roomId: string, userId: string): RoomState {
  const room = getRoom(roomId);
  room.users = room.users.filter((user) => user.id !== userId);
  return room;
}

export function addStroke(roomId: string, stroke: StrokeData): RoomState {
  const room = getRoom(roomId);
  room.strokes = room.strokes.filter((s) => s.id !== stroke.id);
  room.strokes.push(stroke);
  return room;
}

export function addSticky(roomId: string, sticky: StickyNote): RoomState {
  const room = getRoom(roomId);
  room.stickies = room.stickies.filter((s) => s.id !== sticky.id);
  room.stickies.push(sticky);
  return room;
}

export function updateSticky(roomId: string, stickyId: string, changes: Partial<StickyNote>): RoomState {
  const room = getRoom(roomId);
  room.stickies = room.stickies.map((sticky) =>
    sticky.id === stickyId ? { ...sticky, ...changes } : sticky
  );
  return room;
}

export function deleteSticky(roomId: string, stickyId: string): RoomState {
  const room = getRoom(roomId);
  room.stickies = room.stickies.filter((sticky) => sticky.id !== stickyId);
  return room;
}

export function addMessage(roomId: string, message: ChatMessage): RoomState {
  const room = getRoom(roomId);
  room.messages.push(message);
  return room;
}

export function clearStrokes(roomId: string): RoomState {
  const room = getRoom(roomId);
  room.strokes = [];
  return room;
}
