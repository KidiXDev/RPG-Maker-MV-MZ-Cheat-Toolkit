import { gameWindow } from '../types.ts';

export function partyMembers() {
  return gameWindow().$gameParty?.members() ?? [];
}

export function enemies() {
  return gameWindow().$gameTroop?.members() ?? [];
}

export function areRandomEncountersEnabled() {
  const gameSystem = gameWindow().$gameSystem;

  if (gameSystem?.isEncounterEnabled) {
    return gameSystem.isEncounterEnabled();
  }

  return gameSystem?._encounterEnabled ?? true;
}

export function setRandomEncountersEnabled(enabled: boolean) {
  const gameSystem = gameWindow().$gameSystem;

  if (!gameSystem) {
    return;
  }

  if (enabled) {
    gameSystem.enableEncounter?.();
  } else {
    gameSystem.disableEncounter?.();
  }

  gameSystem._encounterEnabled = enabled;
}

export function forceEncounter() {
  const player = gameWindow().$gamePlayer;

  player?.makeEncounterCount?.();
  return player?.executeEncounter?.() ?? false;
}

export function recoverParty() {
  for (const actor of partyMembers()) {
    actor.recoverAll();
  }
}

export function woundParty() {
  for (const actor of partyMembers()) {
    actor.setHp(1);
    actor.setMp(0);
    actor.setTp(0);
  }
}

export function fillPartyTp() {
  for (const actor of partyMembers()) {
    actor.setTp(100);
  }
}

export function setPartyHp(value: number) {
  for (const actor of partyMembers()) {
    actor.setHp(value);
  }
}

export function setActorHp(actorId: number, value: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (actor) {
    actor.setHp(value);
  }
}

export function setActorMp(actorId: number, value: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (actor) {
    actor.setMp(value);
  }
}

export function setActorTp(actorId: number, value: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (actor) {
    actor.setTp(value);
  }
}

export function setEnemiesHp(value: number) {
  for (const enemy of enemies()) {
    enemy.setHp(value);
  }
}

export function forceBattleResult(result: 'victory' | 'defeat' | 'escape' | 'abort') {
  const battleManager = gameWindow().BattleManager;

  if (!battleManager) {
    return;
  }

  if (result === 'victory') {
    battleManager.processVictory();
  } else if (result === 'defeat') {
    battleManager.processDefeat();
  } else if (result === 'escape') {
    battleManager.processEscape();
  } else {
    battleManager.abort();
  }
}
