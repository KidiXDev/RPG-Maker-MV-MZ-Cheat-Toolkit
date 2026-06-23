import { gameWindow, type DataItem } from '../types.ts';

export type InventoryKind = 'items' | 'weapons' | 'armors';

export type InventoryEntry = DataItem & {
  _item: DataItem;
  name: string;
  quantity: number;
};

const dataKeys = {
  items: '$dataItems',
  weapons: '$dataWeapons',
  armors: '$dataArmors'
} as const;

export function inventoryEntries(kind: InventoryKind): InventoryEntry[] {
  const runtime = gameWindow();
  const data = runtime[dataKeys[kind]] ?? [];
  const party = runtime.$gameParty;

  return data
    .filter((entry): entry is DataItem => Boolean(entry))
    .map((entry) => ({
      ...entry,
      name: entry.name ?? '',
      _item: entry,
      quantity: party?.numItems(entry) ?? 0
    }));
}

export function setItemQuantity(item: DataItem, quantity: number) {
  const party = gameWindow().$gameParty;

  if (!party) {
    return;
  }

  party.gainItem(item, Math.max(0, quantity) - party.numItems(item), true);
}
