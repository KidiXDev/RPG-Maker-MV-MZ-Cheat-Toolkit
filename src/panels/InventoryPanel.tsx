import { useReducer, useState } from 'react';
import { Button } from '../components/ui/index.ts';
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
      <div className="mb-4 grid grid-flow-col auto-cols-max gap-2">
        <Button variant="ghost" onClick={refresh}>Reload</Button>
        {kinds.map((candidate) => (
          <Button variant={kind === candidate ? 'primary' : 'ghost'} key={candidate} onClick={() => setKind(candidate)}>{candidate}</Button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (item) => <span className="block max-w-[180px] truncate">{item.name}</span>, sortValue: (item) => item.name, className: 'w-0' },
          { key: 'description', header: 'Description', render: (item) => item.description ?? '', sortValue: (item) => item.description ?? '' },
          { key: 'quantity', header: 'Qty', sortValue: (item) => item.quantity, render: (item) => (
            <input className="w-20 rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono" type="number" value={item.quantity} min={0} onChange={(event) => { setItemQuantity(item._item, Number(event.target.value)); refresh(); }} />
          ), className: 'w-0' }
        ]}
        rows={rows}
        filter={(item, query) => item.name.toLowerCase().includes(query)}
        getRowId={(item) => item.id}
      />
    </section>
  );
}
