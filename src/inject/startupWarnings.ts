import { isNwjs, isNwjsTooOld, getNwjsVersion } from '../game/engine.ts';
import { isSdkBuild } from '../game/cheats/scene.ts';
import { useCheatStore } from '../store/useCheatStore.ts';

let shown = false;

/** Show one-time startup warnings about the runtime environment. Each warning
 *  can be silenced from Settings. Safe to call multiple times — only fires once
 *  per session. */
export function showStartupWarnings() {
  if (shown) return;
  shown = true;

  const state = useCheatStore.getState();

  // Only meaningful inside an actual NW.js runtime (the real game). In the
  // browser dev harness there's no NW.js, so skip.
  if (!isNwjs()) return;

  if (state.warnOldNwjs && isNwjsTooOld()) {
    const { chromium } = getNwjsVersion();
    state.pushToast(
      `Old NW.js detected (Chromium ${chromium ?? '?'}). Some cheats may not work correctly.`,
      'danger',
    );
  }

  if (state.warnNoDevTools && !isSdkBuild()) {
    state.pushToast(
      'This NW.js build has no DevTools support (not an SDK build).',
      'info',
    );
  }
}
