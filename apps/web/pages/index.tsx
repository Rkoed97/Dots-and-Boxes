import { useEffect, useState } from 'react';
import { apiFetch, API_BASE, WS_PATH } from '@/lib/api';
import type { GameStateSnapshot } from '@shared/core';

export default function HomePage() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/health');
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setStatus(data?.status === 'ok' ? 'ok' : 'error');
            setMessage(JSON.stringify(data));
          } else {
            setStatus('error');
            setMessage(res.status + ' ' + res.statusText);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(String(e?.message ?? e));
        }
      }
    })();
    return () => {
      cancelled = true;
    }
  }, []);

  // type-only reference ensures @shared/core resolves in web
  const _t: Partial<GameStateSnapshot> | null = null;

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dots & Boxes</h1>
      <p>Base path: <code>/dots-and-boxes</code></p>
      <section style={{ marginTop: 16 }}>
        <h2>API connectivity test</h2>
        <p>Fetching: <code>{API_BASE}/health</code></p>
        <p>Status: <strong>{status}</strong></p>
        {message && (
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 6 }}>
            {message}
          </pre>
        )}
        <p>WS path: <code>{WS_PATH}</code></p>
      </section>
      <nav style={{ marginTop: 24 }}>
        <ul>
          <li><a href="/dots-and-boxes/login">Login</a></li>
          <li><a href="/dots-and-boxes/register">Register</a></li>
          <li><a href="/dots-and-boxes/profile">Profile</a></li>
          <li><a href="/dots-and-boxes/settings">Settings</a></li>
          <li><a href="/dots-and-boxes/lobby">Lobby</a></li>
          <li><a href="/dots-and-boxes/game/test-match">Sample Game</a></li>
        </ul>
      </nav>
    </main>
  );
}
