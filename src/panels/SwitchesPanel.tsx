import { useDeferredValue, useReducer, useState } from 'react';
import { Button } from '../components/ui/index.ts';
import { setSwitchValue, switchEntries } from '../game/cheats/switches.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function SwitchesPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [query, setQuery] = useState('');
  const [hideNameless, setHideNameless] = useState(false);
  const requestConfirm = useCheatStore((state) => state.requestConfirm);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const rows = switchEntries().filter((entry) => {
    if (entry.id === 0 || (hideNameless && !entry.name)) {
      return false;
    }
    return normalizedQuery ? `${entry.id} ${entry.name}`.toLowerCase().includes(normalizedQuery) : true;
  });

  return (
    <section>
      <PanelHeader title="Switches" description="Toggle RPG Maker switches. Translation features are intentionally omitted." />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          className="rounded-lg border border-white/10 bg-rmc-abyss/80 px-3 py-1.5 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
          placeholder="Search switches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="grid grid-flow-col auto-cols-max cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
          <input className="h-5 w-5 accent-rmc-ember" checked={hideNameless} type="checkbox" onChange={(event) => setHideNameless(event.target.checked)} />
          <span>Hide nameless</span>
        </label>
        <Button variant="ghost" onClick={refresh}>Reload</Button>
        <Button
          variant="primary"
          onClick={() => {
            const shouldEnable = rows.some((entry) => !entry.value);
            requestConfirm({
              title: `${shouldEnable ? 'Enable' : 'Disable'} filtered switches?`,
              message: `${rows.length} currently visible switches will be updated.`,
              confirmLabel: shouldEnable ? 'Enable switches' : 'Disable switches',
              onConfirm: () => { for (const entry of rows) { setSwitchValue(entry.id, shouldEnable); } refresh(); }
            });
          }}
        >Toggle filtered</Button>
      </div>
      <div className="max-h-[48vh] overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-xs tracking-[0.18em] text-rmc-aether uppercase">
            <tr>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">ID</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Name</th>
              <th className="sticky top-0 bg-rmc-panel px-4 py-3 z-10">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr className="border-t border-white/10 odd:bg-white/[0.03]" key={entry.id}>
                <td className="px-4 py-3">{entry.id}</td>
                <td className="px-4 py-3">{entry.name || '(nameless)'}</td>
                <td className="px-4 py-3">
                  <input className="h-5 w-5 accent-rmc-ember" type="checkbox" checked={entry.value} onChange={(event) => { setSwitchValue(entry.id, event.target.checked); refresh(); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
