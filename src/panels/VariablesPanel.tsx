import { useReducer, useState } from 'react';
import { DataTable } from '../components/DataTable.tsx';
import { coerceVariableInput, setVariableValue, variableEntries } from '../game/cheats/variables.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function VariablesPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [hideNameless, setHideNameless] = useState(false);
  const rows = variableEntries().filter((entry) => entry.id > 0 && (!hideNameless || entry.name));

  return (
    <section>
      <PanelHeader title="Variables" description="Read and write RPG Maker variables. Translation features are intentionally omitted." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={refresh}>
          Reload
        </button>
        <label className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3">
          <input className="h-5 w-5 accent-rmc-ember" checked={hideNameless} type="checkbox" onChange={(event) => setHideNameless(event.target.checked)} />
          Hide nameless
        </label>
      </div>
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (entry) => entry.id, sortValue: (entry) => entry.id },
          {
            key: 'name',
            header: 'Name',
            render: (entry) => entry.name || '(nameless)',
            sortValue: (entry) => entry.name
          },
          {
            key: 'value',
            header: 'Value',
            sortValue: (entry) => String(entry.value),
            render: (entry) => (
              <input
                className="rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
                value={String(entry.value)}
                onChange={(event) => {
                  setVariableValue(entry.id, coerceVariableInput(event.target.value));
                  refresh();
                }}
              />
            )
          }
        ]}
        rows={rows}
        filter={(entry, query) => `${entry.id} ${entry.name} ${entry.value}`.toLowerCase().includes(query)}
        getRowId={(entry) => entry.id}
      />
    </section>
  );
}
