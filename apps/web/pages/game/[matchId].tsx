import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRequireAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import GameBoard from '@/components/GameBoard';
import type { Edge, GameStateSnapshot } from '@shared/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

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
    // TS note: some environments may lag behind shared types for ack; cast to any for emit here
    (sock as any).emit('lobby:joinMatch', { matchId: matchIdStr }, (resp?: { ok?: true } | { error?: string }) => {
      if (!resp) return;
      if ('error' in resp && resp.error) {
        setMsg(resp.error === 'MATCH_NOT_FOUND' ? 'Match not found' : resp.error === 'MATCH_FULL' ? 'Match is full' : 'Unable to join match');
        setTimeout(() => router.push('/lobby'), 1200);
      }
    });

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
      <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Match ID: <code>{String(matchIdStr ?? '')}</code>
        <button
          aria-label="Copy match ID"
          title="Copy match ID"
          onClick={async () => {
            try {
              if (!matchIdStr) throw new Error('No match ID');
              await navigator.clipboard.writeText(matchIdStr);
              setMsg('Copied match ID');
              setTimeout(() => setMsg(null), 1200);
            } catch {
              setMsg('Copy failed');
              setTimeout(() => setMsg(null), 1500);
            }
          }}
          disabled={!matchIdStr}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--muted)', background: 'var(--panel)', color: 'var(--fg)' }}
        >
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </p>
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
          <div style={{ width: '100%', maxWidth: 'min(96vw, 720px)', aspectRatio: '1 / 1', margin: '8px auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
            <GameBoard snapshot={snap} myUserId={user!.id} disabled={!yourTurn} onEdgeClick={onEdgeClick} />
          </div>
        </>
      ) : (
        <p>Loading state…</p>
      )}
    </main>
  );
}
