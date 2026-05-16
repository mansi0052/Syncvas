import type { Server as HTTPServer } from "http";
import { WebSocketServer } from "ws";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// @ts-ignore - y-websocket doesn't have TypeScript types
const { setupWSConnection } = require("y-websocket/bin/utils");

export function attachYjsServer(server: HTTPServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (!request.url?.startsWith("/yjs")) {
      return;
    }

    wss.handleUpgrade(request, socket as any, head, (ws) => {
      try {
        setupWSConnection(ws as any, request as any, { gc: true });
      } catch (err) {
        console.error("[Yjs] connection error:", err);
        if (ws instanceof WebSocket) {
          ws.close(1011, "Internal error");
        }
      }
    });
  });
}
