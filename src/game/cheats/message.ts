import { getGameSpeed, getGameSpeedScope, setGameSpeed } from './gameSpeed.ts';
import { gameWindow } from '../types.ts';

type RuntimePrototype = Record<string, unknown>;
type RuntimeMethod = (this: RuntimePrototype, ...args: unknown[]) => unknown;

const originals = new WeakMap<RuntimePrototype, Map<string, RuntimeMethod>>();
let skipEnabled = false;
let patched = false;
let previousSpeed: { multiplier: number; scope: ReturnType<typeof getGameSpeedScope> } | null = null;

export function startMessageSkip(multiplier = 6) {
  patchMessageSkip();

  if (!skipEnabled) {
    previousSpeed = {
      multiplier: getGameSpeed(),
      scope: getGameSpeedScope()
    };
  }

  skipEnabled = true;

  if (multiplier > 1) {
    setGameSpeed(multiplier, 'all');
  }
}

export function stopMessageSkip() {
  skipEnabled = false;

  if (previousSpeed) {
    setGameSpeed(previousSpeed.multiplier, previousSpeed.scope);
    previousSpeed = null;
  }
}

export function isMessageSkipEnabled() {
  return skipEnabled;
}

export function patchMessageSkip() {
  if (patched) {
    return;
  }

  const runtime = gameWindow();
  patchMethod(runtime.Window_Message?.prototype, 'updateShowFast', () => skipEnabled || undefined);
  patchMethod(runtime.Window_Message?.prototype, 'updateInput', () => skipEnabled || undefined);
  patchMethod(runtime.Window_ScrollText?.prototype, 'scrollSpeed', (originalValue) =>
    skipEnabled ? Math.max(Number(originalValue) || 1, 12) : undefined
  );
  patchMethod(runtime.Window_BattleLog?.prototype, 'messageSpeed', () => (skipEnabled ? 0 : undefined));
  patched = true;
}

function patchMethod(
  prototype: RuntimePrototype | undefined,
  key: string,
  override: (originalValue: unknown) => unknown
) {
  if (!prototype) {
    return;
  }

  const original = prototype[key];

  if (typeof original !== 'function') {
    return;
  }

  const originalMethod = original as RuntimeMethod;
  let prototypeOriginals = originals.get(prototype);

  if (!prototypeOriginals) {
    prototypeOriginals = new Map();
    originals.set(prototype, prototypeOriginals);
  }

  if (prototypeOriginals.has(key)) {
    return;
  }

  prototypeOriginals.set(key, originalMethod);
  prototype[key] = function patchedMessageMethod(this: RuntimePrototype, ...args: unknown[]) {
    const originalValue = originalMethod.apply(this, args);
    const overrideValue = override(originalValue);

    return overrideValue === undefined ? originalValue : overrideValue;
  };
}
