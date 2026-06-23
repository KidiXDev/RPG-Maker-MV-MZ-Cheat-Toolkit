import { useState } from 'react';

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange(value: number): void;
};

export function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(String(value));
  }

  function commit() {
    let numeric = Number(localValue);
    if (isNaN(numeric)) {
      setLocalValue(String(value));
      return;
    }
    if (min !== undefined && numeric < min) {
      numeric = min;
    }
    if (max !== undefined && numeric > max) {
      numeric = max;
    }
    setLocalValue(String(numeric));
    // Only fire onChange if value has actually changed to prevent duplicate toasts
    if (numeric !== value) {
      onChange(numeric);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit();
      event.currentTarget.blur();
    }
  }

  return (
    <label className="grid gap-2 text-sm text-rmc-slate">
      {label}
      <input
        className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist outline-none transition focus:border-rmc-aether"
        type="number"
        value={localValue}
        min={min}
        max={max}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </label>
  );
}
