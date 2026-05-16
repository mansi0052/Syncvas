declare module "socket.io" {
  import { Server as SocketIOServer } from "socket.io";
  export = SocketIOServer;
}

interface RTCSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}
