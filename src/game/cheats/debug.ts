import { gameWindow } from '../types.ts';

// --- FPS tracking ---

let fpsTrackingId: number | undefined;
let frameTimestamps: number[] = [];

export function startFpsTracking() {
  if (fpsTrackingId !== undefined) return;

  frameTimestamps = [];

  function tick() {
    const now = performance.now();
    frameTimestamps.push(now);

    // Keep a rolling window of the last 60 frames
    if (frameTimestamps.length > 60) {
      frameTimestamps = frameTimestamps.slice(-60);
    }

    fpsTrackingId = requestAnimationFrame(tick);
  }

  fpsTrackingId = requestAnimationFrame(tick);
}

export function stopFpsTracking() {
  if (fpsTrackingId !== undefined) {
    cancelAnimationFrame(fpsTrackingId);
    fpsTrackingId = undefined;
  }
  frameTimestamps = [];
}

export function getFps(): number {
  if (frameTimestamps.length < 2) return 0;

  const deltas: number[] = [];
  for (let i = 1; i < frameTimestamps.length; i++) {
    deltas.push(frameTimestamps[i] - frameTimestamps[i - 1]);
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return avgDelta > 0 ? Math.round(1000 / avgDelta) : 0;
}

// --- Map info ---

export function getCurrentMapInfo(): { name: string; id: number } {
  try {
    const w = gameWindow();
    const map = w.$gameMap;
    if (!map) return { name: '—', id: 0 };

    let id = 0;
    try { id = map.mapId?.() ?? 0; } catch { /* ignore */ }

    let name = '';
    try { name = map.displayName?.() ?? ''; } catch { /* ignore */ }

    return { name: name || `Map #${id}`, id };
  } catch {
    return { name: '—', id: 0 };
  }
}

// --- Player position ---

export function getPlayerPosition(): { x: number; y: number } {
  try {
    const w = gameWindow();
    const player = w.$gamePlayer;
    if (!player) return { x: 0, y: 0 };
    return {
      x: player.x ?? 0,
      y: player.y ?? 0,
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

// --- Running events ---

export type RunningEventInfo = { id: number; name: string; page: number };

export function getRunningEvents(): RunningEventInfo[] {
  try {
    const w = gameWindow();
    const map = w.$gameMap;
    if (!map) return [];

    let mapEvents: unknown[] = [];
    try { mapEvents = map.events?.() ?? []; } catch { return []; }

    const result: RunningEventInfo[] = [];

    for (const ev of mapEvents) {
      try {
        if (!ev || (ev as Record<string, unknown>)._erased) continue;
        const isRunning = typeof (ev as Record<string, unknown>).isRunning === 'function'
          ? ((ev as Record<string, unknown>).isRunning as () => boolean)()
          : false;
        const isStarting = typeof (ev as Record<string, unknown>).isStarting === 'function'
          ? ((ev as Record<string, unknown>).isStarting as () => boolean)()
          : false;
        if (!isRunning && !isStarting) continue;

        const eventData = typeof (ev as Record<string, unknown>).event === 'function'
          ? ((ev as Record<string, unknown>).event as () => Record<string, unknown> | null)()
          : null;

        const evId = typeof (ev as Record<string, unknown>).eventId === 'function'
          ? ((ev as Record<string, unknown>).eventId as () => number)()
          : 0;

        result.push({
          id: evId,
          name: (eventData?.name as string) ?? `EV${evId}`,
          page: ((ev as Record<string, unknown>).pageIndex as number | undefined) ?? 0,
        });
      } catch {
        // Skip events that throw on access
        continue;
      }
    }

    return result;
  } catch {
    return [];
  }
}
