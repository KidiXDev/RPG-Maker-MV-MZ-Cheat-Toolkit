import { gameWindow } from '../types.ts';

export function switchEntries() {
  const runtime = gameWindow();
  const names = runtime.$dataSystem?.switches ?? [];

  return names.map((name, id) => ({
    id,
    name,
    value: runtime.$gameSwitches?.value(id) ?? false
  }));
}

export function setSwitchValue(id: number, value: boolean) {
  gameWindow().$gameSwitches?.setValue(id, value);
}
