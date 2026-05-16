export type Tool = "pen" | "eraser" | "rectangle" | "circle" | "arrow" | "text" | "laser" | "select" | "line" | "polygon" | "triangle" | "star";

export type Color = string;

export type StickyColor = "yellow" | "pink" | "green" | "blue" | "purple" | "violet";

export interface User {
  id: string;
  username: string;
  color: Color;
  cursorX?: number;
  cursorY?: number;
  lastSeen?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  id: string;
  userId: string;
  tool: Tool;
  points: Point[];
  color: Color;
  width: number;
  timestamp: number;
  text?: string;
  fillColor?: Color;
  strokeColor?: Color;
  strokeDash?: number[];
  smoothed?: boolean;
}

export interface StickyNote {
  id: string;
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: StickyColor;
  timestamp: number;
  markdown?: boolean;
  checklist?: { text: string; checked: boolean }[];
  reactions?: Record<string, string[]>; // emoji -> [userId]
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  mentions?: string[];
}

export interface RoomState {
  strokes: StrokeData[];
  stickies: StickyNote[];
  users: User[];
  messages: ChatMessage[];
}

export interface ClientRoomState {
  strokes: StrokeData[];
  stickies: StickyNote[];
  users: User[];
  messages: ChatMessage[];
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  strokes: StrokeData[];
  stickies: StickyNote[];
}
