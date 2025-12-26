import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
      if (!res.ok) {
        const msg = await safeMsg(res);
        throw new Error(msg || 'Registration failed');
      }
      router.push('/login');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Register</h1>
      <div className="card">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={32} required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} required />
          </div>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          <button disabled={loading} style={{ padding: '8px 12px', border: '1px solid var(--muted)', borderRadius: 6 }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: 12 }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </main>
  );
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return j?.message || j?.error || res.statusText; } catch { return res.statusText; }
}
