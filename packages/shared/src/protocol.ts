import type { Edge, GameStateSnapshot } from "./types";

export interface ClientToServerEvents {
  "lobby:createMatch": (
    payload: { n: number; m: number },
    cb?: (resp: { matchId: string } | { error: string }) => void
  ) => void;
  "lobby:joinMatch": (
    payload: { matchId: string },
    cb?: (resp: { ok: true } | { error: string }) => void
  ) => void;
  "game:move": (payload: { matchId: string; edge: Edge; clientSeq: number }) => void;
  "game:rematchPropose": (payload: { matchId: string }) => void;
  "game:rematchRespond": (payload: { matchId: string; decision: 'ACCEPT' | 'REJECT' }) => void;
}

export interface ServerToClientEvents {
  "game:state": (payload: GameStateSnapshot) => void;
  "game:moveRejected": (payload: { clientSeq: number; reason: string }) => void;
  "game:ended": (
    payload: { matchId: string; winnerId: string | null; scores: { x: number; o: number } }
  ) => void;
  "game:rematchProposed": (payload: { finishedMatchId: string; newMatchId: string; creatorId: string; creatorName?: string }) => void;
  "game:rematchAccepted": (payload: { finishedMatchId: string; newMatchId: string }) => void;
  "game:rematchRejected": (payload: { finishedMatchId: string }) => void;
}
