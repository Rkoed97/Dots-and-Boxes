import Link from 'next/link';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import { useMyGames } from '@/hooks/useMyGames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function GamesCard() {
  const { games, isLoading, error, refetch, deleteGame, deletingId } = useMyGames();
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete(id: string) {
    setMsg(null);
    const ok = window.confirm('Are you sure you want to delete this game? This cannot be undone.');
    if (!ok) return;
    const res = await deleteGame(id);
    if (!res.ok) {
      setMsg(res.error || 'Delete failed');
    }
  }

  async function onCopy(matchId?: string | null) {
    try {
      if (!matchId) throw new Error('No match ID available');
      await navigator.clipboard.writeText(matchId);
      setMsg('Copied match ID');
      setTimeout(() => setMsg(null), 1200);
    } catch (e: any) {
      setMsg('Copy failed');
      setTimeout(() => setMsg(null), 1500);
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Games</h2>
        <button onClick={() => refetch()} disabled={isLoading} style={{ padding: '6px 10px', border: '1px solid var(--muted)', borderRadius: 6 }}>
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {msg && <p style={{ color: 'crimson', marginTop: 4 }}>{msg}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {isLoading && games.length === 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ height: 12, width: 180, background: 'var(--accent-10)', borderRadius: 4 }} />
            </li>
          ))}
        </ul>
      )}
      {!isLoading && games.length === 0 && !error && (
        <p style={{ color: 'var(--muted)' }}>You are not part of any games yet. Create one in the Lobby!</p>
      )}
      {games.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {games.map((g) => (
            <li key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{g.title || `Game #${g.id.slice(0, 8)}`}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {g.status ? `Status: ${g.status}` : null}
                  {g.playerCount != null ? ` · Players: ${g.playerCount}` : null}
                  {g.createdAt ? ` · Created: ${new Date(g.createdAt).toLocaleString()}` : null}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  aria-label="Copy match ID"
                  title="Copy match ID"
                  onClick={() => onCopy(g.matchId)}
                  disabled={!g.matchId}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--muted)', background: 'var(--panel)', color: 'var(--fg)' }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                <Link href={`/game/${g.matchId ?? g.id}`} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-sm)' }}>
                  Join
                </Link>
                <button
                  aria-label="Delete game"
                  title="Delete game"
                  onClick={() => onDelete(g.id)}
                  disabled={deletingId === g.id}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid crimson', color: 'crimson', background: 'transparent', opacity: deletingId === g.id ? 0.6 : 1 }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
