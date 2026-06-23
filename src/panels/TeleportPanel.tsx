import { useState } from 'react';
import { Button } from '../components/ui/index.ts';
import { DataTable } from '../components/DataTable.tsx';
import { mapEntries, teleportTo } from '../game/cheats/teleport.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function TeleportPanel() {
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [hidePath, setHidePath] = useState(false);
  const rows = mapEntries();

  return (
    <section>
      <PanelHeader title="Teleport" description="Choose a map and target coordinates. Map paths are derived from parent IDs." />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <input className="rounded-lg border border-white/10 bg-rmc-abyss px-4 py-3 font-rmc-mono text-rmc-mist outline-none transition focus:border-rmc-aether" type="number" value={x} onChange={(event) => setX(Number(event.target.value))} />
        <input className="rounded-lg border border-white/10 bg-rmc-abyss px-4 py-3 font-rmc-mono text-rmc-mist outline-none transition focus:border-rmc-aether" type="number" value={y} onChange={(event) => setY(Number(event.target.value))} />
        <label className="col-span-2 grid grid-flow-col auto-cols-max cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm">
          <input className="h-5 w-5 accent-rmc-ember" checked={hidePath} type="checkbox" onChange={(event) => setHidePath(event.target.checked)} />
          <span>Hide path column</span>
        </label>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (map) => map.id, sortValue: (map) => map.id },
          hidePath
            ? { key: 'name', header: 'Name', render: (map) => map.name, sortValue: (map) => map.name }
            : { key: 'path', header: 'Path', render: (map) => map.path, sortValue: (map) => map.path },
          { key: 'action', header: '', render: (map) => (
            <Button variant="primary" size="sm" onClick={() => teleportTo(map.id, x, y)}>Teleport</Button>
          )}
        ]}
        rows={rows}
        filter={(map, query) => `${map.id} ${map.path}`.toLowerCase().includes(query)}
        getRowId={(map) => map.id}
      />
    </section>
  );
}
