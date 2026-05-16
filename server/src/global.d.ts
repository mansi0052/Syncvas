declare module "express" {
  import * as express from "express";
  export = express;
}

declare module "y-websocket/bin/utils" {
  export function setupWSConnection(ws: any, request: any, opts?: { gc?: boolean }): void;
}
