import { useDeferredValue, useState } from 'react';
import { Button } from '../components/ui/index.ts';
import { captureCurrentLocation, currentLocationLabel, recallLocation } from '../game/cheats/location.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { useLocationStore } from '../store/useLocationStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function LocationPanel() {
  const [alias, setAlias] = useState('Checkpoint');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const locations = useLocationStore((state) => state.locations);
  const addLocation = useLocationStore((state) => state.addLocation);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const renameLocation = useLocationStore((state) => state.renameLocation);
  const pushToast = useCheatStore((state) => state.pushToast);
  const requestConfirm = useCheatStore((state) => state.requestConfirm);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleLocations = normalizedQuery
    ? locations.filter((location) => `${location.alias} ${location.mapName} ${location.x} ${location.y}`.toLowerCase().includes(normalizedQuery))
    : locations;

  return (
    <section>
      <PanelHeader title="Location Save/Recall" description="Save the current map position with an alias, then recall it later." />
      <div className="mb-4 rounded-lg border border-rmc-aether/30 bg-rmc-aether/10 px-4 py-3 text-sm text-rmc-mist">
        Current map: <span className="font-rmc-mono text-rmc-aether">{currentLocationLabel()}</span>
      </div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input className="min-w-0 flex-1 rounded-lg border border-white/10 bg-rmc-abyss px-4 py-3 text-rmc-mist outline-none transition focus:border-rmc-aether" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <Button variant="primary" onClick={() => { const location = captureCurrentLocation(alias || 'Checkpoint'); if (location) { addLocation(location); pushToast('Location saved'); } }}>Save current</Button>
      </div>
      <input
        className="mb-4 w-full rounded-lg border border-white/10 bg-rmc-abyss/80 px-4 py-3 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
        placeholder="Search saved locations"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid gap-3">
        {visibleLocations.map((location) => (
          <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between" key={location.id}>
            <div>
              <input className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-semibold text-rmc-mist outline-none transition focus:border-rmc-aether" value={location.alias} onChange={(event) => renameLocation(location.id, event.target.value)} />
              <p className="mt-1 text-sm text-rmc-slate">{location.mapName} ({location.x}, {location.y})</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => recallLocation(location)}>Teleport</Button>
              <Button variant="danger" size="sm" onClick={() => requestConfirm({ title: 'Delete saved location?', message: `"${location.alias}" will be removed from the saved-location list.`, confirmLabel: 'Delete', tone: 'danger', onConfirm: () => removeLocation(location.id) })}>Delete</Button>
            </div>
          </div>
        ))}
        {visibleLocations.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-rmc-slate">No saved locations match the search.</div>
        ) : null}
      </div>
    </section>
  );
}
