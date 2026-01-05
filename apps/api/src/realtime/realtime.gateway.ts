import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Edge } from '@shared/core';
import { PrismaService } from '../prisma/prisma.service.js';
import { Inject } from '@nestjs/common';
import { MatchService } from '../match/match.service.js';
import { isLikelyUuid, isValidMatchId } from '../lib/matchId.js';

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
    async handleCreateMatch(
        @MessageBody() payload: { n: number; m: number },
        @ConnectedSocket() client: Socket,
    ): Promise<{ matchId: string } | { error: string }> {
        const userId = (client.data as any).userId as string | undefined;

        if (!userId) {
            return { error: 'UNAUTHORIZED' };
        }

        const n = payload?.n;
        const m = payload?.m;
        if (!Number.isInteger(n) || !Number.isInteger(m) || n < 3 || n > 19 || m < 3 || m > 19) {
            return { error: 'INVALID_PAYLOAD' };
        }

        try {
            const { matchId } = await this.matches.createMatch(userId, n, m);
            return { matchId };
        } catch (e: any) {
            return { error: e?.message ?? 'CREATE_MATCH_FAILED' };
        }
    }

  @SubscribeMessage('lobby:joinMatch')
  async handleJoinMatch(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket
  ): Promise<{ ok: true } | { error: string }> {
    const userId = (client.data as any).userId as string | undefined;
    if (!userId) return { error: 'UNAUTHORIZED' };
    const matchId = payload?.matchId;
    if (!matchId || typeof matchId !== 'string' || !matchId.trim()) {
      return { error: 'INVALID_PAYLOAD' };
    }
    try {
      const snap = await this.matches.joinMatch(userId, matchId);
      await client.join(this.room(matchId));
      this.server.to(this.room(matchId)).emit('game:state', snap);
      return { ok: true };
    } catch (e: any) {
      const msg = e?.message ?? 'JOIN_FAILED';
      return { error: msg };
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

  @SubscribeMessage('game:rematchPropose')
  async handleRematchPropose(@MessageBody() payload: { matchId: string }, @ConnectedSocket() client: Socket) {
    const userId = (client.data as any).userId as string;
    if (!userId) return;
    const { matchId } = payload || {};
    if (!matchId) return;

    try {
      const result = await this.matches.proposeRematch(userId, matchId);
      this.server.to(this.room(matchId)).emit('game:rematchProposed', {
        finishedMatchId: matchId,
        newMatchId: result.newMatchId,
        creatorId: userId,
        creatorName: result.creatorName,
      });
    } catch (e: any) {
      // Log or handle error
    }
  }

  @SubscribeMessage('game:rematchRespond')
  async handleRematchRespond(@MessageBody() payload: { matchId: string; decision: 'ACCEPT' | 'REJECT' }, @ConnectedSocket() client: Socket) {
    const userId = (client.data as any).userId as string;
    if (!userId) return;
    const { matchId, decision } = payload || {};
    if (!matchId || !decision) return;

    try {
      const result = await this.matches.respondToRematch(userId, matchId, decision);
      if (result.status === 'ACCEPTED') {
        this.server.to(this.room(matchId)).emit('game:rematchAccepted', {
          finishedMatchId: result.finishedMatchId,
          newMatchId: result.newMatchId,
        });
      } else {
        this.server.to(this.room(matchId)).emit('game:rematchRejected', {
          finishedMatchId: result.finishedMatchId,
        });
      }
    } catch (e: any) {
      // Log or handle error
    }
  }

}
