export type Theme = {
  mode: 'light' | 'dark';
  accent: string;
  boardStyle: 'classic' | 'minimal';
};

const THEME_KEY = 'dots_theme_v1';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);
  root.style.setProperty('--accent', theme.accent);
  // Simple palettes
  if (theme.mode === 'dark') {
    root.style.setProperty('--bg', '#0b0f14');
    root.style.setProperty('--fg', '#e8edf2');
    root.style.setProperty('--muted', '#7a8696');
    root.style.setProperty('--panel', '#121821');
  } else {
    root.style.setProperty('--bg', '#ffffff');
    root.style.setProperty('--fg', '#0b1220');
    root.style.setProperty('--muted', '#6b7280');
    root.style.setProperty('--panel', '#f5f7fb');
  }
}

export function saveTheme(theme: Theme) {
  try { localStorage.setItem(THEME_KEY, JSON.stringify(theme)); } catch {}
}

export function loadSavedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (t && (t.mode === 'light' || t.mode === 'dark') && typeof t.accent === 'string' && (t.boardStyle === 'classic' || t.boardStyle === 'minimal')) {
      return t as Theme;
    }
  } catch {}
  return null;
}
