import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type MyGame = {
  id: string;
  title?: string;
  createdAt?: string;
  status?: string;
  playerCount?: number;
};

export function useMyGames() {
  const [games, setGames] = useState<MyGame[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const didInit = useRef(false);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/matches/mine');
      if (!res.ok) {
        const msg = await safeMsg(res);
        throw new Error(msg || 'Failed to load games');
      }
      const data = (await res.json()) as { games: MyGame[] };
      setGames(data.games ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchGames();
  }, [fetchGames]);

  const deleteGame = useCallback(async (gameId: string) => {
    if (!gameId) return { ok: false as const, error: 'Invalid id' };
    setDeletingId(gameId);
    try {
      const res = await apiFetch(`/matches/${gameId}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await safeMsg(res);
        return { ok: false as const, error: msg || 'Delete failed' };
      }
      // Optimistic update: remove from state
      setGames((prev) => (prev ? prev.filter((g) => g.id !== gameId) : prev));
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? String(e) };
    } finally {
      setDeletingId((id) => (id === gameId ? null : id));
    }
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    fetchGames();
  }, [fetchGames]);

  return { games: games ?? [], isLoading, error, refetch, deleteGame, deletingId } as const;
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return (j as any)?.message || (j as any)?.error || res.statusText; } catch { return res.statusText; }
}
