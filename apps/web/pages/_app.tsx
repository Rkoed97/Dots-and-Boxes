import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
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
          <a href="/dots-and-boxes/">Home</a>
          <a href="/dots-and-boxes/lobby">Lobby</a>
          <a href="/dots-and-boxes/profile">Profile</a>
          <a href="/dots-and-boxes/settings">Settings</a>
          <span style={{ marginLeft: 'auto' }} />
          {user ? (
            <>
              <span style={{ color: 'var(--muted)' }}>Signed in as {user.username}</span>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/dots-and-boxes/login');
                }}
                style={{ padding: '6px 10px', border: '1px solid var(--muted)', borderRadius: 6 }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/dots-and-boxes/login">Login</a>
              <a href="/dots-and-boxes/register">Register</a>
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
