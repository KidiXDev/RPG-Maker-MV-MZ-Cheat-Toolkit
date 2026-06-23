import { gameWindow } from '../types.ts';

export type GameSpeedScope = 'all' | 'battle';

let allMultiplier = 1;
let battleMultiplier = 1;
let currentScope: GameSpeedScope = 'all';
let syncInterval: number | undefined;

export function setGameSpeed(multiplier: number, scope: GameSpeedScope = currentScope) {
  const clamped = Math.max(0.1, Math.min(10, multiplier));
  if (scope === 'battle') {
    battleMultiplier = clamped;
  } else {
    allMultiplier = clamped;
  }
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
    const currentMultiplier = currentScope === 'battle' ? battleMultiplier : allMultiplier;
    const effectiveMultiplier = currentScope === 'battle' && !inBattle ? 1 : currentMultiplier;
    sceneManager._deltaTime = 1 / 60 / effectiveMultiplier;
  }
}

export function restoreGameSpeed() {
  allMultiplier = 1;
  battleMultiplier = 1;
  currentScope = 'all';
  applyGameSpeed();
  syncGameSpeedInterval();
}

export function getGameSpeed(scope?: GameSpeedScope) {
  const s = scope ?? currentScope;
  return s === 'battle' ? battleMultiplier : allMultiplier;
}

export function getGameSpeedScope() {
  return currentScope;
}

function syncGameSpeedInterval() {
  window.clearInterval(syncInterval);
  syncInterval = undefined;

  const m = currentScope === 'battle' ? battleMultiplier : allMultiplier;

  if (m === 1 && currentScope === 'all') {
    return;
  }

  syncInterval = window.setInterval(applyGameSpeed, 500);
}
