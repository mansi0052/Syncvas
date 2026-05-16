import { useCallback, useEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import type { Point, StrokeData, StickyNote } from "@shared/types";

interface UseCanvasProps {
  strokes: StrokeData[];
  stickies: StickyNote[];
  activeTool: StrokeData["tool"];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeDash: number[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  textInput: string;
  isLaserActive: boolean;
  onStrokeComplete: (stroke: StrokeData) => void;
  onPan: (x: number, y: number) => void;
  onZoom: (zoom: number) => void;
  onLaserStart?: (x: number, y: number) => void;
  onLaserMove?: (x: number, y: number) => void;
  onLaserEnd?: () => void;
  // Selection
  selectedIds: string[];
  onSelect: (ids: string[], addToExisting?: boolean) => void;
  moveSelected: (dx: number, dy: number) => void;
}

function toCanvasPoint(
  event: PointerEvent,
  element: HTMLCanvasElement,
  zoom: number,
  offsetX: number,
  offsetY: number
): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - offsetX) / zoom,
    y: (event.clientY - rect.top - offsetY) / zoom,
  };
}

function hitTestSticky(point: Point, sticky: StickyNote): boolean {
  return (
    point.x >= sticky.x &&
    point.x <= sticky.x + sticky.width &&
    point.y >= sticky.y &&
    point.y <= sticky.y + sticky.height
  );
}

function hitTestStroke(point: Point, stroke: StrokeData, threshold: number = 10): boolean {
  const pts = stroke.points;
  if (pts.length < 2) return false;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dist = distancePointToSegment(point, p1, p2);
    if (dist <= threshold + stroke.width / 2) return true;
  }
  return false;
}

function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = a.x; yy = a.y;
  } else if (param > 1) {
    xx = b.x; yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Douglas-Peucker line simplification for smoothing
function simplifyPoints(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const closest = { x: lineStart.x + u * dx, y: lineStart.y + u * dy };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stroke: StrokeData
) {
  const roughCanvas = rough.canvas(canvas);
  const points = stroke.points;
  if (!points.length) return;

  const start = points[0];
  const end = points[points.length - 1];

  const strokeStyle = stroke.strokeColor || stroke.color;
  const fillStyle = stroke.fillColor || "transparent";

  switch (stroke.tool) {
    case "pen":
    case "eraser": {
      const path = points.map((p) => `${p.x},${p.y}`).join(" ");
      roughCanvas.path(`M ${path}`, {
        stroke: stroke.tool === "eraser" ? "#080d14" : stroke.color,
        strokeWidth: stroke.width,
        roughness: 1.5,
      });
      break;
    }

    case "line": {
      roughCanvas.line(start.x, start.y, end.x, end.y, {
        stroke: strokeStyle,
        strokeWidth: stroke.width,
      });
      break;
    }

    case "polygon": {
      const pts = points;
      if (pts.length < 3) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      } else {
        const path = "M " + pts.map((p) => `${p.x},${p.y}`).join(" L") + " Z";
        roughCanvas.path(path, {
          stroke: strokeStyle,
          fill: fillStyle,
          strokeWidth: stroke.width,
          fillStyle: fillStyle !== "transparent" ? fillStyle : undefined,
        });
      }
      break;
    }

    case "rectangle": {
      roughCanvas.rectangle(start.x, start.y, end.x - start.x, end.y - start.y, {
        stroke: strokeStyle,
        fill: fillStyle,
        strokeWidth: stroke.width,
        fillStyle: fillStyle !== "transparent" ? fillStyle : undefined,
      });
      break;
    }

    case "circle": {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      roughCanvas.circle(start.x, start.y, radius * 2, {
        stroke: strokeStyle,
        fill: fillStyle,
        strokeWidth: stroke.width,
        fillStyle: fillStyle !== "transparent" ? fillStyle : undefined,
      });
      break;
    }



    case "triangle": {
      const midX = (start.x + end.x) / 2;
      const pointsTri = [
        { x: midX, y: start.y },
        { x: end.x, y: end.y },
        { x: start.x, y: end.y },
      ];
      const path = "M " + pointsTri.map((p) => `${p.x},${p.y}`).join(" L") + " Z";
      roughCanvas.path(path, {
        stroke: strokeStyle,
        fill: fillStyle,
        strokeWidth: stroke.width,
        fillStyle: fillStyle !== "transparent" ? fillStyle : undefined,
      });
      break;
    }

    case "star": {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const outerRadius = Math.hypot(end.x - cx, end.y - cy);
      const innerRadius = outerRadius * 0.4;
      const spikes = 5;
      const starPoints: Point[] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        starPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
      }
      const path = "M " + starPoints.map((p) => `${p.x},${p.y}`).join(" L") + " Z";
      roughCanvas.path(path, {
        stroke: strokeStyle,
        fill: fillStyle,
        strokeWidth: stroke.width,
        fillStyle: fillStyle !== "transparent" ? fillStyle : undefined,
      });
      break;
    }

    case "arrow": {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLength = Math.min(20, stroke.width * 4 + 8);
      const endX = end.x;
      const endY = end.y;

      roughCanvas.line(start.x, start.y, endX, endY, {
        stroke: strokeStyle,
        strokeWidth: stroke.width,
      });

      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-headLength, -headLength / 2);
      ctx.lineTo(-headLength, headLength / 2);
      ctx.closePath();
      ctx.fillStyle = strokeStyle;
      ctx.fill();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "text": {
      ctx.save();
      ctx.fillStyle = stroke.color;
      ctx.font = "18px sans-serif";
      ctx.fillText(stroke.text || "Text", start.x, start.y);
      ctx.restore();
      break;
    }
  }
}

