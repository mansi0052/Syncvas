import { useState } from "react";
import { motion } from "framer-motion";
import type { Tool, Color } from "@shared/types";
import { useThemeStore } from "../store/useThemeStore";

interface ToolbarProps {
  activeTool: Tool;
  strokeColor: Color;
  fillColor: Color;
  strokeWidth: number;
  strokeDash: number[];
  zoom: number;
  textInput: string;
  isVoiceActive: boolean;
  isLaserActive: boolean;
  selectedCount: number;

  onToolChange: (tool: Tool) => void;
  onColorChange: (color: Color) => void;
  onFillColorChange: (color: Color) => void;
  onWidthChange: (width: number) => void;
  onDashChange: (dash: number[]) => void;
  onTextChange: (text: string) => void;

  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;

  onZoomIn: () => void;
  onZoomOut: () => void;

  onAddSticky: () => void;
  onToggleVoice: () => void;
  onToggleLaser: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onToggleTemplate: () => void;
}

const tools: Tool[] = ["select", "pen", "eraser", "line", "rectangle", "circle", "triangle", "star", "arrow", "polygon", "text"];

const dashOptions: { label: string; value: number[] }[] = [
  { label: "Solid", value: [] },
  { label: "Dashed", value: [8, 4] },
  { label: "Dotted", value: [2, 4] },
];

export function Toolbar({
  activeTool,
  strokeColor,
  fillColor,
  strokeWidth,
  strokeDash,
  zoom,
  textInput,
  isVoiceActive,
  isLaserActive,
  selectedCount,
  onToolChange,
  onColorChange,
  onFillColorChange,
  onWidthChange,
  onDashChange,
  onTextChange,
  onClear,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onAddSticky,
  onToggleVoice,
  onToggleLaser,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onExportPNG,
  onExportPDF,
  onToggleTemplate,
}: ToolbarProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const showTextInput = activeTool === "text";
  const showFillColor = ["rectangle", "circle", "triangle", "star", "polygon"].includes(activeTool);
  const showDashOption = ["line", "rectangle", "circle", "triangle", "star", "polygon"].includes(activeTool);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-2 left-2 right-96 z-30 bg-white/10 backdrop-blur-xl rounded-2xl px-2 py-1.5 border border-white/10 flex flex-wrap gap-1.5 items-center justify-between max-h-[60px] overflow-y-auto text-[10px]"
    >
      {/* Left section - Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex gap-0.5">
            {tools.map((tool) => (
              <button
                key={tool}
                onClick={() => onToolChange(tool)}
                className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize ${
                  activeTool === tool
                    ? "bg-cyan-500 text-black"
                     : "bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
                }`}
                title={tool}
              >
                {tool === "polygon" ? "⛫" : tool === "triangle" ? "△" : tool === "star" ? "★" : tool}
              </button>
            ))}
          </div>

        {showTextInput && (
          <>
            <div className="h-6 w-px bg-white/20 mx-2" />
            <input
              type="text"
              placeholder="Enter text..."
              value={textInput}
              onChange={(e) => onTextChange(e.target.value)}
                className="bg-white/5 text-gray-900 dark:text-slate-300 text-sm px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-cyan-500 w-40 placeholder:text-gray-800/40 dark:placeholder:text-slate-500"
              autoFocus
            />
          </>
        )}
      </div>

      {/* Middle section - Styles */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-8 h-8 rounded-full border-0 cursor-pointer"
            title="Stroke Color"
          />
          {showFillColor && (
            <>
              <input
                type="color"
                value={fillColor === "transparent" ? "#ffffff" : fillColor}
                onChange={(e) => onFillColorChange(e.target.value)}
                className="w-8 h-8 rounded-full border-0 cursor-pointer"
                title="Fill Color (click empty to clear)"
                onPointerDown={(e) => {
                  if (fillColor !== "transparent") {
                    e.currentTarget.value = fillColor;
                  }
                }}
              />
              <button
                onClick={() => onFillColorChange("transparent")}
              className={`px-2 py-1 rounded text-xs ${
                 fillColor === "transparent" ? "bg-cyan-500 text-black" : "bg-white/10 text-gray-900 dark:text-slate-300"
              }`}
              >
                No Fill
              </button>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-800/60 dark:text-white/60">Width</span>
          <input
            type="range"
            min={1}
            max={20}
            value={strokeWidth}
            onChange={(e) => onWidthChange(+e.target.value)}
            className="w-20"
          />
        </div>

        {showDashOption && (
          <>
            <div className="h-6 w-px bg-white/20" />
            <select
              value={strokeDash.length > 0 ? (strokeDash[0] === 2 ? "dotted" : "dashed") : "solid"}
              onChange={(e) => {
                if (e.target.value === "solid") onDashChange([]);
                else if (e.target.value === "dashed") onDashChange([8, 4]);
                else if (e.target.value === "dotted") onDashChange([2, 4]);
              }}
               className="bg-white/10 text-gray-900 dark:text-slate-300 text-sm px-2 py-1 rounded border border-white/20"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </>
        )}
      </div>

      {/* Selection actions */}
      {selectedCount > 0 && (
        <>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-800/60 dark:text-slate-400">{selectedCount} selected</span>
            <button onClick={onDuplicate} className="px-2 py-1 rounded text-xs bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20">
              Duplicate
            </button>
            <button onClick={onBringToFront} className="px-2 py-1 rounded text-xs bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20">
              Front
            </button>
            <button onClick={onSendToBack} className="px-2 py-1 rounded text-xs bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20">
              Back
            </button>
          </div>
        </>
      )}

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-px bg-white/20" />

        <div className="flex gap-1">
          <button
            onClick={onUndo}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
          >
            ↶ Undo
          </button>
          <button
            onClick={onRedo}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
          >
            ↷ Redo
          </button>
        </div>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex gap-1">
          <button
            onClick={onAddSticky}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
          >
            📌 Sticky
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-red-500/20 hover:text-red-300"
          >
            Clear
          </button>
        </div>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex items-center gap-1">
          <button
            onClick={onExportPNG}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
          >
            📷 PNG
          </button>
          <button
            onClick={onExportPDF}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
          >
            📄 PDF
          </button>
          <button
            onClick={onToggleTemplate}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
          >
            Templates
          </button>
        </div>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="px-2 py-1 rounded-lg text-[9px] font-medium bg-white/10 text-gray-900 dark:text-slate-200 hover:bg-white/20 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            onClick={onToggleVoice}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isVoiceActive
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                 : "bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
            }`}
          >
            {isVoiceActive ? "🎤" : "🔇"}
          </button>

          <button
            onClick={onToggleLaser}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isLaserActive
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20"
            }`}
          >
            {isLaserActive ? "🔴" : "⚡"}
          </button>

          <button
            onClick={onZoomOut}
            className="w-8 h-8 rounded-lg bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20 transition-colors text-sm font-semibold"
          >
            −
          </button>
          <span className="text-xs text-gray-800/60 dark:text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="w-8 h-8 rounded-lg bg-white/10 text-gray-900 dark:text-slate-300 hover:bg-white/20 transition-colors text-sm font-semibold"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}
