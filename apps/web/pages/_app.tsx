import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect } from 'react';
import '@/styles/globals.css';
import { loadSavedTheme, applyTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

export default function MyApp({ Component, pageProps }: AppProps) {
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const t = loadSavedTheme();
        if (t) applyTheme(t);
    }, []);

    const siteUrl =
        (process.env.NEXT_PUBLIC_SITE_URL || 'https://dots.deskbuddy.cc').replace(/\/+$/, '');

    const ogImage = `${siteUrl}/og_banner.png`;

    return (
        <>
            <Head>
                {/* Primary */}
                <title>Dots & Boxes — Online Multiplayer</title>
                <meta
                    name="description"
                    content="Play Dots & Boxes online with friends. A playful, modern multiplayer strategy game."
                />

                {/* Favicons */}
                <link rel="icon" href="/favicon.ico" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

                {/* PWA / Android */}
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#6EC6FF" />

                {/* Canonical URL (VERY IMPORTANT) */}
                <link rel="canonical" href={siteUrl} />

                {/* Open Graph */}
                <meta property="og:title" content="Dots & Boxes — Online Multiplayer" />
                <meta property="og:description" content="A playful online multiplayer version of the classic Dots & Boxes game." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={siteUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Dots & Boxes — Online Multiplayer" />
                <meta
                    name="twitter:description"
                    content="Play Dots & Boxes online with friends."
                />
                <meta name="twitter:image" content="/android-chrome-512x512.png" />
            </Head>

            <div>
                <header
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--muted)',
                        background: 'var(--panel)',
                    }}
                >
                    <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link href="/">Home</Link>
                        <Link href="/lobby">Lobby</Link>
                        <Link href="/profile">Profile</Link>
                        <Link href="/settings">Settings</Link>
                        <span style={{ marginLeft: 'auto' }} />
                        {user ? (
                            <>
                <span style={{ color: 'var(--muted)' }}>
                  Signed in as {user.username}
                </span>
                                <button
                                    onClick={async () => {
                                        await logout();
                                        router.push('/login');
                                    }}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid var(--muted)',
                                        borderRadius: 6,
                                    }}
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
        </>
    );
}
