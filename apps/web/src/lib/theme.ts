export type Theme = {
  mode: 'light' | 'dark';
  accent: string; // hex color e.g. #3b82f6
  boardStyle: 'classic' | 'minimal';
};

const THEME_KEY = 'dots_theme_v1';

// Design tokens
export const tokens = {
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '22px',
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
  },
  elevation: {
    xs: '0 1px 2px rgba(0,0,0,0.06)',
    sm: '0 2px 6px rgba(0,0,0,0.08)',
    md: '0 6px 14px rgba(0,0,0,0.12)',
  },
  colors: {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
} as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);
  root.style.setProperty('--accent', theme.accent);
  const rgb = hexToRgb(theme.accent) || { r: 59, g: 130, b: 246 };
  root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--accent-10', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);

  if (theme.mode === 'dark') {
    root.style.setProperty('--bg', '#0e141a');
    root.style.setProperty('--fg', '#e7ecf2');
    root.style.setProperty('--muted', '#93a0b1');
    root.style.setProperty('--panel', '#121a23');
    root.style.setProperty('--border', '#263241');
  } else {
    root.style.setProperty('--bg', '#ffffff');
    root.style.setProperty('--fg', '#111827');
    root.style.setProperty('--muted', '#6b7280');
    root.style.setProperty('--panel', '#f8fafc');
    root.style.setProperty('--border', '#e5e7eb');
  }

  // set token variables for CSS usage
  root.style.setProperty('--radius-sm', tokens.radius.sm);
  root.style.setProperty('--radius-md', tokens.radius.md);
  root.style.setProperty('--radius-lg', tokens.radius.lg);
  root.style.setProperty('--radius-xl', tokens.radius.xl);

  root.style.setProperty('--shadow-xs', tokens.elevation.xs);
  root.style.setProperty('--shadow-sm', tokens.elevation.sm);
  root.style.setProperty('--shadow-md', tokens.elevation.md);

  root.style.setProperty('--danger', tokens.colors.danger);
  root.style.setProperty('--success', tokens.colors.success);
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
