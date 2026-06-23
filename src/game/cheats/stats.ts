import { partyMembers } from './battle.ts';

export const PARAM_NAMES = ['MaxHP', 'MaxMP', 'Atk', 'Def', 'MAtk', 'MDef', 'Agi', 'Luck'] as const;

const godModeActorIds = new Set<number>();
const originalSetHp = new WeakMap<ReturnType<typeof partyMembers>[number], (value: number) => void>();
let godModeInterval: number | undefined;

export function isGodModeEnabled(actorId: number) {
  return godModeActorIds.has(actorId);
}

export function toggleGodMode(actorId: number, enabled: boolean) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (!actor) {
    return;
  }

  if (enabled) {
    godModeActorIds.add(actorId);
    wrapActorHp(actor);
  } else {
    godModeActorIds.delete(actorId);
  }

  syncGodModeInterval();
}

export function setActorLevel(actorId: number, level: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (actor) {
    actor.changeLevel(Math.max(1, level), false);
  }
}

export function setActorExp(actorId: number, exp: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (actor) {
    actor.changeExp(Math.max(0, exp), false);
  }
}

export function setActorParam(actorId: number, paramId: number, value: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (!actor) {
    return;
  }

  actor.addParam(paramId, value - actor.param(paramId));
}

export function reloadActorFromData(actorId: number) {
  const actor = partyMembers().find((member) => member.actorId() === actorId);

  if (!actor?.setup) {
    return false;
  }

  const wasGodModeEnabled = godModeActorIds.has(actorId);
  actor.setup(actorId);

  if (wasGodModeEnabled) {
    wrapActorHp(actor);
  }

  return true;
}

export function reloadPartyFromData() {
  let reloaded = 0;

  for (const actor of partyMembers()) {
    if (reloadActorFromData(actor.actorId())) {
      reloaded += 1;
    }
  }

  return reloaded;
}

function wrapActorHp(actor: ReturnType<typeof partyMembers>[number]) {
  if (originalSetHp.has(actor)) {
    return;
  }

  const original = actor.setHp.bind(actor);
  originalSetHp.set(actor, original);

  actor.setHp = (value: number) => {
    if (godModeActorIds.has(actor.actorId())) {
      original(Math.max(1, value));
      return;
    }

    original(value);
  };
}

function syncGodModeInterval() {
  window.clearInterval(godModeInterval);
  godModeInterval = undefined;

  if (godModeActorIds.size === 0) {
    return;
  }

  godModeInterval = window.setInterval(() => {
    for (const actor of partyMembers()) {
      if (godModeActorIds.has(actor.actorId())) {
        wrapActorHp(actor);
        actor.setHp(actor.mhp);
        actor.setMp(actor.mmp);
        actor.setTp(100);
      }
    }
  }, 500);
}
