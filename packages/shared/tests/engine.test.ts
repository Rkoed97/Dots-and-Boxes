import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  validateMove,
  applyMove,
  inBoundsEdge,
  isEdgeSet,
  adjacentBoxesForEdge,
  isGameOver,
  type ApplyMoveResult,
} from '../src/engine';
import type { Edge, GameStateSnapshot } from '../src/types';

const players = { xId: 'px', oId: 'po' };

function other(turn: string) {
  return turn === players.xId ? players.oId : players.xId;
}

describe('engine: initial state', () => {
  it('creates correct sizes and defaults', () => {
    const s = createInitialState(3, 3, 'm1', players, players.xId);
    // edges.h: N x (M-1) => 3 x 2
    expect(s.edges.h.length).toBe(3);
    s.edges.h.forEach(row => expect(row.length).toBe(2));
    // edges.v: (N-1) x M => 2 x 3
    expect(s.edges.v.length).toBe(2);
    s.edges.v.forEach(row => expect(row.length).toBe(3));
    // boxes: (N-1) x (M-1) => 2 x 2
    expect(s.boxes.length).toBe(2);
    s.boxes.forEach(row => expect(row.length).toBe(2));

    // all edges false, all boxes none
    expect(s.edges.h.flat().every(v => v === false)).toBe(true);
    expect(s.edges.v.flat().every(v => v === false)).toBe(true);
    expect(s.boxes.flat().every(v => v === 'none')).toBe(true);
    expect(s.scores).toEqual({ x: 0, o: 0 });
    expect(s.turnPlayerId).toBe(players.xId);
    expect(s.status).toBe('active');
  });
});

describe('engine: basic move placement', () => {
  it('sets an edge and rejects duplicate placement', () => {
    let s = createInitialState(3, 3, 'm1', players, players.xId);
    const edge: Edge = { o: 'H', row: 0, col: 0 };

    const res = applyMove(s, s.turnPlayerId, edge);
    s = res.nextState;

    expect(s.edges.h[0][0]).toBe(true);

    const v = validateMove(s, s.turnPlayerId, edge);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('EDGE_ALREADY_SET');
  });
});

describe('engine: single box completion and turn retention', () => {
  it('completes a single box and retains the turn', () => {
    // 2x2 dots-and-boxes (1 box)
    let s = createInitialState(2, 2, 'single', players, players.xId);

    // Sequence to complete the single box at (0,0)
    // 1) px: H(0,0)
    let r1 = applyMove(s, s.turnPlayerId, { o: 'H', row: 0, col: 0 });
    s = r1.nextState;
    expect(r1.claimedBoxes.length).toBe(0);

    // 2) po: V(0,0)
    let r2 = applyMove(s, s.turnPlayerId, { o: 'V', row: 0, col: 0 });
    s = r2.nextState;
    expect(r2.claimedBoxes.length).toBe(0);

    // 3) px: V(0,1)
    let r3 = applyMove(s, s.turnPlayerId, { o: 'V', row: 0, col: 1 });
    s = r3.nextState;
    expect(r3.claimedBoxes.length).toBe(0);

    // 4) po: H(1,0) -> completes box (0,0)
    const r4 = applyMove(s, s.turnPlayerId, { o: 'H', row: 1, col: 0 });
    s = r4.nextState;
    expect(r4.claimedBoxes).toEqual([{ r: 0, c: 0 }]);
    expect(s.boxes[0][0]).toBe('o');
    // retains turn because a box was claimed
    expect(s.turnPlayerId).toBe(players.oId);
    expect(s.scores).toEqual({ x: 0, o: 1 });
  });
});

describe('engine: non-completing move causes turn switch', () => {
  it('switches turn when no box is completed', () => {
    let s = createInitialState(3, 3, 'm1', players, players.xId);
    const edge: Edge = { o: 'H', row: 0, col: 1 };
    const res = applyMove(s, s.turnPlayerId, edge);
    const s2 = res.nextState;
    expect(s2.turnPlayerId).toBe(other(s.turnPlayerId));
    expect(res.claimedBoxes.length).toBe(0);
  });
});

