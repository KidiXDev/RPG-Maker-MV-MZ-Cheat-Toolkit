import { gameWindow, type GameEvent, type GameEventData } from '../types.ts';

const TRIGGER_LABELS: Record<number, string> = {
  0: 'Action',
  1: 'Player Touch',
  2: 'Event Touch',
  3: 'Autorun',
  4: 'Parallel',
};

export type EventEntry = {
  id: number;
  name: string;
  x: number;
  y: number;
  trigger: number;
  triggerLabel: string;
  pageCount: number;
  isRunning: boolean;
  isErased: boolean;
};

export function currentMapEvents(): EventEntry[] {
  const runtime = gameWindow();
  const gameMap = runtime.$gameMap;

  if (!gameMap) return [];

  const events = gameMap.events?.() ?? [];

  return events
    .filter((ev): ev is GameEvent => Boolean(ev) && !ev._erased)
    .map((ev) => {
      const eventData: GameEventData | undefined = ev.event();
      const page = eventData?.pages?.[ev.pageIndex?.() ?? 0];
      const trigger = page?.trigger ?? ev._trigger ?? -1;

      return {
        id: ev.eventId(),
        name: eventData?.name || `EV${String(ev.eventId()).padStart(3, '0')}`,
        x: ev.x,
        y: ev.y,
        trigger,
        triggerLabel: TRIGGER_LABELS[trigger] ?? `Unknown(${trigger})`,
        pageCount: eventData?.pages?.length ?? 0,
        isRunning: ev.isStarting?.() || ev.isRunning?.() || false,
        isErased: ev._erased ?? false,
      };
    });
}

export function triggerEvent(eventId: number) {
  const gameMap = gameWindow().$gameMap;

  if (!gameMap) return false;

  const events = gameMap.events?.() ?? [];
  const event = events.find((ev) => ev && ev.eventId() === eventId);

  if (!event || event._erased) return false;

  try {
    event.start();
    return true;
  } catch {
    return false;
  }
}

export function eraseEvent(eventId: number) {
  const gameMap = gameWindow().$gameMap;

  if (!gameMap) return false;

  const events = gameMap.events?.() ?? [];
  const event = events.find((ev) => ev && ev.eventId() === eventId);

  if (!event) return false;

  try {
    event.erase();
    return true;
  } catch {
    return false;
  }
}

export function currentMapId() {
  return gameWindow().$gameMap?.mapId() ?? -1;
}
