import { useDeferredValue, useReducer, useState } from 'react';
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
          className="rounded-2xl border border-white/10 bg-rmc-abyss/80 px-4 py-3 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
          placeholder="Search switches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3">
          <input className="h-5 w-5 accent-rmc-ember" checked={hideNameless} type="checkbox" onChange={(event) => setHideNameless(event.target.checked)} />
          Hide nameless
        </label>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={refresh}>
          Reload
        </button>
        <button
          className="rounded-2xl bg-rmc-ember px-4 py-3 font-semibold text-rmc-abyss"
          type="button"
          onClick={() => {
            const shouldEnable = rows.some((entry) => !entry.value);

            requestConfirm({
              title: `${shouldEnable ? 'Enable' : 'Disable'} filtered switches?`,
              message: `${rows.length} currently visible switches will be updated.`,
              confirmLabel: shouldEnable ? 'Enable switches' : 'Disable switches',
              onConfirm: () => {
                for (const entry of rows) {
                  setSwitchValue(entry.id, shouldEnable);
                }

                refresh();
              }
            });
          }}
        >
          Toggle filtered
        </button>
      </div>
      <div className="max-h-[48vh] overflow-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-rmc-panel text-xs tracking-[0.18em] text-rmc-aether uppercase">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr className="border-t border-white/10 odd:bg-white/[0.03]" key={entry.id}>
                <td className="px-4 py-3">{entry.id}</td>
                <td className="px-4 py-3">{entry.name || '(nameless)'}</td>
                <td className="px-4 py-3">
                  <input
                    className="h-5 w-5 accent-rmc-ember"
                    type="checkbox"
                    checked={entry.value}
                    onChange={(event) => {
                      setSwitchValue(entry.id, event.target.checked);
                      refresh();
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
