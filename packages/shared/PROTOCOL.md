# Realtime Protocol (Socket.IO)

## Client → Server

### lobby:createMatch
{ n: number, m: number } → ack: { matchId } | { error }

### lobby:joinMatch
{ matchId: string } → ack: { ok: true } | { error }

### game:move
{
  matchId: string,
  edge: { o: "H" | "V", row: number, col: number },
  clientSeq: number
}

## Server → Client

### game:state
Authoritative snapshot:
- matchId
- n, m
- edges (h[][], v[][])
- boxes ("none" | "x" | "o")
- turnPlayerId
- scores
- status
- winnerId?

### game:moveRejected
{ clientSeq, reason }

### game:ended
{ matchId, winnerId, scores }
