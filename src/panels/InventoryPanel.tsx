import { useReducer, useState } from 'react';
import { DataTable } from '../components/DataTable.tsx';
import { inventoryEntries, setItemQuantity, type InventoryKind } from '../game/cheats/inventory.ts';
import { PanelHeader } from './PanelHeader.tsx';

const kinds: InventoryKind[] = ['items', 'weapons', 'armors'];

export function InventoryPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [kind, setKind] = useState<InventoryKind>('items');
  const rows = inventoryEntries(kind);

  return (
    <section>
      <PanelHeader title="Inventory" description="Search items, weapons, and armor, then set owned quantities." />
      <div className="mb-4 flex gap-2">
        <button className="rounded-2xl bg-white/[0.06] px-4 py-2" type="button" onClick={refresh}>
          Reload
        </button>
        {kinds.map((candidate) => (
          <button className={`rounded-2xl px-4 py-2 ${kind === candidate ? 'bg-rmc-ember text-rmc-abyss' : 'bg-white/[0.06]'}`} key={candidate} type="button" onClick={() => setKind(candidate)}>
            {candidate}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (item) => item.name, sortValue: (item) => item.name },
          {
            key: 'description',
            header: 'Description',
            render: (item) => item.description ?? '',
            sortValue: (item) => item.description ?? ''
          },
          {
            key: 'quantity',
            header: 'Qty',
            sortValue: (item) => item.quantity,
            render: (item) => (
              <input
                className="w-24 rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
                type="number"
                value={item.quantity}
                min={0}
                onChange={(event) => {
                  setItemQuantity(item, Number(event.target.value));
                  refresh();
                }}
              />
            )
          }
        ]}
        rows={rows}
        filter={(item, query) => item.name.toLowerCase().includes(query)}
        getRowId={(item) => item.id}
      />
    </section>
  );
}
