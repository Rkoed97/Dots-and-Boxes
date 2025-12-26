import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, style, id, ...rest }: InputProps) {
  const inputId = id || rest.name || undefined;
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      {label && (
        <label htmlFor={inputId} style={{ display: 'block', margin: '0 0 var(--space-1)', fontWeight: 600 }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--fg)',
          outline: 'none',
          boxShadow: 'var(--shadow-xs) inset',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          ...style,
        }}
        onFocus={(e) => {
          rest.onFocus?.(e);
          (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--accent-10)';
        }}
        onBlur={(e) => {
          rest.onBlur?.(e);
          (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-xs) inset';
        }}
      />
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>{error}</div>
      )}
    </div>
  );
}

export default Input;
