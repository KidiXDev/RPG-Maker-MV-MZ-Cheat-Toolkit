import { gameWindow, type EngineKind, type SceneConstructor } from './types.ts';

const HOST_ID = 'rmc-cheat-host';
const TOUCH_METHODS = [
  '_onMouseDown',
  '_onMouseMove',
  '_onMouseUp',
  '_onTouchStart',
  '_onTouchMove',
  '_onTouchEnd',
  '_onPointerDown',
  '_onPointerMove',
  '_onPointerUp',
  '_onWheel'
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

export function isOverlayEvent(event: Event) {
  const host = document.getElementById(HOST_ID);
  if (!host) {
    return false;
  }

  if (typeof event.composedPath === 'function') {
    return event.composedPath().includes(host);
  }

  // Fallback for older browsers
  let target = event.target as Node | null;
  while (target) {
    if (target === host) {
      return true;
    }
    if (target instanceof ShadowRoot) {
      target = target.host;
    } else {
      target = target.parentNode;
    }
  }

  return false;
}

let introDismissed = false;
let delayedRunCall: (() => void) | null = null;

export function delaySceneManagerRun() {
  const runtime = gameWindow();
  if (!runtime.SceneManager || !runtime.SceneManager.run) {
    return;
  }

  const originalRun = runtime.SceneManager.run;
  runtime.SceneManager.run = function(this: unknown, sceneClass: SceneConstructor) {
    if (introDismissed) {
      originalRun.call(this, sceneClass);
    } else {
      delayedRunCall = () => {
        originalRun.call(this, sceneClass);
      };
    }
  };
}

export function startDelayedGame() {
  introDismissed = true;
  if (delayedRunCall) {
    delayedRunCall();
    delayedRunCall = null;
  }
}
