import { useState } from "react";
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
    <div className="fixed bottom-3 left-3 right-96 z-30 bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-200 dark:border-gray-700 flex flex-wrap gap-1 items-center text-[10px] shadow-sm">
      {/* Left section - Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex gap-0.5">
            {tools.map((tool) => (
              <button
                key={tool}
                onClick={() => onToolChange(tool)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                  activeTool === tool
                    ? "bg-cyan-500 text-black"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={tool}
              >
                {tool === "polygon" ? "⛫" : tool === "triangle" ? "△" : tool === "star" ? "★" : tool}
              </button>
            ))}
          </div>

        {showTextInput && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1.5" />
            <input
              type="text"
              placeholder="Enter text..."
              value={textInput}
              onChange={(e) => onTextChange(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 w-36 placeholder:text-gray-500"
              autoFocus
            />
          </>
        )}
      </div>

{/* Middle section - Styles */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer"
            title="Stroke Color"
          />
          {showFillColor && (
            <>
              <input
                type="color"
                value={fillColor === "transparent" ? "#ffffff" : fillColor}
                onChange={(e) => onFillColorChange(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
                title="Fill Color"
                onPointerDown={(e) => {
                  if (fillColor !== "transparent") {
                    e.currentTarget.value = fillColor;
                  }
                }}
              />
              <button
                onClick={() => onFillColorChange("transparent")}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                 fillColor === "transparent" ? "bg-cyan-500 text-black" : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
              }`}
              >
                No Fill
              </button>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600 dark:text-gray-400">W</span>
          <input
            type="range"
            min={1}
            max={20}
            value={strokeWidth}
            onChange={(e) => onWidthChange(+e.target.value)}
            className="w-16"
          />
        </div>

        {showDashOption && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <select
              value={strokeDash.length > 0 ? (strokeDash[0] === 2 ? "dotted" : "dashed") : "solid"}
              onChange={(e) => {
                if (e.target.value === "solid") onDashChange([]);
                else if (e.target.value === "dashed") onDashChange([8, 4]);
                else if (e.target.value === "dotted") onDashChange([2, 4]);
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-[10px] px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600"
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
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{selectedCount}</span>
            <button onClick={onDuplicate} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
              Dup
            </button>
            <button onClick={onBringToFront} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
              Front
            </button>
            <button onClick={onSendToBack} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
              Back
            </button>
          </div>
        </>
      )}

      {/* Right section - Actions */}
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex gap-0.5">
          <button
            onClick={onUndo}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            ↷
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex gap-0.5">
          <button
            onClick={onAddSticky}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
          >
            📌
          </button>
          <button
            onClick={onClear}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-800 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={onExportPNG}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            PNG
          </button>
          <button
            onClick={onExportPDF}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            PDF
          </button>
          <button
            onClick={onToggleTemplate}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50"
          >
            ⛏
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="px-1 py-0.5 rounded text-[9px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            onClick={onToggleVoice}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              isVoiceActive
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            }`}
          >
            {isVoiceActive ? "🎤" : "🔇"}
          </button>

          <button
            onClick={onToggleLaser}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              isLaserActive
                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            }`}
          >
            {isLaserActive ? "🔴" : "⚡"}
          </button>

          <button
            onClick={onZoomOut}
            className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-xs font-semibold"
          >
            −
          </button>
          <span className="text-[10px] text-gray-600 dark:text-gray-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-xs font-semibold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
