"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/socket`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
};
