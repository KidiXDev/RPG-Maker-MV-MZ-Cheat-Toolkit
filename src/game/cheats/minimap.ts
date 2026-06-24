import { gameWindow, type GameEvent } from '../types.ts';
import { getSelfSwitchesForEvent, type SelfSwitchKey } from './selfSwitches.ts';

export type MinimapEventEntry = {
  id: number;
  name: string;
  x: number;
  y: number;
  trigger: number;
  selfSwitches: Record<SelfSwitchKey, boolean>;
};

export type MinimapData = {
  mapId: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  /** 2-D passability grid: passable[y][x] = true means walkable */
  passable: boolean[][];
  events: MinimapEventEntry[];
  playerX: number;
  playerY: number;
  displayX: number;
  displayY: number;
};

const MAX_PASSABILITY_DIM = 120;

/**
 * Reads the current map state from RPG Maker globals.
 * Every individual API call is wrapped in try/catch so that partial map
 * states (e.g. during scene transitions, event-triggered map changes) cannot
 * throw an unhandled error up to the game engine.
 * Returns null when no usable map data is available.
 */
export function getMinimapData(): MinimapData | null {
  try {
    const w = gameWindow();
    const gameMap = w.$gameMap;
    if (!gameMap) return null;

    // Declare with explicit number types — each call is individually guarded.
    // RPG Maker MV sets _mapData to null during map transitions which causes
    // width()/height()/isPassable() to throw internally.
    let mapId: number = 0;
    let width: number = 0;
    let height: number = 0;
    let tileWidth: number = 48;
    let tileHeight: number = 48;

    try { mapId = gameMap.mapId?.() ?? 0; } catch { /* ignore */ }
    try { width = gameMap.width?.() ?? 0; } catch { /* ignore */ }
    try { height = gameMap.height?.() ?? 0; } catch { /* ignore */ }
    try { tileWidth = gameMap.tileWidth?.() ?? 48; } catch { /* ignore */ }
    try { tileHeight = gameMap.tileHeight?.() ?? 48; } catch { /* ignore */ }

    const displayX: number = gameMap._displayX ?? 0;
    const displayY: number = gameMap._displayY ?? 0;

    // Map not ready yet (mid-transition) — bail out cleanly.
    if (width <= 0 || height <= 0) return null;

    // --- Passability grid (skipped for huge maps to avoid frame stalls) ---
    const passable: boolean[][] = [];
    const canScan =
      width <= MAX_PASSABILITY_DIM &&
      height <= MAX_PASSABILITY_DIM &&
      typeof gameMap.isPassable === 'function';

    if (canScan) {
      for (let y = 0; y < height; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < width; x++) {
          try {
            row.push(gameMap.isPassable!(x, y, 2));
          } catch {
            row.push(false);
          }
        }
        passable.push(row);
      }
    }

    // --- Events ---
    let rawEvents: GameEvent[] = [];
    try { rawEvents = gameMap.events?.() ?? []; } catch { /* ignore */ }

    const events: MinimapEventEntry[] = [];
    for (const ev of rawEvents) {
      try {
        if (!ev || ev._erased) continue;

        let evName = `EV${String(ev.eventId()).padStart(3, '0')}`;
        let trigger = ev._trigger ?? -1;
        try {
          const data = ev.event();
          const pageIdx = ev.pageIndex?.() ?? 0;
          const page = data?.pages?.[pageIdx];
          evName = data?.name || evName;
          trigger = page?.trigger ?? ev._trigger ?? -1;
        } catch { /* event data not ready */ }

        let selfSwitches: Record<SelfSwitchKey, boolean> = { A: false, B: false, C: false, D: false };
        try { selfSwitches = getSelfSwitchesForEvent(mapId, ev.eventId()); } catch { /* ignore */ }

        events.push({ id: ev.eventId(), name: evName, x: ev.x, y: ev.y, trigger, selfSwitches });
      } catch {
        // Skip any single event that throws entirely
      }
    }

    // --- Player position ---
    const playerX: number = w.$gamePlayer?.x ?? 0;
    const playerY: number = w.$gamePlayer?.y ?? 0;

    return { mapId, width, height, tileWidth, tileHeight, passable, events, playerX, playerY, displayX, displayY };
  } catch {
    // Outermost guard — never let an error escape to the game engine
    return null;
  }
}
