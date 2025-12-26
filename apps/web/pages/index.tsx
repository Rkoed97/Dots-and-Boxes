import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { GameStateSnapshot } from '@shared/core';

export default function HomePage() {
  const { user } = useAuth();
  // type-only reference ensures @shared/core resolves in web
  const _t: Partial<GameStateSnapshot> | null = null;

  return (
    <main style={{ padding: '24px 16px' }}>
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 24,
        alignItems: 'center',
        maxWidth: 1120,
        margin: '0 auto',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--accent-10)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 999 }} />
            <span style={{ fontWeight: 700 }}>Playful strategy, anytime</span>
          </div>
          <h1 style={{ marginTop: 12 }}>Dots & Boxes</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 560 }}>
            Claim edges, complete boxes, and outsmart your opponent on a clean, responsive board.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link href="/lobby" style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)',
                  color: 'white',
                  boxShadow: 'var(--shadow-sm)'
                }}>Go to Lobby</Link>
                <span style={{ alignSelf: 'center', color: 'var(--muted)' }}>Welcome back, <strong>{user.username}</strong>!</span>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)',
                  color: 'white',
                  boxShadow: 'var(--shadow-sm)'
                }}>Login</Link>
                <Link href="/register" style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--panel)',
                  color: 'var(--fg)',
                }}>Create account</Link>
              </>
            )}
          </div>
        </div>
        <div style={{
          width: '100%',
          maxWidth: 720,
          aspectRatio: '1 / 1',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          background: 'var(--panel)'
        }}>
          <HeroAnimation />
        </div>
      </section>
    </main>
  );
}

function HeroAnimation() {
  // Deterministic sample animation: draw a few edges on a 5x5 grid in a loop
  const n = 5, m = 5;
  const s = 40; const margin = 24;
  const width = (m - 1) * s + margin * 2;
  const height = (n - 1) * s + margin * 2;
  const dot = (c:number,r:number) => ({ x: margin + c * s, y: margin + r * s });
  const seq = [
    // horizontal edges row 0..3, col 0..2
    { o:'H', r:0, c:0 }, { o:'H', r:0, c:1 }, { o:'H', r:0, c:2 },
    { o:'V', r:0, c:0 }, { o:'V', r:1, c:0 }, { o:'V', r:2, c:0 },
    { o:'H', r:3, c:0 }, { o:'H', r:3, c:1 }, { o:'H', r:3, c:2 },
    { o:'V', r:0, c:3 }, { o:'V', r:1, c:3 }, { o:'V', r:2, c:3 },
  ] as const;

  const dash = 100; // big enough for animation

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>
          {`
            .edge { stroke: var(--accent); stroke-width: 5; stroke-linecap: round; filter: url(#edgeGlow); }
            .edge-anim { stroke-dasharray: ${dash}; stroke-dashoffset: ${dash}; animation: draw 1.4s ease forwards; }
            @keyframes draw { to { stroke-dashoffset: 0; } }
          `}
        </style>
      </defs>

      {/* Faded dots */}
      {Array.from({ length: n }).map((_, r) => (
        Array.from({ length: m }).map((__, c) => {
          const p = dot(c,r);
          return <circle key={`d-${r}-${c}`} cx={p.x} cy={p.y} r={4} fill="var(--fg)" opacity={0.35} />
        })
      ))}

      {/* Animated sample edges (looped using staggered CSS, then rely on SVG reload on route changes) */}
      {seq.map((e, i) => {
        const delay = 0.25 * i;
        if (e.o === 'H') {
          const p1 = dot(e.c, e.r); const p2 = dot(e.c + 1, e.r);
          return <line key={`h-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="edge edge-anim" style={{ animationDelay: `${delay}s` }} />
        }
        const p1 = dot(e.c, e.r); const p2 = dot(e.c, e.r + 1);
        return <line key={`v-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="edge edge-anim" style={{ animationDelay: `${delay}s` }} />
      })}
    </svg>
  );
}
