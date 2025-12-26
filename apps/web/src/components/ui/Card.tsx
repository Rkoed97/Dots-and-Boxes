import React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={(rest.className ? rest.className + ' ' : '') + 'card'}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        boxShadow: 'var(--shadow-sm)',
        padding: padded ? '16px' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
