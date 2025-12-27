import React from 'react';

// Minimal, dependency-free inline SVG icons resembling Font Awesome shapes
// to avoid introducing new packages. Icons inherit currentColor.

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

export function CopyIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {/* FA-like copy icon path (simplified) */}
      <path d="M64 464c0 26.5 21.5 48 48 48h224c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48H112c-26.5 0-48 21.5-48 48v288zM0 80C0 53.5 21.5 32 48 32h256c17.7 0 32 14.3 32 32v32h-48V80H48v288h32v48H48c-26.5 0-48-21.5-48-48V80z" />
    </svg>
  );
}

export function TrashIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {/* FA-like trash can (simplified solid) */}
      <path d="M32 112c0-8.8 7.2-16 16-16h96l12.8-25.6C164.5 57.8 176.7 48 190.1 48h67.8c13.4 0 25.6 9.8 33.3 22.4L304 96h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H48c-8.8 0-16-7.2-16-16zm48 64h288l-20.2 266.6C345.8 468.2 329.8 480 312 480H136c-17.8 0-33.8-11.8-35.8-37.4L80 176z" />
    </svg>
  );
}

export function IconButton(
  { ariaLabel, title, onClick, disabled, children }: { ariaLabel: string; title?: string; onClick?: React.MouseEventHandler<HTMLButtonElement>; disabled?: boolean; children: React.ReactNode }
) {
  return (
    <button
      aria-label={ariaLabel}
      title={title || ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 6,
        border: '1px solid var(--muted)',
        background: 'var(--panel)',
        color: 'var(--fg)',
        boxShadow: 'var(--shadow-xs, none)'
      }}
    >
      {children}
    </button>
  );
}
