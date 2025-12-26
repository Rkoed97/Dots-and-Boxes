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

  function waitForSocketConnect(sock: ReturnType<typeof getSocket>, timeoutMs = 4000) {
    return new Promise<void>((resolve, reject) => {
      if (sock.connected) return resolve();
      let done = false;
      const onConnect = () => { if (done) return; done = true; cleanup(); resolve(); };
      const onError = (_err: any) => { if (done) return; done = true; cleanup(); reject(new Error('Unable to connect to realtime server.')); };
      const timer = setTimeout(() => { if (done) return; done = true; cleanup(); reject(new Error('Timeout connecting to realtime server.')); }, timeoutMs);
      function cleanup() { clearTimeout(timer); sock.off('connect', onConnect); sock.off('connect_error', onError); }
      sock.on('connect', onConnect);
      sock.on('connect_error', onError);
      try { sock.connect(); } catch {}
    });
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sock = getSocket();
      await waitForSocketConnect(sock, 4000);
      const nn = clamp(n);
      const mm = clamp(m);
      // Wrap emit with an ack timeout to avoid hanging UI
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const to = setTimeout(() => {
          if (settled) return; settled = true; reject(new Error('Realtime request timed out. Please try again.'));
        }, 8000);
        try {
          sock.emit('lobby:createMatch', { n: nn, m: mm }, (resp?: { matchId: string }) => {
            if (settled) return; settled = true; clearTimeout(to);
            if (resp?.matchId) {
              router.push(`/game/${resp.matchId}`);
              resolve();
            } else {
              reject(new Error('Server did not return a match id.'));
            }
          });
        } catch (err) {
          if (settled) return; settled = true; clearTimeout(to); reject(err as any);
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
