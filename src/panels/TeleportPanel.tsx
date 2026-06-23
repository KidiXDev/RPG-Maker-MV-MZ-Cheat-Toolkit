import { useState } from 'react';
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
        <input className="rounded-2xl border border-white/10 bg-rmc-abyss px-4 py-3 font-rmc-mono" type="number" value={x} onChange={(event) => setX(Number(event.target.value))} />
        <input className="rounded-2xl border border-white/10 bg-rmc-abyss px-4 py-3 font-rmc-mono" type="number" value={y} onChange={(event) => setY(Number(event.target.value))} />
        <label className="col-span-2 flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3">
          <input className="h-5 w-5 accent-rmc-ember" checked={hidePath} type="checkbox" onChange={(event) => setHidePath(event.target.checked)} />
          Hide path column
        </label>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (map) => map.id, sortValue: (map) => map.id },
          hidePath
            ? { key: 'name', header: 'Name', render: (map) => map.name, sortValue: (map) => map.name }
            : { key: 'path', header: 'Path', render: (map) => map.path, sortValue: (map) => map.path },
          {
            key: 'action',
            header: '',
            render: (map) => (
              <button className="rounded-xl bg-rmc-ember px-3 py-2 text-rmc-abyss" type="button" onClick={() => teleportTo(map.id, x, y)}>
                Teleport
              </button>
            )
          }
        ]}
        rows={rows}
        filter={(map, query) => `${map.id} ${map.path}`.toLowerCase().includes(query)}
        getRowId={(map) => map.id}
      />
    </section>
  );
}
