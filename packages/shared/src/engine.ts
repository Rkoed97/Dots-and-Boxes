import type { BoxOwner, Edge, GamePlayers, GameStateSnapshot, Orientation, PlayerMark } from "./types";

export type MoveRejectionReason =
  | "NOT_YOUR_TURN"
  | "EDGE_OUT_OF_BOUNDS"
  | "EDGE_ALREADY_SET"
  | "MATCH_FINISHED"
  | "INVALID_PAYLOAD";

export interface ApplyMoveResult {
  nextState: GameStateSnapshot;
  claimedBoxes: { r: number; c: number }[];
  turnPlayerId: string;
  gameOver: boolean;
  winnerId: string | null;
}

// Helper: allocate a 2D boolean array
function makeBoolGrid(rows: number, cols: number, initial = false): boolean[][] {
  const grid: boolean[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(initial);
  }
  return grid;
}

// Helper: allocate a 2D owner array
function makeOwnerGrid(rows: number, cols: number, initial: BoxOwner = "none"): BoxOwner[][] {
  const grid: BoxOwner[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(initial);
  }
  return grid;
}

export function createInitialState(
  n: number,
  m: number,
  matchId: string,
  players: GamePlayers,
  startingTurnPlayerId: string
): GameStateSnapshot {
  if (!Number.isInteger(n) || !Number.isInteger(m) || n < 2 || m < 2) {
    throw new Error("INVALID_PAYLOAD: n and m must be integers >= 2");
  }
  if (startingTurnPlayerId !== players.xId && startingTurnPlayerId !== players.oId) {
    throw new Error("INVALID_PAYLOAD: startingTurnPlayerId must match one of the players");
  }
  const edges = {
    // spec: edges.h: boolean[N][M-1]
    h: makeBoolGrid(n, m - 1, false),
    // spec: edges.v: boolean[N-1][M]
    v: makeBoolGrid(n - 1, m, false),
  };
  const boxes = makeOwnerGrid(n - 1, m - 1, "none");
  const scores = { x: 0, o: 0 };

  const state: GameStateSnapshot = {
    matchId,
    n,
    m,
    players,
    turnPlayerId: startingTurnPlayerId,
    edges,
    boxes,
    scores,
    status: "active",
    winnerId: null,
  };
  return state;
}

export function inBoundsEdge(n: number, m: number, edge: Edge): boolean {
  if (!edge || (edge.o !== "H" && edge.o !== "V")) return false;
  if (!Number.isInteger(edge.row) || !Number.isInteger(edge.col)) return false;
  if (edge.o === "H") {
    return edge.row >= 0 && edge.row < n && edge.col >= 0 && edge.col < m - 1;
  } else {
    return edge.row >= 0 && edge.row < n - 1 && edge.col >= 0 && edge.col < m;
  }
}

export function isEdgeSet(state: GameStateSnapshot, edge: Edge): boolean {
  return edge.o === "H" ? state.edges.h[edge.row][edge.col] : state.edges.v[edge.row][edge.col];
}

// Mutates provided edges object (assumed cloned beforehand)
export function setEdge(
  edges: { h: boolean[][]; v: boolean[][] },
  edge: Edge,
  value: boolean
): void {
  if (edge.o === "H") edges.h[edge.row][edge.col] = value;
  else edges.v[edge.row][edge.col] = value;
}

export function adjacentBoxesForEdge(n: number, m: number, edge: Edge): { r: number; c: number }[] {
  const res: { r: number; c: number }[] = [];
  if (edge.o === "H") {
    // above box: (row-1, col)
    if (edge.row - 1 >= 0 && edge.row - 1 < n - 1 && edge.col >= 0 && edge.col < m - 1) {
      res.push({ r: edge.row - 1, c: edge.col });
    }
    // below box: (row, col)
    if (edge.row >= 0 && edge.row < n - 1 && edge.col >= 0 && edge.col < m - 1) {
      res.push({ r: edge.row, c: edge.col });
    }
  } else {
    // left box: (row, col-1)
    if (edge.row >= 0 && edge.row < n - 1 && edge.col - 1 >= 0 && edge.col - 1 < m - 1) {
      res.push({ r: edge.row, c: edge.col - 1 });
    }
    // right box: (row, col)
    if (edge.row >= 0 && edge.row < n - 1 && edge.col >= 0 && edge.col < m - 1) {
      res.push({ r: edge.row, c: edge.col });
    }
  }
  return res;
}

