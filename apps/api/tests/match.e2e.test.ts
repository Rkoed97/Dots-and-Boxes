import 'reflect-metadata';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { MatchService } from '../src/match/match.service.js';
import type { Edge } from '@shared/core';

async function createUser(prisma: PrismaService, email: string, username: string) {
  const u = await prisma.user.create({ data: { email, username, passwordHash: 'x' } });
  return u;
}

function uid(prefix = 'u') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

describe('MatchService orchestration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let matchService: MatchService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    matchService = app.get(MatchService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('createMatch creates DB row', async () => {
    const a = await createUser(prisma, uid('a') + '@t.dev', uid('A'));
    const { matchId } = await matchService.createMatch(a.id, 11, 11);
    const row = await prisma.match.findUnique({ where: { id: matchId } });
    expect(row).toBeTruthy();
    expect(row!.playerXId).toBe(a.id);
    expect(row!.status).toBe('waiting');
  });

  it('joinMatch transitions status to active when second player joins and returns snapshot', async () => {
    const a = await createUser(prisma, uid('a') + '@t.dev', uid('A'));
    const b = await createUser(prisma, uid('b') + '@t.dev', uid('B'));
    const { matchId } = await matchService.createMatch(a.id, 11, 11);
    const snap = await matchService.joinMatch(b.id, matchId);
    const row = await prisma.match.findUnique({ where: { id: matchId } });
    expect(row!.status).toBe('active');
    expect(snap.status === 'active' || snap.status === 'waiting').toBe(true); // race-safe
  });

  it('applyMove persists move and updates snapshot', async () => {
    const a = await createUser(prisma, uid('a') + '@t.dev', uid('A'));
    const b = await createUser(prisma, uid('b') + '@t.dev', uid('B'));
    const { matchId } = await matchService.createMatch(a.id, 11, 11);
    await matchService.joinMatch(b.id, matchId);

    const edge: Edge = { o: 'H', row: 0, col: 0 };
    const res = await matchService.applyMove(a.id, matchId, edge);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const snap = res.snapshot;
      expect(snap.edges.h[0][0]).toBe(true);
      const moves = await prisma.matchMove.findMany({ where: { matchId } });
      expect(moves.length).toBe(1);
      expect(moves[0].edgeRow).toBe(0);
      expect(moves[0].edgeCol).toBe(0);
    }
  });
});
