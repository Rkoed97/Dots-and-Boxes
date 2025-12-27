import React, { useState } from 'react';
import type { Edge, GameStateSnapshot } from '@shared/core';

export interface GameBoardProps {
  snapshot: GameStateSnapshot;
  myUserId: string;
  disabled?: boolean;
  onEdgeClick?: (edge: Edge) => void;
}

// Responsive SVG board with subtle organic styling
export function GameBoard({ snapshot, myUserId, disabled = false, onEdgeClick }: GameBoardProps) {
  const { n, m, edges, boxes } = snapshot;

  const s = 40; // spacing between dots
  const margin = 20;
  const width = (m - 1) * s + margin * 2;
  const height = (n - 1) * s + margin * 2;

  const isMyTurn = snapshot.turnPlayerId === myUserId && snapshot.status !== 'finished';
  const canInteract = isMyTurn && !disabled;

  const dotRadius = Math.max(3, Math.min(5, Math.round(s * 0.09)));
  const lineWidth = Math.max(4, Math.min(6, Math.round(s * 0.18)));
  const hitThickness = 24; // bigger hit areas for touch devices

  const [hover, setHover] = useState<Edge | null>(null);

  function dotX(c: number) { return margin + c * s; }
  function dotY(r: number) { return margin + r * s; }

  const isSet = (e: Edge) => e.o === 'H' ? !!edges.h[e.row]?.[e.col] : !!edges.v[e.row]?.[e.col];

  function handleEdgeClick(edge: Edge) {
    if (!canInteract) return;
    if (isSet(edge)) return; // avoid clicking already set edges
    onEdgeClick?.(edge);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Placed horizontal edges */}
      {edges.h.map((row, r) => row.map((set, c) => {
        if (!set) return null;
        const x1 = dotX(c);
        const y = dotY(r);
        const x2 = dotX(c + 1);
        return (
          <line key={`h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke="var(--accent)" strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />
        );
      }))}

      {/* Placed vertical edges */}
      {edges.v.map((col, r) => col.map((set, c) => {
        if (!set) return null;
        const x = dotX(c);
        const y1 = dotY(r);
        const y2 = dotY(r + 1);
        return (
          <line key={`v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke="var(--accent)" strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />
        );
      }))}

      {/* Hover preview for available edge */}
      {canInteract && hover && !isSet(hover) && (
        hover.o === 'H' ? (
          <line x1={dotX(hover.col)} y1={dotY(hover.row)} x2={dotX(hover.col + 1)} y2={dotY(hover.row)}
                stroke={`rgba(var(--accent-rgb), 0.5)`} strokeWidth={lineWidth}
                strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <line x1={dotX(hover.col)} y1={dotY(hover.row)} x2={dotX(hover.col)} y2={dotY(hover.row + 1)}
                stroke={`rgba(var(--accent-rgb), 0.5)`} strokeWidth={lineWidth}
                strokeLinecap="round" strokeLinejoin="round" />
        )
      )}

      {/* Boxes owners */}
      {boxes.map((row, r) => row.map((owner, c) => {
        if (owner === 'none') return null;
        const cx = (dotX(c) + dotX(c + 1)) / 2;
        const cy = (dotY(r) + dotY(r + 1)) / 2;
        const label = owner.toUpperCase();
        const color = owner === 'x' ? '#10b981' : '#f97316';
        return (
          <text key={`b-${r}-${c}`} x={cx} y={cy + 6} textAnchor="middle" fontSize={s * 0.5} fontWeight={700} fill={color}>
            {label}
          </text>
        );
      }))}

      {/* Clickable hit areas for horizontal edges */}
      {canInteract && edges.h.map((row, r) => row.map((set, c) => {
        if (set) return null;
        const x = dotX(c);
        const y = dotY(r) - hitThickness / 2;
        return (
          <rect
            key={`hhit-${r}-${c}`}
            x={x}
            y={y}
            width={s}
            height={hitThickness}
            fill="transparent"
            onMouseEnter={() => setHover({ o: 'H', row: r, col: c })}
            onMouseLeave={() => setHover((h) => (h && h.o === 'H' && h.row === r && h.col === c ? null : h))}
            onClick={() => handleEdgeClick({ o: 'H', row: r, col: c })}
            style={{ cursor: 'pointer' }}
          />
        );
      }))}

      {/* Clickable hit areas for vertical edges */}
      {canInteract && edges.v.map((col, r) => col.map((set, c) => {
        if (set) return null;
        const x = dotX(c) - hitThickness / 2;
        const y = dotY(r);
        return (
          <rect
            key={`vhit-${r}-${c}`}
            x={x}
            y={y}
            width={hitThickness}
            height={s}
            fill="transparent"
            onMouseEnter={() => setHover({ o: 'V', row: r, col: c })}
            onMouseLeave={() => setHover((h) => (h && h.o === 'V' && h.row === r && h.col === c ? null : h))}
            onClick={() => handleEdgeClick({ o: 'V', row: r, col: c })}
            style={{ cursor: 'pointer' }}
          />
        );
      }))}

      {/* Faded dots */}
      {Array.from({ length: n }).map((_, r) => (
        Array.from({ length: m }).map((__, c) => (
          <circle key={`d-${r}-${c}`} cx={dotX(c)} cy={dotY(r)} r={dotRadius} fill="var(--fg)" opacity={0.28} />
        ))
      ))}
    </svg>
  );
}

export default GameBoard;
