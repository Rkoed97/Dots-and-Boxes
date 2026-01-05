// Shared type definitions for Dots & Boxes

export type PlayerMark = "x" | "o";
export type BoxOwner = "none" | PlayerMark;
export type Orientation = "H" | "V";

export interface Edge {
  o: Orientation;
  row: number;
  col: number;
}

export interface GamePlayers {
  xId: string;
  oId: string;
}

export interface GameEdges {
  // Horizontal edges: (n rows of horizontal edges) by (m+1 dots between)
  h: boolean[][];
  // Vertical edges: (n+1 dots between) by (m columns of vertical edges)
  v: boolean[][];
}

export interface GameStateSnapshot {
  matchId: string;
  n: number;
  m: number;
  players: GamePlayers;
  turnPlayerId: string;
  edges: GameEdges;
  boxes: BoxOwner[][];
  scores: { x: number; o: number };
  status: "pending_acceptance" | "waiting" | "active" | "finished";
  winnerId?: string | null;
  rematchStatus?: 'NONE' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
  nextMatchId?: string | null;
}
