import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({ variant = 'primary', fullWidth, disabled, children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    appearance: 'none',
    border: 'none',
    outline: 'none',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.95rem',
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined,
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 120ms ease, box-shadow 180ms ease, background-color 150ms ease, color 150ms ease',
  };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: 'white',
    },
    secondary: {
      background: 'var(--panel)',
      color: 'var(--fg)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg)',
    },
  };
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
      onMouseDown={(e) => {
        rest.onMouseDown?.(e);
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px) scale(0.99)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-xs)';
      }}
      onMouseUp={(e) => {
        rest.onMouseUp?.(e);
        (e.currentTarget as HTMLButtonElement).style.transform = '';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {children}
    </button>
  );
}

export default Button;
