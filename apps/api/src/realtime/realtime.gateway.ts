import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Edge } from '@shared/core';
import { PrismaService } from '../prisma/prisma.service.js';
import { Inject } from '@nestjs/common';
import { MatchService } from '../match/match.service.js';

const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

@WebSocketGateway({
  path: '/ws',
  cors: { origin, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(MatchService) private readonly matches: MatchService) {}

  async handleConnection(client: Socket) {
    try {
      const cookies = parseCookies(client.handshake.headers.cookie as string | undefined);
      const sid = cookies['sid'];
      if (!sid) throw new Error('NO_SID');
      const session = await this.prisma.session.findUnique({ where: { id: sid } });
      if (!session) throw new Error('BAD_SESSION');
      if (session.expiresAt.getTime() <= Date.now()) throw new Error('EXPIRED');
      // Attach userId for later
      (client.data as any).userId = session.userId;
    } catch {
      client.disconnect(true);
      return;
    }
  }

  handleDisconnect(_client: Socket) {
    // no-op for now
  }

  private room(matchId: string) {
    return `match:${matchId}`;
  }

  @SubscribeMessage('lobby:createMatch')
  async handleCreateMatch(@MessageBody() payload: { n: number; m: number; }, @ConnectedSocket() client: Socket) {
    const userId = (client.data as any).userId as string;
    if (!userId) return;
    try {
      const { matchId } = await this.matches.createMatch(userId, payload?.n as number, payload?.m as number);
      // Optional ack via arguments[2] isn't typed; clients can pass a cb
      const maybeAck = (arguments as any)[2];
      if (typeof maybeAck === 'function') {
        maybeAck({ matchId });
      }
    } catch {
      // ignore for now; could add error acking if desired
    }
  }

  @SubscribeMessage('lobby:joinMatch')
  async handleJoinMatch(@MessageBody() payload: { matchId: string }, @ConnectedSocket() client: Socket) {
    const userId = (client.data as any).userId as string;
    if (!userId || !payload?.matchId) return;
    try {
      const snap = await this.matches.joinMatch(userId, payload.matchId);
      await client.join(this.room(payload.matchId));
      this.server.to(this.room(payload.matchId)).emit('game:state', snap);
    } catch {
      // silently ignore
    }
  }

  @SubscribeMessage('game:move')
  async handleMove(@MessageBody() payload: { matchId: string; edge: Edge; clientSeq: number }, @ConnectedSocket() client: Socket) {
    const userId = (client.data as any).userId as string;
    if (!userId) return;
    const { matchId, edge, clientSeq } = payload || ({} as any);
    if (!matchId || !edge || typeof clientSeq !== 'number') {
      client.emit('game:moveRejected', { clientSeq: clientSeq ?? -1, reason: 'INVALID_PAYLOAD' });
      return;
    }
    const res = await this.matches.applyMove(userId, matchId, edge);
    if (!res.ok) {
      client.emit('game:moveRejected', { clientSeq, reason: res.reason });
      return;
    }
    const snap = res.snapshot;
    this.server.to(this.room(matchId)).emit('game:state', snap);
    if (res.gameOver) {
      this.server.to(this.room(matchId)).emit('game:ended', { matchId, winnerId: snap.winnerId ?? null, scores: snap.scores });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() _payload: unknown, @ConnectedSocket() client: Socket) {
    client.emit('pong');
  }
}
