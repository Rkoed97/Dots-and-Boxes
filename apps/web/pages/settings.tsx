import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { applyTheme, saveTheme, loadSavedTheme, type Theme } from '@/lib/theme';

const defaultTheme: Theme = { mode: 'light', accent: '#3b82f6', boardStyle: 'classic' };

export default function SettingsPage() {
  const { ready } = useRequireAuth();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/users/me/settings');
        if (res.ok) {
          const t = await res.json();
          if (!cancelled) {
            setTheme(t);
            applyTheme(t);
          }
        } else {
          // fallback to local or default
          const local = loadSavedTheme();
          if (local) { setTheme(local); applyTheme(local); }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch('/users/me/settings', { method: 'PUT', body: JSON.stringify(theme) });
      if (!res.ok) {
        const txt = await safeMsg(res);
        throw new Error(txt || 'Save failed');
      }
      const saved = await res.json();
      applyTheme(saved);
      saveTheme(saved);
      setMsg('Saved!');
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) return null;

  return (
    <main className="container">
      <h1>Settings</h1>
      <div className="card">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Mode</label>
            <select value={theme.mode} onChange={(e) => setTheme({ ...theme, mode: e.target.value as Theme['mode'] })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-row">
            <label>Accent color</label>
            <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Board style</label>
            <select value={theme.boardStyle} onChange={(e) => setTheme({ ...theme, boardStyle: e.target.value as Theme['boardStyle'] })}>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          {msg && <p style={{ color: msg === 'Saved!' ? 'green' : 'crimson' }}>{msg}</p>}
          <button disabled={saving} style={{ padding: '8px 12px', border: '1px solid var(--muted)', borderRadius: 6 }}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>
    </main>
  );
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return j?.message || j?.error || res.statusText; } catch { return res.statusText; }
}
