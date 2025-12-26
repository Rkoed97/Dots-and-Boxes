import React from 'react';
import type { Edge, GameStateSnapshot } from '@shared/core';

export interface GameBoardProps {
  snapshot: GameStateSnapshot;
  myUserId: string;
  disabled?: boolean;
  onEdgeClick?: (edge: Edge) => void;
}

// Simple responsive SVG board
export function GameBoard({ snapshot, myUserId, disabled = false, onEdgeClick }: GameBoardProps) {
  const { n, m, edges, boxes, players } = snapshot;

  const s = 40; // spacing between dots
  const margin = 20;
  const width = (m - 1) * s + margin * 2;
  const height = (n - 1) * s + margin * 2;

  const isMyTurn = snapshot.turnPlayerId === myUserId && snapshot.status !== 'finished';
  const canInteract = isMyTurn && !disabled;

  const dotRadius = 4;
  const lineWidth = 4;
  const hitThickness = 18; // for clickable rects

  function dotX(c: number) { return margin + c * s; }
  function dotY(r: number) { return margin + r * s; }

  function handleEdgeClick(edge: Edge) {
    if (!canInteract) return;
    // avoid clicking already set edges
    if (edge.o === 'H') {
      if (edges.h[edge.row]?.[edge.col]) return;
    } else {
      if (edges.v[edge.row]?.[edge.col]) return;
    }
    onEdgeClick?.(edge);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* Placed horizontal edges */}
      {edges.h.map((row, r) => row.map((set, c) => {
        if (!set) return null;
        const x1 = dotX(c);
        const y = dotY(r);
        const x2 = dotX(c + 1);
        return (
          <line key={`h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke="var(--accent)" strokeWidth={lineWidth} strokeLinecap="round" />
        );
      }))}

      {/* Placed vertical edges */}
      {edges.v.map((col, r) => col.map((set, c) => {
        if (!set) return null;
        const x = dotX(c);
        const y1 = dotY(r);
        const y2 = dotY(r + 1);
        return (
          <line key={`v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke="var(--accent)" strokeWidth={lineWidth} strokeLinecap="round" />
        );
      }))}

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
        const x = dotX(c) + s / 2 - (s / 2);
        const y = dotY(r) - hitThickness / 2;
        return (
          <rect
            key={`hhit-${r}-${c}`}
            x={x}
            y={y}
            width={s}
            height={hitThickness}
            fill="transparent"
            onClick={() => handleEdgeClick({ o: 'H', row: r, col: c })}
            style={{ cursor: 'pointer' }}
          />
        );
      }))}

      {/* Clickable hit areas for vertical edges */}
      {canInteract && edges.v.map((col, r) => col.map((set, c) => {
        if (set) return null;
        const x = dotX(c) - hitThickness / 2;
        const y = dotY(r) + s / 2 - (s / 2);
        return (
          <rect
            key={`vhit-${r}-${c}`}
            x={x}
            y={y}
            width={hitThickness}
            height={s}
            fill="transparent"
            onClick={() => handleEdgeClick({ o: 'V', row: r, col: c })}
            style={{ cursor: 'pointer' }}
          />
        );
      }))}

      {/* Dots */}
      {Array.from({ length: n }).map((_, r) => (
        Array.from({ length: m }).map((__, c) => (
          <circle key={`d-${r}-${c}`} cx={dotX(c)} cy={dotY(r)} r={dotRadius} fill="var(--fg)" />
        ))
      ))}

      {/* Overlay text for current turn and scores (outside board area positioning using SVG foreignObject omitted; keep simple below) */}
    </svg>
  );
}

export default GameBoard;
