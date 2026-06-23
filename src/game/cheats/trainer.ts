import { gameWindow, type DataItem } from '../types.ts';
import { partyMembers } from './battle.ts';
import { setGold } from './general.ts';

/** Set gold to 9999999 */
export function maxGold() {
  setGold(9_999_999);
}

/** Set all party members to level 99 */
export function maxLevel() {
  for (const actor of partyMembers()) {
    actor.changeLevel(99, false);
  }
}

/** Set all party members' params to 999 */
export function maxStats() {
  for (const actor of partyMembers()) {
    for (let i = 0; i < 8; i++) {
      actor.addParam(i, 999 - actor.param(i));
    }
  }
}

/** Set all party members' agility to 9999 */
export function maxAgility() {
  for (const actor of partyMembers()) {
    actor.addParam(6, 9999 - actor.param(6)); // AGI is param index 6
  }
}

/** Give 99 of every item/weapon/armor to the party */
export function allItems99() {
  const runtime = gameWindow();
  const party = runtime.$gameParty;
  if (!party) return;

  const dataSources: Array<Array<DataItem | null> | undefined> = [
    runtime.$dataItems,
    runtime.$dataWeapons,
    runtime.$dataArmors,
  ];

  for (const source of dataSources) {
    if (!source) continue;
    for (const entry of source) {
      if (entry && entry.id > 0) {
        const current = party.numItems(entry);
        if (current < 99) {
          party.gainItem(entry, 99 - current, true);
        }
      }
    }
  }
}

/** Add a specific amount of EXP to all party members */
export function addExpToAll(amount: number) {
  for (const actor of partyMembers()) {
    actor.changeExp(actor.currentExp() + amount, false);
  }
}

/** Get all actor names from $dataActors for party editing */
export type ActorDataEntry = {
  id: number;
  name: string;
  inParty: boolean;
};

export function allActorEntries(): ActorDataEntry[] {
  const runtime = gameWindow();
  const partyMemberIds = new Set(partyMembers().map((a) => a.actorId()));

  // RPG Maker stores actor data in $dataActors
  const dataActors = (runtime as unknown as Record<string, unknown>).$dataActors as
    | Array<{ id: number; name: string } | null>
    | undefined;

  if (!dataActors) return [];

  return dataActors
    .filter((a): a is { id: number; name: string } => a !== null && a.id > 0)
    .map((a) => ({
      id: a.id,
      name: a.name || `Actor ${a.id}`,
      inParty: partyMemberIds.has(a.id),
    }));
}

export function addActorToParty(actorId: number) {
  gameWindow().$gameParty?.addActor?.(actorId);
}

export function removeActorFromParty(actorId: number) {
  gameWindow().$gameParty?.removeActor?.(actorId);
}

/** Restore a specific actor from $dataActors */
export function initActor(actorId: number): boolean {
  const actor = gameWindow().$gameActors?.actor(actorId);
  if (!actor?.setup) return false;

  actor.setup(actorId);
  return true;
}
