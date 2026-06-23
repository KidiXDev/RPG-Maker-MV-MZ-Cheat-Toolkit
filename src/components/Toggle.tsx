type ToggleProps = {
  checked: boolean;
  label: string;
  onChange(checked: boolean): void;
};

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-rmc-mist">
      <span>{label}</span>
      <input
        className="h-5 w-5 accent-rmc-ember"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
