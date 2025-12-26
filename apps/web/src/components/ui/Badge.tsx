import React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'accent' | 'success' | 'muted';
};

export function Badge({ tone = 'muted', style, children, ...rest }: BadgeProps) {
  const toneClass = tone === 'accent' ? 'badge-accent' : tone === 'success' ? 'badge-success' : 'badge-muted';
  return (
    <span
      {...rest}
      className={(rest.className ? rest.className + ' ' : '') + `badge ${toneClass}`}
      style={{ fontWeight: 600, ...style }}
    >
      {children}
    </span>
  );
}

export default Badge;
