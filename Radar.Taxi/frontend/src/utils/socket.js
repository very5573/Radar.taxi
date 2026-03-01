import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:4000",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  }
);

export default socket;
