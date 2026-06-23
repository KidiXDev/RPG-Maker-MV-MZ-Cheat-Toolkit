import type { InputHTMLAttributes } from 'react';

type NumberInputProps = {
  label?: string;
  maxLabel?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function NumberInput({ label, maxLabel, error, className = '', id, ...props }: NumberInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm text-rmc-slate">
          {label}
        </label>
      ) : null}
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <input
          id={inputId}
          type="number"
          className={`w-full rounded-lg border bg-rmc-abyss px-3 py-2 font-rmc-mono text-sm text-rmc-mist outline-none transition focus:border-rmc-aether ${
            error ? 'border-rmc-danger/60' : 'border-white/10'
          } ${className}`}
          {...props}
        />
        {maxLabel ? <span className="shrink-0 text-sm text-rmc-slate">/ {maxLabel}</span> : null}
      </div>
      {error ? <p className="text-xs text-rmc-danger">{error}</p> : null}
    </div>
  );
}
