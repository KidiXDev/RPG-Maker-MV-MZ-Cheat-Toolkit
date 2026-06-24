import { useDeferredValue, useReducer, useState } from 'react';
import { Button } from '../components/ui/index.ts';
import { Badge } from '../components/ui/index.ts';
import {
  currentMapEvents,
  currentMapId,
  eraseEvent,
  triggerEvent,
  type EventEntry,
} from '../game/cheats/events.ts';
import { getSelfSwitchesForEvent, setSelfSwitch, SELF_SWITCH_KEYS, type SelfSwitchKey } from '../game/cheats/selfSwitches.ts';
import { currentMapName } from '../game/cheats/general.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

const triggerBadgeVariants: Record<string, 'info' | 'warning' | 'success'> = {
  Action: 'info',
  'Player Touch': 'warning',
  'Event Touch': 'warning',
  Autorun: 'success',
  Parallel: 'success',
};

export function EventsPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const pushToast = useCheatStore((state) => state.pushToast);
  const requestConfirm = useCheatStore((state) => state.requestConfirm);
  const espEnabled = useCheatStore((state) => state.espEnabled);
  const setEspEnabled = useCheatStore((state) => state.setEspEnabled);

  const events = currentMapEvents();
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleEvents = normalizedQuery
    ? events.filter(
        (ev) =>
          ev.name.toLowerCase().includes(normalizedQuery) ||
          String(ev.id).includes(normalizedQuery),
      )
    : events;

  const mapId = currentMapId();
  const mapName = currentMapName();

  return (
    <section>
      <PanelHeader
        title="Map Events"
        description={`Trigger or erase events on the current map (${mapName}, ID ${mapId}).`}
      />

      {/* Controls */}
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          className="rounded-lg border border-white/10 bg-rmc-abyss/80 px-3 py-1.5 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
          placeholder="Search events by name or ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {/* ESP Toggle */}
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            espEnabled
              ? 'bg-rmc-aether/20 border-rmc-aether text-rmc-aether'
              : 'bg-white/10 border-white/10 text-rmc-slate hover:bg-white/20 hover:text-rmc-mist'
          }`}
          onClick={() => setEspEnabled(!espEnabled)}
          title="Toggle Event ESP overlay on the game screen"
        >
          {espEnabled ? '● ESP' : '○ ESP'}
        </button>
        <Button variant="ghost" onClick={refresh}>
          Refresh
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            requestConfirm({
              title: 'Trigger all events?',
              message: `${visibleEvents.length} visible events will be started. This can cause unexpected behaviour.`,
              confirmLabel: 'Trigger all',
              tone: 'danger',
              onConfirm: () => {
                let triggered = 0;
                for (const ev of visibleEvents) {
                  if (triggerEvent(ev.id)) triggered++;
                }
                pushToast(`Triggered ${triggered} event(s)`);
                refresh();
              },
            });
          }}
        >
          Trigger visible
        </Button>
      </div>

      <div className="max-h-[60vh] md:max-h-[340px] overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-xs tracking-[0.18em] text-rmc-aether uppercase">
            <tr>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">ID</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Name</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Pos</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Trigger</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Self-SW</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-rmc-slate"
                >
                  {events.length === 0
                    ? 'No events on this map.'
                    : 'No events match the search.'}
                </td>
              </tr>
            ) : (
              visibleEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  mapId={mapId}
                  onAction={() => refresh()}
                  pushToast={pushToast}
                  requestConfirm={requestConfirm}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelfSwitchToggles({ mapId, eventId }: { mapId: number; eventId: number }) {
  const [, refresh] = useReducer((v: number) => v + 1, 0);
  const switches = getSelfSwitchesForEvent(mapId, eventId);

  return (
    <div className="flex gap-1">
      {SELF_SWITCH_KEYS.map((key: SelfSwitchKey) => {
        const on = switches[key];
        return (
          <button
            key={key}
            type="button"
            title={`Self-Switch ${key}: ${on ? 'ON' : 'OFF'} — click to toggle`}
            className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold border transition cursor-pointer ${
              on
                ? 'bg-rmc-ember/20 border-rmc-ember/60 text-rmc-ember'
                : 'bg-white/5 border-white/10 text-rmc-slate hover:border-white/30 hover:text-rmc-mist'
            }`}
            onClick={() => {
              setSelfSwitch(mapId, eventId, key, !on);
              refresh();
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

function EventRow({
  event,
  mapId,
  onAction,
  pushToast,
  requestConfirm,
}: {
  event: EventEntry;
  mapId: number;
  onAction(): void;
  pushToast(message: string, tone?: 'info' | 'danger'): void;
  requestConfirm(opts: {
    title: string;
    message: string;
    confirmLabel: string;
    tone?: 'info' | 'danger';
    onConfirm(): void;
  }): void;
}) {
  const badgeVariant = triggerBadgeVariants[event.triggerLabel] ?? 'info';

  return (
    <tr className="border-t border-white/10 odd:bg-white/3">
      <td className="px-4 py-3 font-rmc-mono text-rmc-aether">
        {String(event.id).padStart(3, '0')}
      </td>
      <td className="px-4 py-3 max-w-[160px] truncate" title={event.name}>
        {event.name}
      </td>
      <td className="px-4 py-3 font-rmc-mono text-rmc-slate">
        ({event.x}, {event.y})
      </td>
      <td className="px-4 py-3">
        <Badge variant={badgeVariant}>{event.triggerLabel}</Badge>
      </td>
      <td className="px-4 py-3">
        <SelfSwitchToggles mapId={mapId} eventId={event.id} />
      </td>
      <td className="px-4 py-3">
        <div className="grid grid-flow-col auto-cols-max gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const ok = triggerEvent(event.id);
              pushToast(
                ok ? `Triggered event ${event.id}` : `Failed to trigger event ${event.id}`,
                ok ? 'info' : 'danger',
              );
              onAction();
            }}
          >
            Trigger
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              requestConfirm({
                title: 'Erase event?',
                message: `Event "${event.name}" (ID ${event.id}) will be temporarily erased until the map is reloaded.`,
                confirmLabel: 'Erase',
                tone: 'danger',
                onConfirm: () => {
                  eraseEvent(event.id);
                  pushToast(`Erased event ${event.id}`);
                  onAction();
                },
              })
            }
          >
            Erase
          </Button>
        </div>
      </td>
    </tr>
  );
}
