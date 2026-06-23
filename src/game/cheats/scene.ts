import { gameWindow } from '../types.ts';

class FallbackScene {}

export function gotoTitle() {
  const runtime = gameWindow();
  runtime.SceneManager?.goto(runtime.Scene_Title ?? FallbackScene);
}

export function openSaveScene() {
  const runtime = gameWindow();
  runtime.SceneManager?.push(runtime.Scene_Save ?? FallbackScene);
}

export function openLoadScene() {
  const runtime = gameWindow();
  runtime.SceneManager?.push(runtime.Scene_Load ?? FallbackScene);
}

export function reloadGame() {
  gameWindow().SceneManager?.reloadGame?.();
}

export function quickSave(slot = 1) {
  return gameWindow().DataManager?.saveGame(slot);
}

export function quickLoad(slot = 1) {
  return gameWindow().DataManager?.loadGame(slot);
}

export function openDevTools() {
  const runtime = gameWindow();
  const nwWindow = runtime.nw?.Window?.get();

  if (!nwWindow?.showDevTools || !runtime.Utils?.isNwjs?.()) {
    return false;
  }

  // NW.js 0.29 (Chromium 65) production builds strip the DevTools
  // frontend resources — showDevTools() opens a blank window.
  // The only reliable fix: replace NW.js with the SDK build, or
  // launch with --remote-debugging-port=9222 and connect from
  // an external Chrome browser at http://localhost:9222.
  try {
    nwWindow.showDevTools();
  } catch {
    return false;
  }

  return true;
}

/** Check whether the NW.js runtime includes DevTools resources (SDK build). */
export function isSdkBuild() {
  if (!gameWindow().Utils?.isNwjs?.()) return false;

  // chrome.devtools is only present in NW.js SDK builds.
  const win = window as unknown as Record<string, unknown>;
  return !!(win.chrome as Record<string, unknown> | undefined)?.devtools;
}