export function isBoxComplete(state: GameStateSnapshot, r: number, c: number): boolean {
  // box (r,c) bounded by:
  // top H(r, c), bottom H(r+1, c), left V(r, c), right V(r, c+1)
  const top = state.edges.h[r][c];
  const bottom = state.edges.h[r + 1][c];
  const left = state.edges.v[r][c];
  const right = state.edges.v[r][c + 1];
  return top && bottom && left && right;
}

export function computeScores(boxes: BoxOwner[][]): { x: number; o: number } {
  let x = 0,
    o = 0;
  for (let r = 0; r < boxes.length; r++) {
    for (let c = 0; c < boxes[r].length; c++) {
      const owner = boxes[r][c];
      if (owner === "x") x++;
      else if (owner === "o") o++;
    }
  }
  return { x, o };
}

export function isGameOver(boxes: BoxOwner[][]): boolean {
  for (let r = 0; r < boxes.length; r++) {
    for (let c = 0; c < boxes[r].length; c++) {
      if (boxes[r][c] === "none") return false;
    }
  }
  return true;
}

function playerIdToMark(players: GamePlayers, playerId: string): PlayerMark {
  if (playerId === players.xId) return "x";
  if (playerId === players.oId) return "o";
  throw new Error("INVALID_PAYLOAD: playerId not part of this match");
}

export function validateMove(
  state: GameStateSnapshot,
  playerId: string,
  edge: Edge
): { ok: true } | { ok: false; reason: MoveRejectionReason } {
  if (!edge || (edge.o !== "H" && edge.o !== "V")) {
    return { ok: false, reason: "INVALID_PAYLOAD" };
  }
  if (state.status === "finished") {
    return { ok: false, reason: "MATCH_FINISHED" };
  }
  if (playerId !== state.turnPlayerId) {
    return { ok: false, reason: "NOT_YOUR_TURN" };
  }
  if (!inBoundsEdge(state.n, state.m, edge)) {
    return { ok: false, reason: "EDGE_OUT_OF_BOUNDS" };
  }
  if (isEdgeSet(state, edge)) {
    return { ok: false, reason: "EDGE_ALREADY_SET" };
  }
  return { ok: true };
}

export function applyMove(state: GameStateSnapshot, playerId: string, edge: Edge): ApplyMoveResult {
  // Validate basic invariants but assume caller already validated; we re-check safety.
  const valid = validateMove(state, playerId, edge);
  if (!valid.ok) {
    throw new Error(`Invalid move: ${valid.reason}`);
  }

  // Clone simple fields and deep-clone grids
  const nextEdges = {
    h: state.edges.h.map((row) => row.slice()),
    v: state.edges.v.map((row) => row.slice()),
  };
  const nextBoxes: BoxOwner[][] = state.boxes.map((row) => row.slice());

  // Set the edge
  setEdge(nextEdges, edge, true);

  const n = state.n;
  const m = state.m;

  const claimedBoxes: { r: number; c: number }[] = [];
  const mark = playerIdToMark(state.players, playerId);

  // Temporary state object to evaluate completeness with updated edges
  const tempState: GameStateSnapshot = {
    ...state,
    edges: nextEdges,
    boxes: nextBoxes,
  };

  // Determine which adjacent boxes (up to two) became complete due to this edge
  const adj = adjacentBoxesForEdge(n, m, edge);
  for (const { r, c } of adj) {
    if (nextBoxes[r][c] !== "none") continue; // already owned (shouldn't happen in normal flow)
    if (isBoxComplete(tempState, r, c)) {
      nextBoxes[r][c] = mark;
      claimedBoxes.push({ r, c });
    }
  }

  // Compute scores and winner
  const scores = computeScores(nextBoxes);

  // Determine next turn: same player if claimed >= 1 box
  const otherPlayerId = playerId === state.players.xId ? state.players.oId : state.players.xId;
  const nextTurnPlayerId = claimedBoxes.length > 0 ? playerId : otherPlayerId;

  // Determine game over
  const gameOver = isGameOver(nextBoxes);
  const winnerId = gameOver
    ? scores.x > scores.o
      ? state.players.xId
      : scores.o > scores.x
      ? state.players.oId
      : null
    : null;

  const nextState: GameStateSnapshot = {
    matchId: state.matchId,
    n,
    m,
    players: state.players,
    turnPlayerId: nextTurnPlayerId,
    edges: nextEdges,
    boxes: nextBoxes,
    scores,
    status: gameOver ? "finished" : "active",
    winnerId,
  };

  return {
    nextState,
    claimedBoxes,
    turnPlayerId: nextTurnPlayerId,
    gameOver,
    winnerId,
  };
}
