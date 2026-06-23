type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange(value: number): void;
};

export function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-rmc-slate">
      {label}
      <input
        className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist outline-none transition focus:border-rmc-aether"
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