describe('engine: double box completion and extra turn', () => {
  it('claims two boxes with a single interior edge and retains the turn', () => {
    // 3x3 dots -> 2x2 boxes
    const base = createInitialState(3, 3, 'double', players, players.xId);

    // Prefill edges so that H(1,0) is the only missing edge for boxes (0,0) and (1,0)
    const edges = {
      h: base.edges.h.map(row => row.slice()),
      v: base.edges.v.map(row => row.slice()),
    };
    // set for c=0
    edges.h[0][0] = true; // top of (0,0)
    edges.v[0][0] = true; // left of (0,0)
    edges.v[0][1] = true; // right of (0,0) and left of (0,1)
    edges.v[1][0] = true; // left of (1,0)
    edges.v[1][1] = true; // right of (1,0) and left of (1,1)
    edges.h[2][0] = true; // bottom of (1,0)

    // Also prepare c=1 so that H(1,1) will later complete two boxes
    edges.h[0][1] = true; // top of (0,1)
    edges.v[0][2] = true; // right of (0,1)
    edges.v[1][2] = true; // right of (1,1)
    edges.h[2][1] = true; // bottom of (1,1)

    let s: GameStateSnapshot = {
      ...base,
      edges,
      // boxes still none (no completed boxes yet)
      boxes: base.boxes.map(row => row.slice()),
      scores: { x: 0, o: 0 },
      turnPlayerId: players.xId,
      status: 'active',
    };

    // Now play H(1,0) by px -> claim two boxes (0,0) & (1,0)
    const r1 = applyMove(s, players.xId, { o: 'H', row: 1, col: 0 });
    s = r1.nextState;
    expect(r1.claimedBoxes.length).toBe(2);
    expect(s.scores).toEqual({ x: 2, o: 0 });
    expect(s.turnPlayerId).toBe(players.xId); // extra turn

    // Next play H(1,1) by px -> claim two boxes (0,1) & (1,1)
    const r2 = applyMove(s, players.xId, { o: 'H', row: 1, col: 1 });
    s = r2.nextState;
    expect(r2.claimedBoxes.length).toBe(2);
    expect(s.scores).toEqual({ x: 4, o: 0 });
    expect(s.turnPlayerId).toBe(players.xId); // still extra turn
  });
});

describe('engine: game over and winner calculation', () => {
  it('finishes the game and determines winner deterministically', () => {
    const base = createInitialState(3, 3, 'end', players, players.xId);
    const edges = {
      h: base.edges.h.map(row => row.slice()),
      v: base.edges.v.map(row => row.slice()),
    };
    // Prepare both interior edges to be last moves for both columns (as above)
    edges.h[0][0] = true; edges.v[0][0] = true; edges.v[0][1] = true; edges.v[1][0] = true; edges.v[1][1] = true; edges.h[2][0] = true;
    edges.h[0][1] = true; edges.v[0][2] = true; edges.v[1][2] = true; edges.h[2][1] = true;

    let s: GameStateSnapshot = { ...base, edges, boxes: base.boxes.map(r => r.slice()), scores: { x:0, o:0 }, status: 'active', turnPlayerId: players.xId };

    // First closing move: H(1,0)
    const r1 = applyMove(s, players.xId, { o: 'H', row: 1, col: 0 });
    s = r1.nextState;
    expect(r1.claimedBoxes.length).toBe(2);
    expect(s.scores).toEqual({ x: 2, o: 0 });
    expect(s.status).toBe('active');
    expect(s.turnPlayerId).toBe(players.xId);

    // Second closing move: H(1,1) -> completes all boxes
    const r2 = applyMove(s, players.xId, { o: 'H', row: 1, col: 1 });
    s = r2.nextState;
    expect(r2.claimedBoxes.length).toBe(2);
    expect(s.scores).toEqual({ x: 4, o: 0 });
    expect(s.status).toBe('finished');
    expect(s.winnerId).toBe(players.xId);
    expect(isGameOver(s.boxes)).toBe(true);
  });
});
