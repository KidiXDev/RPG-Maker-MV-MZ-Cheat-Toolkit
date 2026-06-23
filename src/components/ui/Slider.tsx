import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Fire onChange continuously while dragging. Default: fire only on release. */
  instant?: boolean;
  /** Format the displayed value. Default: String(value). */
  formatValue?: (value: number) => string;
  onChange(value: number): void;
  /** Optional reset callback — shows a small icon button next to the value. */
  onReset?: () => void;
  /** Accessibility label for the reset button. */
  resetLabel?: string;
};

export function Slider({
  label,
  value,
  min,
  max,
  step,
  instant = false,
  formatValue = String,
  onChange,
  onReset,
  resetLabel = 'Reset',
}: SliderProps) {
  const handleInput = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      onChange(Number(e.currentTarget.value));
    },
    [onChange],
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-rmc-slate">{label}</label>
        <div className="flex items-center gap-1">
          <span className="font-rmc-mono text-sm text-rmc-ember">
            {formatValue(value)}
          </span>
          {onReset && (
            <button
              type="button"
              className="cursor-pointer rounded p-0.5 text-rmc-slate hover:text-rmc-ember transition-colors"
              onClick={onReset}
              aria-label={resetLabel}
              title={resetLabel}
            >
              <RotateCcw size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        className="rmc-slider w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-rmc-ember [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(255,179,92,0.35)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100
          [&::-webkit-slider-thumb]:hover:scale-110
          focus:outline-none focus:[&::-webkit-slider-thumb]:ring-2 focus:[&::-webkit-slider-thumb]:ring-rmc-ember/40"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={instant ? handleInput : undefined}
        onChange={handleInput}
      />
    </div>
  );
}
