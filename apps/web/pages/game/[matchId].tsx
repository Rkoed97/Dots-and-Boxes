import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRequireAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import { apiFetch } from '@/lib/api';
import GameBoard from '@/components/GameBoard';
import RematchModal from '@/components/RematchModal';
import Button from '@/components/ui/Button';
import type { Edge, GameStateSnapshot } from '@shared/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

export default function GamePage() {
  const router = useRouter();
  const { ready, user } = useRequireAuth();
  const { matchId } = router.query;

  const [snap, setSnap] = useState<GameStateSnapshot | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [rematchProposal, setRematchProposal] = useState<{ creatorId: string; creatorName?: string; newMatchId: string } | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [isProposing, setIsProposing] = useState(false);

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
    const onRematchProposed = (p: { finishedMatchId: string; newMatchId: string; creatorId: string; creatorName?: string }) => {
      if (p.finishedMatchId === matchIdStr) {
        setRematchProposal(p);
      }
    };
    const onRematchAccepted = (p: { finishedMatchId: string; newMatchId: string }) => {
      if (p.finishedMatchId === matchIdStr) {
        router.push(`/game/${p.newMatchId}`);
      }
    };
    const onRematchRejected = (p: { finishedMatchId: string }) => {
      if (p.finishedMatchId === matchIdStr) {
        setRematchProposal(null);
        setMsg('Rematch declined');
        setTimeout(() => setMsg(null), 2000);
        setIsProposing(false);
      }
    };

    sock.on('game:state', onState);
    sock.on('game:moveRejected', onRejected);
    sock.on('game:ended', onEnded);
    sock.on('game:rematchProposed', onRematchProposed);
    sock.on('game:rematchAccepted', onRematchAccepted);
    sock.on('game:rematchRejected', onRematchRejected);

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
      sock.off('game:rematchProposed', onRematchProposed);
      sock.off('game:rematchAccepted', onRematchAccepted);
      sock.off('game:rematchRejected', onRematchRejected);
    };
  }, [ready, user, matchIdStr]);

  function onEdgeClick(edge: Edge) {
    if (!matchIdStr) return;
    const seq = clientSeqRef.current;
    clientSeqRef.current = seq + 1;
    getSocket().emit('game:move', { matchId: matchIdStr, edge, clientSeq: seq });
  }

  async function onProposeRematch() {
    if (!matchIdStr) return;
    setIsProposing(true);
    try {
      const resp = await apiFetch(`/matches/${matchIdStr}/rematch/propose`, { method: 'POST' });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.message || 'Failed to propose rematch');
      }
    } catch (e: any) {
      setMsg(e.message);
      setTimeout(() => setMsg(null), 2000);
      setIsProposing(false);
    }
  }

  async function onRespondRematch(decision: 'ACCEPT' | 'REJECT') {
    if (!matchIdStr) return;
    setIsResponding(true);
    try {
      const resp = await apiFetch(`/matches/${matchIdStr}/rematch/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.message || 'Failed to respond to rematch');
      }
      if (decision === 'REJECT') {
        setRematchProposal(null);
      }
    } catch (e: any) {
      setMsg(e.message);
      setTimeout(() => setMsg(null), 2000);
    } finally {
      setIsResponding(false);
    }
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
              <>
                {' · '}<strong>Winner:</strong> {snap.winnerId ? (snap.winnerId === snap.players.xId ? 'Player X' : 'Player O') : 'Tie'}
                {user && snap.players.xId === user.id && (
                  <Button
                    variant="primary"
                    style={{ marginLeft: 16, padding: '4px 12px', fontSize: '0.85rem' }}
                    onClick={onProposeRematch}
                    disabled={isProposing || snap.rematchStatus === 'PROPOSED' || snap.rematchStatus === 'ACCEPTED'}
                  >
                    {isProposing || snap.rematchStatus === 'PROPOSED' ? 'Waiting for opponent...' : snap.rematchStatus === 'ACCEPTED' ? 'Redirecting...' : 'Rematch'}
                  </Button>
                )}
              </>
            )}
          </div>
          {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
          <div style={{ width: '100%', maxWidth: 'min(96vw, 720px)', aspectRatio: '1 / 1', margin: '8px auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
            <GameBoard snapshot={snap} myUserId={user!.id} disabled={!yourTurn} onEdgeClick={onEdgeClick} />
          </div>
          <RematchModal
            isOpen={!!rematchProposal && user?.id !== rematchProposal.creatorId}
            creatorName={rematchProposal?.creatorName}
            onAccept={() => onRespondRematch('ACCEPT')}
            onReject={() => onRespondRematch('REJECT')}
            isProcessing={isResponding}
          />
        </>
      ) : (
        <p>Loading state…</p>
      )}
    </main>
  );
}
