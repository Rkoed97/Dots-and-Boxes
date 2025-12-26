import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect } from 'react';
import '@/styles/globals.css';
import { loadSavedTheme, applyTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const t = loadSavedTheme();
    if (t) applyTheme(t);
  }, []);

  return (
    <div>
      <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--muted)', background: 'var(--panel)' }}>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/">Home</Link>
          <Link href="/lobby">Lobby</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/settings">Settings</Link>
          <span style={{ marginLeft: 'auto' }} />
          {user ? (
            <>
              <span style={{ color: 'var(--muted)' }}>Signed in as {user.username}</span>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/login');
                }}
                style={{ padding: '6px 10px', border: '1px solid var(--muted)', borderRadius: 6 }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
