import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import prismaPkg from '@prisma/client';
const { MatchStatus, EdgeOrientation } = prismaPkg;
import type { Edge, GameStateSnapshot } from '@shared/core';
import { createInitialState, validateMove as engineValidateMove, applyMove as engineApplyMove, type MoveRejectionReason } from '@shared/core';
import { generateMatchId, isLikelyUuid, isValidMatchId } from '../lib/matchId.js';

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

  private async generateUniqueMatchId(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const candidate = generateMatchId();
      const existing = await this.prisma.match.findUnique({ where: { matchId: candidate } });
      if (!existing) return candidate;
    }
    throw new Error('MATCH_ID_COLLISION');
  }

  private async resolveByIdOrMatchId(idOrMatchId: string) {
    if (isLikelyUuid(idOrMatchId)) {
      return this.prisma.match.findUnique({ where: { id: idOrMatchId } });
    }
    if (isValidMatchId(idOrMatchId)) {
      return this.prisma.match.findUnique({ where: { matchId: idOrMatchId } });
    }
    return null;
  }

  async ensureBackfilled(match: { id: string; matchId: string | null }): Promise<string> {
    if (match.matchId && isValidMatchId(match.matchId)) return match.matchId;
    const fresh = await this.prisma.match.update({
      where: { id: match.id },
      data: { matchId: await this.generateUniqueMatchId() },
      select: { matchId: true },
    });
    return fresh.matchId!;
  }

  async createMatch(userId: string, n: number, m: number): Promise<{ matchId: string }> {
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 3 || n > 19 || m < 3 || m > 19) {
      throw new Error('INVALID_DIMENSIONS');
    }
    const publicId = await this.generateUniqueMatchId();
    const match = await this.prisma.match.create({
      data: {
        n,
        m,
        status: MatchStatus.waiting,
        createdById: userId,
        playerXId: userId,
        matchId: publicId,
      },
      select: { matchId: true },
    });
    return { matchId: match.matchId! };
  }

  async joinMatch(userId: string, idOrMatchId: string): Promise<GameStateSnapshot> {
    const match = await this.resolveByIdOrMatchId(idOrMatchId);
    if (!match) throw new Error('MATCH_NOT_FOUND');
    const mid = match.id;

    // If user already is in match, proceed. Otherwise attempt to claim O slot.
    const isPlayer = match.playerXId === userId || match.playerOId === userId;

    if (!isPlayer) {
      // If already full, reject immediately
      if (match.playerXId && match.playerOId) {
        throw new Error('MATCH_FULL');
      }
      // Attempt to claim O slot atomically (avoid race conditions)
      const res = await this.prisma.match.updateMany({
        where: { id: mid, playerOId: null },
        data: { playerOId: userId },
      });
      if (res.count === 0) {
        // Someone else took the slot or match changed; re-check
        const again = await this.prisma.match.findUnique({ where: { id: mid } });
        if (!again) throw new Error('MATCH_NOT_FOUND');
        const nowPlayer = again.playerXId === userId || again.playerOId === userId;
        if (!nowPlayer) throw new Error('MATCH_FULL');
      }
    }

    // Refresh match row
    const mm = await this.prisma.match.findUnique({ where: { id: mid } });
    if (!mm) throw new Error('MATCH_NOT_FOUND');

    let updated = mm;
    if (mm.playerXId && mm.playerOId && mm.status !== MatchStatus.active && mm.status !== MatchStatus.finished) {
      updated = await this.prisma.match.update({ where: { id: mid }, data: { status: MatchStatus.active } });
    }

    // Invalidate any cached snapshot to ensure new playerO and status are reflected
    this.active.delete(updated.id);
    const snapshot = await this.getOrRebuildState(updated.id);
    return snapshot;
  }

  async getOrRebuildState(internalId: string): Promise<GameStateSnapshot> {
    const cached = this.active.get(internalId);
    if (cached) return cached;

    const match = await this.prisma.match.findUnique({ where: { id: internalId } });
    if (!match) throw new Error('MATCH_NOT_FOUND');
    const publicId = await this.ensureBackfilled({ id: match.id, matchId: match.matchId ?? null });

    const players = { xId: match.playerXId ?? '', oId: match.playerOId ?? '' };

    if (match.status === MatchStatus.waiting || !match.playerXId || !match.playerOId) {
      // Build an empty waiting snapshot
      const n = match.n;
      const m = match.m;
      const h: boolean[][] = Array.from({ length: n }, () => Array.from({ length: m - 1 }, () => false));
      const v: boolean[][] = Array.from({ length: n - 1 }, () => Array.from({ length: m }, () => false));
      const boxes: ('none')[][] = Array.from({ length: n - 1 }, () => Array.from({ length: m - 1 }, () => 'none'));
      const snapshot: GameStateSnapshot = {
        matchId: publicId,
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
      this.active.set(internalId, snapshot);
      return snapshot;
    }

    // Build initial active state and replay moves
    let state = createInitialState(match.n, match.m, publicId, { xId: match.playerXId, oId: match.playerOId }, match.playerXId);

    const moves = await this.prisma.matchMove.findMany({ where: { matchId: internalId }, orderBy: { createdAt: 'asc' } });
    for (const mv of moves) {
      const edge: Edge = { o: mv.edgeOrientation === EdgeOrientation.H ? 'H' : 'V', row: mv.edgeRow, col: mv.edgeCol };
      // apply using recorded playerId
      state = engineApplyMove(state, mv.playerId, edge).nextState;
    }

    // Adjust status/winner from DB if finished
    const winnerId = match.winnerId ?? null;
    const finalState: GameStateSnapshot = { ...state, status: match.status === MatchStatus.finished ? 'finished' : 'active', winnerId };
    this.active.set(internalId, finalState);
    return finalState;
  }

  async applyMove(
    userId: string,
    idOrMatchId: string,
    edge: Edge
  ): Promise<{ ok: true; snapshot: GameStateSnapshot; gameOver: boolean } | { ok: false; reason: RejectionReason }>
  {
    // Resolve id for mutex stability
    const initial = await this.resolveByIdOrMatchId(idOrMatchId);
    if (!initial) return { ok: false, reason: 'MATCH_NOT_FOUND' } as const;
    const internalId = initial.id;
    const mutex = this.getMutex(internalId);
    return mutex.runExclusive(async () => {
      const match = await this.prisma.match.findUnique({ where: { id: internalId } });
      if (!match) return { ok: false, reason: 'MATCH_NOT_FOUND' } as const;
      if (match.status === MatchStatus.finished) return { ok: false, reason: 'MATCH_FINISHED' } as const;
      if (userId !== match.playerXId && userId !== match.playerOId) return { ok: false, reason: 'NOT_IN_MATCH' } as const;

      // Ensure we have up-to-date state
      const state = await this.getOrRebuildState(internalId);
      const valid = engineValidateMove(state, userId, edge);
      if (!valid.ok) return { ok: false, reason: valid.reason } as const;

      // Persist move first (authoritative)
      await this.prisma.matchMove.create({
        data: {
          matchId: internalId,
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
          where: { id: internalId },
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

      this.active.set(internalId, next);
      return { ok: true, snapshot: next, gameOver: res.gameOver } as const;
    });
  }
}
