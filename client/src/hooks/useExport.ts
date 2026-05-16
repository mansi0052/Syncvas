import { useCallback, useRef } from "react";
import { useSyncvasStore } from "../store/useSyncvasStore";
import type { StrokeData, StickyNote } from "@shared/types";

export function useExport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { strokes, stickies, zoom, offsetX, offsetY } = useSyncvasStore();

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Calculate bounds of all content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((stroke) => {
      stroke.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });
    stickies.forEach((sticky) => {
      minX = Math.min(minX, sticky.x);
      minY = Math.min(minY, sticky.y);
      maxX = Math.max(maxX, sticky.x + sticky.width);
      maxY = Math.max(maxY, sticky.y + sticky.height);
    });

    const padding = 50;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    tempCanvas.width = width * 2; // Retina
    tempCanvas.height = height * 2;
    ctx.scale(2, 2);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Translate content to centered position
    ctx.translate(padding - minX, padding - minY);

    // Draw strokes
    strokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.strokeDash && stroke.strokeDash.length > 0) {
        ctx.setLineDash(stroke.strokeDash);
      }

      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw stickies
    stickies.forEach((sticky) => {
      ctx.fillStyle = sticky.color === "yellow" ? "#fef3c7" :
                     sticky.color === "pink" ? "#fbcfe8" :
                     sticky.color === "green" ? "#bbf7d0" :
                     sticky.color === "blue" ? "#bfdbfe" :
                     sticky.color === "purple" ? "#e9d5ff" : "#fef3c7";
      ctx.fillRect(sticky.x, sticky.y, sticky.width, sticky.height);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sticky.x, sticky.y, sticky.width, sticky.height);

      ctx.fillStyle = "#000";
      ctx.font = "14px sans-serif";
      const lines = sticky.text.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, sticky.x + 8, sticky.y + 20 + i * 18);
      });
    });

    // Download
    const link = document.createElement("a");
    link.download = `syncvas-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [strokes, stickies]);

  const exportPDF = useCallback(async () => {
    // Dynamic import to avoid bundling
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("l", "mm", "a4");

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((stroke) => {
      stroke.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });
    stickies.forEach((sticky) => {
      minX = Math.min(minX, sticky.x);
      minY = Math.min(minY, sticky.y);
      maxX = Math.max(maxX, sticky.x + sticky.width);
      maxY = Math.max(maxY, sticky.y + sticky.height);
    });

    const contentWidth = maxX - minX + 100;
    const contentHeight = maxY - minY + 100;

    // Fit to page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const scale = Math.min(pageWidth / contentWidth, pageHeight / contentHeight, 1);

    const offsetX = (pageWidth - contentWidth * scale) / 2 - minX * scale;
    const offsetY = (pageHeight - contentHeight * scale) / 2 - minY * scale;

    pdf.setFontSize(10);

    // Draw strokes
    strokes.forEach((stroke) => {
      pdf.setLineWidth(stroke.width * 0.5);
      pdf.setDrawColor(stroke.color);
      if (stroke.strokeDash && stroke.strokeDash.length > 0) {
        pdf.setLineDashPattern(stroke.strokeDash.map((d) => d * 0.5), 0);
      } else {
        pdf.setLineDashPattern([], 0);
      }

      if (stroke.points.length > 0) {
        pdf.line(
          offsetX + stroke.points[0].x * scale,
          offsetY + stroke.points[0].y * scale,
          offsetX + stroke.points[1].x * scale,
          offsetY + stroke.points[1].y * scale
        );
        for (let i = 2; i < stroke.points.length; i++) {
          pdf.line(
            offsetX + stroke.points[i - 1].x * scale,
            offsetY + stroke.points[i - 1].y * scale,
            offsetX + stroke.points[i].x * scale,
            offsetY + stroke.points[i].y * scale
          );
        }
      }
    });

    pdf.save(`syncvas-${Date.now()}.pdf`);
  }, [strokes, stickies]);

  return {
    registerCanvas,
    exportPNG,
    exportPDF,
  };
}
