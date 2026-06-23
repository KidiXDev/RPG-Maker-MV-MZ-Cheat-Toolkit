import type { InputHTMLAttributes } from 'react';

type InputProps = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm text-rmc-slate">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`rounded-lg border bg-rmc-abyss px-4 py-3 text-sm text-rmc-mist outline-none transition focus:border-rmc-aether ${
          error ? 'border-rmc-danger/60' : 'border-white/10'
        } ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-rmc-danger">{error}</p> : null}
    </div>
  );
}
