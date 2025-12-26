import type { Edge, GameStateSnapshot } from "./types";

export interface ClientToServerEvents {
  "lobby:createMatch": (
    payload: { n: number; m: number },
    cb?: (resp: { matchId: string }) => void
  ) => void;
  "lobby:joinMatch": (payload: { matchId: string }) => void;
  "game:move": (payload: { matchId: string; edge: Edge; clientSeq: number }) => void;
}

export interface ServerToClientEvents {
  "game:state": (payload: GameStateSnapshot) => void;
  "game:moveRejected": (payload: { clientSeq: number; reason: string }) => void;
  "game:ended": (
    payload: { matchId: string; winnerId: string | null; scores: { x: number; o: number } }
  ) => void;
}
