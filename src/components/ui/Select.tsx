import type { SelectHTMLAttributes } from 'react';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label?: string;
  options: SelectOption[];
  error?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, options, error, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm text-rmc-slate">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-lg border bg-rmc-abyss px-4 py-3 pr-10 text-sm text-rmc-mist outline-none transition focus:border-rmc-aether ${
            error ? 'border-rmc-danger/60' : 'border-white/10'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-rmc-slate"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? <p className="text-xs text-rmc-danger">{error}</p> : null}
    </div>
  );
}
