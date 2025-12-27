import { FormEvent, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import GamesCard from '@/components/profile/GamesCard';

export default function ProfilePage() {
  const { ready, user, refresh } = useRequireAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) setUsername(user.username);
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify({ username }) });
      if (!res.ok) {
        const txt = await safeMsg(res);
        throw new Error(txt || 'Update failed');
      }
      await refresh();
      setMsg('Updated!');
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="container">
      <h1>Profile</h1>
      <div className="card">
        <p><strong>Email:</strong> {user?.email}</p>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={32} required />
          </div>
          {msg && <p style={{ color: msg === 'Updated!' ? 'green' : 'crimson' }}>{msg}</p>}
          <button disabled={loading} style={{ padding: '8px 12px', border: '1px solid var(--muted)', borderRadius: 6 }}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
      <div style={{ marginTop: 16 }}>
        <GamesCard />
      </div>
    </main>
  );
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return j?.message || j?.error || res.statusText; } catch { return res.statusText; }
}
