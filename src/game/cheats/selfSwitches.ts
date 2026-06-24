import { gameWindow } from '../types.ts';

export type SelfSwitchKey = 'A' | 'B' | 'C' | 'D';
export const SELF_SWITCH_KEYS: SelfSwitchKey[] = ['A', 'B', 'C', 'D'];

export function getSelfSwitch(mapId: number, eventId: number, key: SelfSwitchKey): boolean {
  return gameWindow().$gameSelfSwitches?.value([mapId, eventId, key]) ?? false;
}

export function setSelfSwitch(mapId: number, eventId: number, key: SelfSwitchKey, value: boolean): void {
  gameWindow().$gameSelfSwitches?.setValue([mapId, eventId, key], value);
}

export function getSelfSwitchesForEvent(
  mapId: number,
  eventId: number,
): Record<SelfSwitchKey, boolean> {
  return {
    A: getSelfSwitch(mapId, eventId, 'A'),
    B: getSelfSwitch(mapId, eventId, 'B'),
    C: getSelfSwitch(mapId, eventId, 'C'),
    D: getSelfSwitch(mapId, eventId, 'D'),
  };
}
