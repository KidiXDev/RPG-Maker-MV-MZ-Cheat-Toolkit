import { gameWindow } from '../types.ts';

let allMultiplier = 1;
let battleMultiplier = 1;
let syncInterval: number | undefined;

export function setGameSpeedAll(multiplier: number) {
  allMultiplier = Math.max(0.1, Math.min(10, multiplier));
  applyGameSpeed();
  syncGameSpeedInterval();
}

export function setGameSpeedBattle(multiplier: number) {
  battleMultiplier = Math.max(0.1, Math.min(10, multiplier));
  applyGameSpeed();
  syncGameSpeedInterval();
}

function applyGameSpeed() {
  const sceneManager = gameWindow().SceneManager;

  if (sceneManager) {
    const inBattle = gameWindow().$gameParty?.inBattle?.() ?? false;
    const effectiveMultiplier = inBattle ? battleMultiplier : allMultiplier;
    sceneManager._deltaTime = 1 / 60 / effectiveMultiplier;
  }
}

export function restoreGameSpeed() {
  allMultiplier = 1;
  battleMultiplier = 1;
  applyGameSpeed();
  syncGameSpeedInterval();
}

export function getGameSpeedAll() {
  return allMultiplier;
}

export function getGameSpeedBattle() {
  return battleMultiplier;
}

function syncGameSpeedInterval() {
  window.clearInterval(syncInterval);
  syncInterval = undefined;

  if (allMultiplier === 1 && battleMultiplier === 1) {
    return;
  }

  syncInterval = window.setInterval(applyGameSpeed, 500);
}
