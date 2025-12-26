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
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/settings">Settings</a></li>
          <li><a href="/lobby">Lobby</a></li>
          <li><a href="/game/test-match">Sample Game</a></li>
        </ul>
      </nav>
    </main>
  );
}
