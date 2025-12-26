import { describe, it, expect, expectTypeOf } from 'vitest';
import type { ClientToServerEvents, ServerToClientEvents } from '../src/protocol';
import { type Edge, type GameStateSnapshot } from '../src/types';

// Minimal runtime and compile-time sanity checks for shared types/protocol

describe('shared protocol/types', () => {
  it('Edge shape is correct at runtime', () => {
    const e: Edge = { o: 'H', row: 0, col: 1 };
    expect(e.o).toBe('H');
    expect(typeof e.row).toBe('number');
    expect(typeof e.col).toBe('number');
  });

  it('GameStateSnapshot structural sanity (partial)', () => {
    const snap: GameStateSnapshot = {
      matchId: 'm1',
      n: 2,
      m: 2,
      players: { xId: 'x', oId: 'o' },
      turnPlayerId: 'x',
      edges: { h: [[false, false, false], [false, false, false]], v: [[false, false], [false, false], [false, false]] },
      boxes: [["none", "none"],["none", "none"]],
      scores: { x: 0, o: 0 },
      status: 'waiting',
      winnerId: null
    };
    expect(snap.players.xId).toBe('x');
    expect(snap.status).toBe('waiting');
  });

  it('ClientToServerEvents signatures', () => {
    type CreateMatch = ClientToServerEvents['lobby:createMatch'];
    expectTypeOf<CreateMatch>().toBeFunction();
    expectTypeOf<CreateMatch>().parameters.toEqualTypeOf<[{ n: number; m: number }, ((resp: { matchId: string }) => void) | undefined]>();

    type JoinMatch = ClientToServerEvents['lobby:joinMatch'];
    expectTypeOf<JoinMatch>().parameters.toEqualTypeOf<[{ matchId: string }]>();

    type Move = ClientToServerEvents['game:move'];
    expectTypeOf<Move>().parameters.toEqualTypeOf<[{ matchId: string; edge: Edge; clientSeq: number }]>();
  });

  it('ServerToClientEvents signatures', () => {
    type StateEvt = ServerToClientEvents['game:state'];
    expectTypeOf<StateEvt>().parameters.toEqualTypeOf<[GameStateSnapshot]>();

    type RejectedEvt = ServerToClientEvents['game:moveRejected'];
    expectTypeOf<RejectedEvt>().parameters.toEqualTypeOf<[{ clientSeq: number; reason: string }]>();

    type EndedEvt = ServerToClientEvents['game:ended'];
    expectTypeOf<EndedEvt>().parameters.toEqualTypeOf<[{ matchId: string; winnerId: string | null; scores: { x: number; o: number } }]>();
  });
});
