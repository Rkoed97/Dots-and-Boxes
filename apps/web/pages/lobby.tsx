import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useRequireAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';

export default function LobbyPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [n, setN] = useState(11);
  const [m, setM] = useState(11);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clamp(v: number) { return Math.max(11, Math.min(19, Math.floor(v || 11))); }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sock = getSocket();
      const nn = clamp(n);
      const mm = clamp(m);
      await new Promise<void>((resolve, reject) => {
        try {
          sock.emit('lobby:createMatch', { n: nn, m: mm }, (resp?: { matchId: string }) => {
            if (resp?.matchId) {
              router.push(`/dots-and-boxes/game/${resp.matchId}`);
              resolve();
            } else {
              reject(new Error('No matchId returned'));
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;
  return (
    <main className="container">
      <h1>Lobby</h1>
      <div className="card">
        <form onSubmit={onCreate}>
          <div className="form-row">
            <label>Rows (N)</label>
            <input type="number" min={11} max={19} value={n} onChange={(e) => setN(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label>Cols (M)</label>
            <input type="number" min={11} max={19} value={m} onChange={(e) => setM(Number(e.target.value))} />
          </div>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          <button disabled={loading} style={{ padding: '8px 12px', border: '1px solid var(--muted)', borderRadius: 6 }}>
            {loading ? 'Creating…' : 'Create Match'}
          </button>
        </form>
      </div>
    </main>
  );
}
