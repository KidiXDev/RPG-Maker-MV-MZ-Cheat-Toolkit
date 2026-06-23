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

  nwWindow.showDevTools();
  return true;
}
