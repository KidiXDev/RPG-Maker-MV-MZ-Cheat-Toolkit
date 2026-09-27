import { gameWindow } from '../types.ts';

let allMultiplier = 1;
let battleMultiplier = 1;
let syncInterval: number | undefined;
let repeatRemainder = 0;
let repeatPatched = false;

function effectiveMultiplier() {
  const inBattle = gameWindow().$gameParty?.inBattle?.() ?? false;
  return inBattle ? battleMultiplier : allMultiplier;
}

function patchRepeatNumber() {
  if (repeatPatched) return;

  const sceneManager = gameWindow().SceneManager;
  const original = sceneManager?.determineRepeatNumber;

  if (!sceneManager || typeof original !== 'function') return;

  sceneManager.determineRepeatNumber = function patchedDetermineRepeatNumber(deltaTime: number) {
    const scaled = original.call(this, deltaTime) * effectiveMultiplier() + repeatRemainder;
    const repeats = Math.floor(scaled);
    repeatRemainder = scaled - repeats;
    return repeats;
  };

  repeatPatched = true;
}

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
    sceneManager._deltaTime = 1 / 60 / effectiveMultiplier();
    patchRepeatNumber();
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
