import { gameWindow } from '../types.ts';

let lockedSpeedInterval: number | undefined;

export function getGold() {
  return gameWindow().$gameParty?.gold() ?? 0;
}

export function setGold(amount: number) {
  const party = gameWindow().$gameParty;

  if (!party) {
    return;
  }

  party.gainGold(amount - party.gold());
}

export function setNoClip(enabled: boolean) {
  gameWindow().$gamePlayer?.setThrough(enabled);
}

export function setMoveSpeed(speed: number, lock = false) {
  const clamped = Math.max(1, Math.min(10, speed));
  const player = gameWindow().$gamePlayer;

  if (!player) {
    return;
  }

  player.setMoveSpeed(clamped);
  window.clearInterval(lockedSpeedInterval);
  lockedSpeedInterval = undefined;

  if (lock) {
    lockedSpeedInterval = window.setInterval(() => player.setMoveSpeed(clamped), 500);
  }
}

export function getMoveSpeed() {
  return gameWindow().$gamePlayer?._moveSpeed ?? 4;
}

export function currentMapName() {
  const gameMap = gameWindow().$gameMap;

  return gameMap?.displayName?.() || `Map ${gameMap?.mapId() ?? '?'}`;
}
