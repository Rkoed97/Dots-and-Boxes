import type { ClientToServerEvents, ServerToClientEvents } from '@shared/core';
import { io, Socket } from 'socket.io-client';
import { WS_PATH } from '@/lib/api';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function resolveWsUrlAndPath() {
  // Default: same-origin
  let url: string | undefined = undefined;
  let path = WS_PATH || '/dots-and-boxes/ws';

  if (typeof window !== 'undefined') {
    const isDev = process.env.NODE_ENV !== 'production';
    const { hostname, protocol } = window.location;
    // In dev, Next runs on 3000 and API on 4000. Our server uses path '/ws'.
    if (isDev) {
      url = 'http://localhost:4000';
      path = '/ws';
    } else {
      // In production (Docker), API is exposed on 3001 from host perspective; from browser use same host with port 3001
      const wsOrigin = protocol.replace('http', 'ws');
      url = `${wsOrigin}//${hostname}:3001`;
      path = '/ws';
    }
  }
  return { url, path };
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) return socket;
  const { url, path } = resolveWsUrlAndPath();
  socket = io(url ?? undefined, {
    path,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}
