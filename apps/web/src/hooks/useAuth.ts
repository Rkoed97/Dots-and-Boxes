import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    refresh();
  }, [refresh]);

  return { user, loading, error, refresh, logout };
}

// Hook for requiring auth on a page. If not authed, redirect to /login.
export function useRequireAuth() {
  const { user, loading, refresh, logout } = useAuth();
  const [redirected, setRedirected] = useState(false);
  useEffect(() => {
    if (!loading && !user && !redirected) {
      setRedirected(true);
      // Next.js will respect basePath; using absolute path is fine too
      window.location.assign('/dots-and-boxes/login');
    }
  }, [loading, user, redirected]);
  const ready = !loading && !!user;
  return { user, loading, ready, refresh, logout } as const;
}
