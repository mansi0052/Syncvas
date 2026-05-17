import { useEffect, useRef } from "react";
import { useSyncvasStore } from "../store/useSyncvasStore";

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { strokes, stickies, zoom, offsetX, offsetY } = useSyncvasStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const scale = window.devicePixelRatio;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((s) => {
      s.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });
    stickies.forEach((st) => {
      minX = Math.min(minX, st.x);
      minY = Math.min(minY, st.y);
      maxX = Math.max(maxX, st.x + st.width);
      maxY = Math.max(maxY, st.y + st.height);
    });

    if (!isFinite(minX)) return;

    const contentWidth = maxX - minX + 200;
    const contentHeight = maxY - minY + 200;
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    const mapScale = Math.min(scaleX, scaleY, 1);

    const offsetXMap = (width - contentWidth * mapScale) / 2 - minX * mapScale;
    const offsetYMap = (height - contentHeight * mapScale) / 2 - minY * mapScale;

    const transform = (x: number, y: number) => ({
      x: x * mapScale + offsetXMap,
      y: y * mapScale + offsetYMap,
    });

    strokes.forEach((s) => {
      if (s.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1, s.width * mapScale * 0.5);
      const p0 = transform(s.points[0].x, s.points[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < s.points.length; i++) {
        const p = transform(s.points[i].x, s.points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });

    const stickyColors: Record<string, string> = {
      yellow: "#fef3c7", pink: "#fbcfe8", green: "#bbf7d0",
      blue: "#bfdbfe", purple: "#e9d5ff", violet: "#e9d5ff"
    };

    stickies.forEach((st) => {
      const p1 = transform(st.x, st.y);
      const p2 = transform(st.x + st.width, st.y + st.height);
      ctx.fillStyle = stickyColors[st.color] || "#fef3c7";
      ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    });

    const viewX = -offsetX / zoom;
    const viewY = -offsetY / zoom;
    const viewW = width / zoom;
    const viewH = height / zoom;
    const v1 = transform(viewX, viewY);
    const v2 = transform(viewX + viewW, viewY + viewH);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
  }, [strokes, stickies, zoom, offsetX, offsetY]);

  return (
    <div className="fixed bottom-4 right-4 z-20 w-40 h-28 border border-cyan-200 rounded bg-gray-900/80">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