export function useCanvas(props: UseCanvasProps) {
  const {
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
    isLaserActive,
    onStrokeComplete,
    onPan,
    onZoom,
    onLaserStart,
    onLaserMove,
    onLaserEnd,
    selectedIds,
    onSelect,
    moveSelected,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<StrokeData | null>(null);
  const rafRef = useRef<number | null>(null);
  const [panning, setPanning] = useState(false);
  const [draggingSelection, setDraggingSelection] = useState(false);
  const dragStart = useRef<Point | null>(null);
  const initialPositions = useRef<Map<string, Point>>(new Map());
  const polygonPoints = useRef<Point[]>([]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * scale;
    canvas.height = canvas.clientHeight * scale;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    if (strokeDash.length > 0) {
      ctx.setLineDash(strokeDash);
    } else {
      ctx.setLineDash([]);
    }

    strokes.forEach((stroke) => drawStroke(ctx, canvas, stroke));

    if (drawingRef.current) {
      drawStroke(ctx, canvas, drawingRef.current);
    }

    // Draw polygon preview
    if (activeTool === "polygon" && polygonPoints.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(polygonPoints.current[0].x, polygonPoints.current[0].y);
      for (let i = 1; i < polygonPoints.current.length; i++) {
        ctx.lineTo(polygonPoints.current[i].x, polygonPoints.current[i].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }

    ctx.restore();
  }, [strokes, zoom, offsetX, offsetY, activeTool, strokeColor, fillColor, strokeWidth, strokeDash]);

  useEffect(() => {
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  const createStroke = useCallback((point: Point): StrokeData => {
    const stroke: StrokeData = {
      id: crypto.randomUUID(),
      userId: "local",
      tool: activeTool,
      points: [point],
      color: activeTool === "eraser" ? "#080d14" : strokeColor,
      width: strokeWidth,
      timestamp: Date.now(),
      strokeColor,
      fillColor,
      strokeDash: strokeDash.length > 0 ? strokeDash : undefined,
    };
    if (activeTool === "text" && textInput) {
      stroke.text = textInput;
    }
    return stroke;
  }, [activeTool, strokeColor, fillColor, strokeWidth, strokeDash, textInput]);

  const handlePointerDown = useCallback((
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);

    const point = toCanvasPoint(e.nativeEvent, canvas, zoom, offsetX, offsetY);

    if (e.button === 1 || e.shiftKey) {
      setPanning(true);
      return;
    }

    if (isLaserActive) {
      onLaserStart?.(point.x, point.y);
      return;
    }

    if (activeTool === "select") {
      // Find clicked object (topmost first)
      const clickedIds: string[] = [];

      // Check stickies (top layer)
      for (let i = stickies.length - 1; i >= 0; i--) {
        const sticky = stickies[i];
        if (hitTestSticky(point, sticky)) {
          clickedIds.push(sticky.id);
          break; // Only topmost sticky
        }
      }

      // If no sticky, check strokes
      if (clickedIds.length === 0) {
        for (let i = strokes.length - 1; i >= 0; i--) {
          const stroke = strokes[i];
          if (hitTestStroke(point, stroke)) {
            clickedIds.push(stroke.id);
            break; // Only topmost stroke
          }
        }
      }

      if (clickedIds.length > 0) {
        const addToSelection = e.ctrlKey || e.metaKey;
        if (addToSelection) {
          // Toggle selection
          const newSelection = [...selectedIds];
          const id = clickedIds[0];
          if (newSelection.includes(id)) {
            newSelection.splice(newSelection.indexOf(id), 1);
          } else {
            newSelection.push(id);
          }
          onSelect(newSelection, true);
        } else {
          onSelect(clickedIds, false);
        }

        // Start dragging
        setDraggingSelection(true);
        dragStart.current = point;
        initialPositions.current.clear();
        selectedIds.forEach((id) => {
          const stroke = strokes.find((s) => s.id === id);
          const sticky = stickies.find((s) => s.id === id);
          if (stroke) {
            initialPositions.current.set(id, { x: stroke.points[0]?.x || 0, y: stroke.points[0]?.y || 0 });
          } else if (sticky) {
            initialPositions.current.set(id, { x: sticky.x, y: sticky.y });
          }
        });
        return;
       } else {
         // Click on empty space - deselect
         if (!e.ctrlKey && !e.metaKey) {
           onSelect([], false);
         }
         return; // Deselected, don't draw
       }
      }

      if (activeTool === "polygon") {
       polygonPoints.current.push(point);
       // If we have at least 3 points, check if close to start to close
       if (polygonPoints.current.length >= 3) {
         const first = polygonPoints.current[0];
         const dist = Math.hypot(point.x - first.x, point.y - first.y);
         if (dist < 15) {
           drawingRef.current = {
             id: crypto.randomUUID(),
             userId: "local",
             tool: "polygon",
             points: [...polygonPoints.current],
             color: strokeColor,
             width: strokeWidth,
             timestamp: Date.now(),
             strokeColor,
             fillColor,
             strokeDash: strokeDash.length > 0 ? strokeDash : undefined,
           };
           polygonPoints.current = [];
         }
       }
       return;
     }

     // For all other tools, start a new stroke
     drawingRef.current = createStroke(point);
   }, [activeTool, zoom, offsetX, offsetY, isLaserActive, onLaserStart, stickies, strokes, selectedIds, onSelect, createStroke]);

  const handlePointerMove = useCallback((
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = toCanvasPoint(e.nativeEvent, canvas, zoom, offsetX, offsetY);

    if (panning) {
      onPan(offsetX + e.movementX, offsetY + e.movementY);
      return;
    }

    if (draggingSelection) {
      const dx = point.x - (dragStart.current?.x || 0);
      const dy = point.y - (dragStart.current?.y || 0);
      moveSelected(dx, dy);
      return;
    }

    if (isLaserActive) {
      onLaserMove?.(point.x, point.y);
      return;
    }

    if (drawingRef.current) {
      drawingRef.current.points.push(point);

      // Apply smoothing for pen tool
      if (activeTool === "pen" && drawingRef.current.points.length > 10) {
        const simplified = simplifyPoints(drawingRef.current.points, 2);
        if (simplified.length >= 2) {
          drawingRef.current.points = simplified;
        }
      }
    }
  }, [panning, zoom, offsetX, offsetY, onPan, isLaserActive, onLaserMove, activeTool, draggingSelection, moveSelected]);

  const handlePointerUp = useCallback((
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.releasePointerCapture(e.pointerId);

    if (panning) {
      setPanning(false);
      return;
    }

    if (draggingSelection) {
      setDraggingSelection(false);
      dragStart.current = null;
      initialPositions.current.clear();
      return;
    }

    if (isLaserActive) {
      onLaserEnd?.();
      return;
    }

    if (drawingRef.current) {
      const stroke = drawingRef.current;
      drawingRef.current = null;

      // Apply smoothing for freehand
      if (stroke.tool === "pen" && stroke.points.length > 5) {
        stroke.points = simplifyPoints(stroke.points, 1.5);
        stroke.smoothed = true;
      }

      onStrokeComplete(stroke);
    }
  }, [panning, isLaserActive, onLaserEnd, onStrokeComplete, draggingSelection]);

  const handleWheel = useCallback((
    e: React.WheelEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(5, Math.max(0.2, zoom + delta));
    onZoom(nextZoom);
  }, [zoom, onZoom]);

  return {
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    isPanning: panning,
  };
}
