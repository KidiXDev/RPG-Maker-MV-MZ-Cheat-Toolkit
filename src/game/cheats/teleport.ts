import { gameWindow, type DataMapInfo } from '../types.ts';

export function mapEntries() {
  const maps = gameWindow().$dataMapInfos ?? [];

  return maps.filter((map): map is DataMapInfo => Boolean(map)).map((map) => ({
    id: map.id,
    name: map.name,
    parentId: map.parentId,
    path: buildMapPath(map.id)
  }));
}

export function teleportTo(mapId: number, x: number, y: number) {
  gameWindow().$gamePlayer?.reserveTransfer(mapId, x, y, 2, 0);
}

function buildMapPath(mapId: number) {
  const maps = gameWindow().$dataMapInfos ?? [];
  const names: string[] = [];
  let cursor = maps[mapId] ?? null;

  while (cursor) {
    names.unshift(cursor.name);
    cursor = cursor.parentId > 0 ? (maps[cursor.parentId] ?? null) : null;
  }

  return names.join(' / ');
}
