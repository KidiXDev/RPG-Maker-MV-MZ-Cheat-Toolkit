import { currentMapName } from './general.ts';
import { teleportTo } from './teleport.ts';
import { gameWindow } from '../types.ts';

export type SavedLocation = {
  id: string;
  alias: string;
  mapId: number;
  mapName: string;
  x: number;
  y: number;
};

export function captureCurrentLocation(alias: string): SavedLocation | null {
  const runtime = gameWindow();
  const mapId = runtime.$gameMap?.mapId();
  const player = runtime.$gamePlayer;

  if (!mapId || !player) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    alias,
    mapId,
    mapName: currentMapName(),
    x: player.x,
    y: player.y
  };
}

export function recallLocation(location: SavedLocation) {
  teleportTo(location.mapId, location.x, location.y);
}

export function currentLocationLabel() {
  const runtime = gameWindow();
  const mapId = runtime.$gameMap?.mapId();
  const player = runtime.$gamePlayer;

  if (!mapId || !player) {
    return 'Current location unavailable';
  }

  return `${currentMapName()} (${player.x}, ${player.y})`;
}
