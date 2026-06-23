import { gameWindow } from '../types.ts';

export type GameSpeedScope = 'all' | 'battle';

let currentMultiplier = 1;
let currentScope: GameSpeedScope = 'all';
let syncInterval: number | undefined;

export function setGameSpeed(multiplier: number, scope: GameSpeedScope = currentScope) {
  currentMultiplier = Math.max(0.1, Math.min(10, multiplier));
  currentScope = scope;
  applyGameSpeed();
  syncGameSpeedInterval();
}

export function setGameSpeedScope(scope: GameSpeedScope) {
  currentScope = scope;
  applyGameSpeed();
  syncGameSpeedInterval();
}

function applyGameSpeed() {
  const sceneManager = gameWindow().SceneManager;

  if (sceneManager) {
    const inBattle = gameWindow().$gameParty?.inBattle?.() ?? true;
    const effectiveMultiplier = currentScope === 'battle' && !inBattle ? 1 : currentMultiplier;
    sceneManager._deltaTime = 1 / 60 / effectiveMultiplier;
  }
}

export function restoreGameSpeed() {
  setGameSpeed(1, 'all');
}

export function getGameSpeed() {
  return currentMultiplier;
}

export function getGameSpeedScope() {
  return currentScope;
}

function syncGameSpeedInterval() {
  window.clearInterval(syncInterval);
  syncInterval = undefined;

  if (currentMultiplier === 1 && currentScope === 'all') {
    return;
  }

  syncInterval = window.setInterval(applyGameSpeed, 500);
}
