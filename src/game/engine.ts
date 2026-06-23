import { gameWindow, type EngineKind } from './types.ts';

const HOST_ID = 'rmc-cheat-host';
const TOUCH_METHODS = [
  '_onMouseDown',
  '_onMouseMove',
  '_onMouseUp',
  '_onTouchStart',
  '_onTouchMove',
  '_onTouchEnd',
  '_onPointerDown'
] as const;
let touchPatched = false;

export function getEngineKind(): EngineKind {
  const makerName = gameWindow().Utils?.RPGMAKER_NAME;

  if (makerName === 'MV' || makerName === 'MZ') {
    return makerName;
  }

  return 'unknown';
}

export function isGameReady() {
  const runtime = gameWindow();

  return Boolean(runtime.$dataSystem && runtime.$gamePlayer && runtime.$gameParty && runtime.SceneManager);
}

export function patchTouchInputPassThrough() {
  const touchInput = gameWindow().TouchInput;

  if (!touchInput || touchPatched) {
    return;
  }

  for (const method of TOUCH_METHODS) {
    const original = touchInput[method];

    if (typeof original !== 'function') {
      continue;
    }

    touchInput[method] = function patchedTouchInput(this: Record<string, unknown>, event: Event) {
      if (isOverlayEvent(event)) {
        return;
      }

      return original.call(this, event);
    };
  }

  touchInput._rmcCheatPatched = true;
  touchPatched = true;
}

export function isNwjs() {
  return Boolean(gameWindow().Utils?.isNwjs?.());
}

function isOverlayEvent(event: Event) {
  const path = event.composedPath?.() ?? [];

  return path.some((target) => target instanceof HTMLElement && target.id === HOST_ID);
}
