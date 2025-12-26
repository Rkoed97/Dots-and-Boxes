import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRequireAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import GameBoard from '@/components/GameBoard';
import type { Edge, GameStateSnapshot } from '@shared/core';

export default function GamePage() {
  const router = useRouter();
  const { ready, user } = useRequireAuth();
  const { matchId } = router.query;

  const [snap, setSnap] = useState<GameStateSnapshot | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const clientSeqRef = useRef<number>(1);
  const matchIdStr = useMemo(() => (typeof matchId === 'string' ? matchId : undefined), [matchId]);

  useEffect(() => {
    if (!ready || !user || !matchIdStr) return;
    const sock = getSocket();
    const onState = (s: GameStateSnapshot) => setSnap(s);
    const onRejected = (p: { clientSeq: number; reason: string }) => {
      setMsg(`Move rejected: ${p.reason}`);
      setTimeout(() => setMsg(null), 1500);
    };
    const onEnded = (_p: { matchId: string; winnerId: string | null }) => {
      setMsg('Game ended');
      setTimeout(() => setMsg(null), 2000);
    };

    sock.on('game:state', onState);
    sock.on('game:moveRejected', onRejected);
    sock.on('game:ended', onEnded);

    // Join (or rejoin) match room; server will emit latest snapshot
    sock.emit('lobby:joinMatch', { matchId: matchIdStr });

    return () => {
      sock.off('game:state', onState);
      sock.off('game:moveRejected', onRejected);
      sock.off('game:ended', onEnded);
    };
  }, [ready, user, matchIdStr]);

  function onEdgeClick(edge: Edge) {
    if (!matchIdStr) return;
    const seq = clientSeqRef.current;
    clientSeqRef.current = seq + 1;
    getSocket().emit('game:move', { matchId: matchIdStr, edge, clientSeq: seq });
  }

  const yourTurn = !!(snap && user && snap.turnPlayerId === user.id && snap.status !== 'finished');

  if (!ready) return null;
  return (
    <main className="container">
      <h1>Game</h1>
      <p>Match ID: <code>{String(matchIdStr ?? '')}</code></p>
      {snap ? (
        <>
          <div style={{ margin: '8px 0' }}>
            <strong>Status:</strong> {snap.status}
            {' · '}<strong>Scores:</strong> X={snap.scores.x} O={snap.scores.o}
            {' · '}<strong>Turn:</strong> {yourTurn ? 'You' : snap.turnPlayerId === snap.players.xId ? 'Player X' : 'Player O'}
            {snap.status === 'finished' && (
              <> {' · '}<strong>Winner:</strong> {snap.winnerId ? (snap.winnerId === snap.players.xId ? 'Player X' : 'Player O') : 'Tie'}</>
            )}
          </div>
          {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
          <div style={{ width: '100%', maxWidth: 800, aspectRatio: '1 / 1', border: '1px solid var(--muted)', borderRadius: 8, background: 'var(--panel)' }}>
            <GameBoard snapshot={snap} myUserId={user!.id} disabled={!yourTurn} onEdgeClick={onEdgeClick} />
          </div>
        </>
      ) : (
        <p>Loading state…</p>
      )}
    </main>
  );
}
