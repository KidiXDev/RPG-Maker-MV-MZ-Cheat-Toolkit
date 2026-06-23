import { gameWindow } from '../types.ts';

type RuntimePrototype = Record<string, unknown>;
type RuntimeMethod = (this: RuntimePrototype, ...args: unknown[]) => unknown;

const originals = new WeakMap<RuntimePrototype, Map<string, RuntimeMethod>>();

let lockedSpeed = 4;
let originalGameSpeed: number | null = null;
let locked = false;
let patched = false;

function ensurePatched() {
  if (patched) return;

  const player = gameWindow().$gamePlayer;
  if (!player) return;

  const playerProto = Object.getPrototypeOf(player) as RuntimePrototype;
  if (!playerProto) return;

  const protoOriginals = getProtoOriginals(playerProto);
  if (protoOriginals.has('setMoveSpeed')) return;

  const originalMethod = playerProto.setMoveSpeed as RuntimeMethod | undefined;
  if (typeof originalMethod !== 'function') return;

  protoOriginals.set('setMoveSpeed', originalMethod);

  playerProto.setMoveSpeed = function patchedSetMoveSpeed(
    this: { _moveSpeed: number },
    speed: number,
  ) {
    if (locked) {
      originalMethod.call(this, lockedSpeed);
    } else {
      originalMethod.call(this, speed);
    }
  };

  patched = true;
}

function getProtoOriginals(proto: RuntimePrototype): Map<string, RuntimeMethod> {
  let map = originals.get(proto);
  if (!map) {
    map = new Map();
    originals.set(proto, map);
  }
  return map;
}

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

  // Capture the game's original speed on first modification so we can
  // restore to it later. Only snapshots once — subsequent calls keep the
  // first capture.
  if (originalGameSpeed === null) {
    originalGameSpeed = player._moveSpeed ?? 4;
  }

  lockedSpeed = clamped;
  locked = lock;

  ensurePatched();
  player.setMoveSpeed(clamped);
}

export function resetMoveSpeed() {
  locked = false;
  lockedSpeed = originalGameSpeed ?? 4;

  const player = gameWindow().$gamePlayer;
  if (player) {
    player.setMoveSpeed(lockedSpeed);
  }

  return lockedSpeed;
}

export function getMoveSpeed() {
  return gameWindow().$gamePlayer?._moveSpeed ?? 4;
}

export function currentMapName() {
  const gameMap = gameWindow().$gameMap;

  return gameMap?.displayName?.() || `Map ${gameMap?.mapId() ?? '?'}`;
}
