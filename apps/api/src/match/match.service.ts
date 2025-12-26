import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchStatus, EdgeOrientation } from '@prisma/client';
import type { Edge, GameStateSnapshot } from '@shared/core';
import { createInitialState, validateMove as engineValidateMove, applyMove as engineApplyMove, type MoveRejectionReason } from '@shared/core';

export type ExtraRejectionReason = 'MATCH_NOT_FOUND' | 'NOT_IN_MATCH' | 'INVALID_PAYLOAD';
export type RejectionReason = MoveRejectionReason | ExtraRejectionReason;

class SimpleMutex {
  private queue: Promise<void> = Promise.resolve();
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((res) => (release = res));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

@Injectable()
export class MatchService {
  private active = new Map<string, GameStateSnapshot>();
  private mutexes = new Map<string, SimpleMutex>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private getMutex(matchId: string): SimpleMutex {
    let m = this.mutexes.get(matchId);
    if (!m) {
      m = new SimpleMutex();
      this.mutexes.set(matchId, m);
    }
    return m;
  }

  async createMatch(userId: string, n: number, m: number): Promise<{ matchId: string }> {
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 11 || n > 19 || m < 11 || m > 19) {
      throw new Error('INVALID_DIMENSIONS');
    }
    const match = await this.prisma.match.create({
      data: {
        n,
        m,
        status: MatchStatus.waiting,
        createdById: userId,
        playerXId: userId,
      },
      select: { id: true },
    });
    return { matchId: match.id };
  }

  async joinMatch(userId: string, matchId: string): Promise<GameStateSnapshot> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('MATCH_NOT_FOUND');

    // If user already is in match, keep as is. Otherwise try to set as O.
    if (match.playerXId !== userId && match.playerOId !== userId) {
      if (!match.playerOId) {
        await this.prisma.match.update({ where: { id: matchId }, data: { playerOId: userId } });
      }
    }

    // Refresh match row
    const mm = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!mm) throw new Error('MATCH_NOT_FOUND');

    let updated = mm;
    if (mm.playerXId && mm.playerOId && mm.status !== MatchStatus.active && mm.status !== MatchStatus.finished) {
      updated = await this.prisma.match.update({ where: { id: matchId }, data: { status: MatchStatus.active } });
    }

    const snapshot = await this.getOrRebuildState(updated.id);
    return snapshot;
  }

  async getOrRebuildState(matchId: string): Promise<GameStateSnapshot> {
    const cached = this.active.get(matchId);
    if (cached) return cached;

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('MATCH_NOT_FOUND');

    const players = { xId: match.playerXId ?? '', oId: match.playerOId ?? '' };

    if (match.status === MatchStatus.waiting || !match.playerXId || !match.playerOId) {
      // Build an empty waiting snapshot
      const n = match.n;
      const m = match.m;
      const h: boolean[][] = Array.from({ length: n }, () => Array.from({ length: m - 1 }, () => false));
      const v: boolean[][] = Array.from({ length: n - 1 }, () => Array.from({ length: m }, () => false));
      const boxes: ('none')[][] = Array.from({ length: n - 1 }, () => Array.from({ length: m - 1 }, () => 'none'));
      const snapshot: GameStateSnapshot = {
        matchId,
        n,
        m,
        players,
        turnPlayerId: players.xId ?? '',
        edges: { h, v },
        boxes,
        scores: { x: 0, o: 0 },
        status: 'waiting',
        winnerId: null,
      };
      this.active.set(matchId, snapshot);
      return snapshot;
    }

    // Build initial active state and replay moves
    let state = createInitialState(match.n, match.m, match.id, { xId: match.playerXId, oId: match.playerOId }, match.playerXId);

    const moves = await this.prisma.matchMove.findMany({ where: { matchId }, orderBy: { createdAt: 'asc' } });
    for (const mv of moves) {
      const edge: Edge = { o: mv.edgeOrientation === EdgeOrientation.H ? 'H' : 'V', row: mv.edgeRow, col: mv.edgeCol };
      // apply using recorded playerId
      state = engineApplyMove(state, mv.playerId, edge).nextState;
    }

    // Adjust status/winner from DB if finished
    const winnerId = match.winnerId ?? null;
    const finalState: GameStateSnapshot = { ...state, status: match.status === MatchStatus.finished ? 'finished' : 'active', winnerId };
    this.active.set(matchId, finalState);
    return finalState;
  }

  async applyMove(
    userId: string,
    matchId: string,
    edge: Edge
  ): Promise<{ ok: true; snapshot: GameStateSnapshot; gameOver: boolean } | { ok: false; reason: RejectionReason }>
  {
    const mutex = this.getMutex(matchId);
    return mutex.runExclusive(async () => {
      const match = await this.prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return { ok: false, reason: 'MATCH_NOT_FOUND' } as const;
      if (match.status === MatchStatus.finished) return { ok: false, reason: 'MATCH_FINISHED' } as const;
      if (userId !== match.playerXId && userId !== match.playerOId) return { ok: false, reason: 'NOT_IN_MATCH' } as const;

      // Ensure we have up-to-date state
      const state = await this.getOrRebuildState(matchId);
      const valid = engineValidateMove(state, userId, edge);
      if (!valid.ok) return { ok: false, reason: valid.reason } as const;

      // Persist move first (authoritative)
      await this.prisma.matchMove.create({
        data: {
          matchId,
          playerId: userId,
          edgeOrientation: edge.o === 'H' ? EdgeOrientation.H : EdgeOrientation.V,
          edgeRow: edge.row,
          edgeCol: edge.col,
        },
      });

      // Apply on engine
      const res = engineApplyMove(state, userId, edge);
      const next = res.nextState;

      // If game over, update DB
      if (res.gameOver) {
        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.finished,
            winnerId: res.winnerId,
            finishedAt: new Date(),
          },
        });
        // Update snapshot status to finished
        next.status = 'finished';
        next.winnerId = res.winnerId;
      }

      this.active.set(matchId, next);
      return { ok: true, snapshot: next, gameOver: res.gameOver } as const;
    });
  }
}
