import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applyTheme, loadSavedTheme, saveTheme, type Theme } from '@/lib/theme';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleMode: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPref: Theme['mode'] = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const [theme, setTheme] = useState<Theme>(() => loadSavedTheme() || { mode: systemPref, accent: '#8da8ff', boardStyle: 'classic' });

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme((t) => ({ ...t, mode: mq.matches ? 'dark' : 'light' }));
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const toggleMode = useCallback(() => setTheme((t) => ({ ...t, mode: t.mode === 'light' ? 'dark' : 'light' })), []);

  const value = useMemo(() => ({ theme, setTheme, toggleMode }), [theme, toggleMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
