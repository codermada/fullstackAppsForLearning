'use client';

import { io, type Socket } from 'socket.io-client';

/**
 * Backend gateway namespace:
 *   @WebSocketGateway({ namespace: 'tasks' })
 */
const NAMESPACE = 'tasks';

/**
 * Socket.IO path as proxied by nginx.
 * nginx maps  /nest/socket.io/*  →  backend:3000/socket.io/*
 */
const SOCKET_PATH = '/nest/socket.io';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(`/${NAMESPACE}`, {
    path: SOCKET_PATH,
    autoConnect: true,
    withCredentials: true,
    // Default transports: ['polling', 'websocket']
    // Socket.IO negotiates: tries polling, upgrades to WebSocket.
    // Do NOT force ['websocket'] — nginx upgrade must be verified first.
  });

  if (process.env.NODE_ENV !== 'production') {
    socket.on('connect', () => console.log('[ws] connected:', socket?.id));
    socket.on('disconnect', (reason) =>
      console.log('[ws] disconnected:', reason),
    );
    socket.on('connect_error', (err) =>
      console.error('[ws] error:', err.message),
    );
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}