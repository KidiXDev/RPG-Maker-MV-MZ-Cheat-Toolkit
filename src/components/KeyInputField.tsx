import { eventToCombo } from '../shortcuts/keycodes.ts';

type KeyInputFieldProps = {
  value: string;
  onChange(value: string): void;
};

export function KeyInputField({ value, onChange }: KeyInputFieldProps) {
  return (
    <input
      className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist"
      readOnly
      value={value}
      onKeyDown={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const combo = eventToCombo(event.nativeEvent);

        if (combo) {
          onChange(combo);
        }
      }}
      onFocus={(event) => event.currentTarget.select()}
    />
  );
}
