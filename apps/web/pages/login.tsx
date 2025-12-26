import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await safeMsg(res);
        throw new Error(msg || 'Login failed');
      }
      await refresh();
      router.push('/dots-and-boxes/lobby');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Login</h1>
      <div className="card">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          <button disabled={loading} style={{ padding: '8px 12px', border: '1px solid var(--muted)', borderRadius: 6 }}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: 12 }}>
          No account? <a href="/dots-and-boxes/register">Register</a>
        </p>
      </div>
    </main>
  );
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return j?.message || j?.error || res.statusText; } catch { return res.statusText; }
}
