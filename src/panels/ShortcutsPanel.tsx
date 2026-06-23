import { useDeferredValue, useState } from 'react';
import { Badge, Button } from '../components/ui/index.ts';
import { KeyInputField } from '../components/KeyInputField.tsx';
import { DEFAULT_SHORTCUTS } from '../shortcuts/defaults.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { useShortcutStore } from '../store/useShortcutStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function ShortcutsPanel() {
  const [query, setQuery] = useState('');
  const [hideDescriptions, setHideDescriptions] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const shortcuts = useShortcutStore((state) => state.shortcuts);
  const setShortcut = useShortcutStore((state) => state.setShortcut);
  const setShortcutParam = useShortcutStore((state) => state.setShortcutParam);
  const restoreDefaults = useShortcutStore((state) => state.restoreDefaults);
  const requestConfirm = useCheatStore((state) => state.requestConfirm);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleShortcuts = normalizedQuery
    ? shortcuts.filter((shortcut) =>
        `${shortcut.label} ${shortcut.description} ${shortcut.combo}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : shortcuts;

  return (
    <section>
      <PanelHeader title="Shortcuts" description="Customize key combos. Required shortcuts stay present when defaults are restored." />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          className="rounded-lg border border-white/10 bg-rmc-abyss/80 px-3 py-1.5 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
          placeholder="Search shortcuts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="grid grid-flow-col auto-cols-max cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
          <input className="h-5 w-5 accent-rmc-ember" checked={hideDescriptions} type="checkbox" onChange={(event) => setHideDescriptions(event.target.checked)} />
          <span>Hide descriptions</span>
        </label>
        <Button variant="secondary" onClick={() => requestConfirm({ title: 'Restore default shortcuts?', message: 'Custom key bindings and shortcut parameters will be replaced.', confirmLabel: 'Restore defaults', onConfirm: restoreDefaults })}>
          Restore {DEFAULT_SHORTCUTS.length} defaults
        </Button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto grid gap-3 pr-1">
        {visibleShortcuts.map((shortcut) => (
          <div className="grid gap-3 rounded-lg border border-white/10 bg-white/10 p-4 md:grid-cols-[1fr_14rem]" key={shortcut.id}>
            <span>
              <strong>{shortcut.label}</strong>
              {!hideDescriptions ? <span className="mt-1 block text-sm text-rmc-slate">{shortcut.description}</span> : null}
              {shortcut.required ? <Badge variant="warning" className="mt-2">Required</Badge> : null}
            </span>
            <div className="grid gap-2 items-start">
              <KeyInputField value={shortcut.combo} onChange={(value) => setShortcut(shortcut.id, value)} />
              {shortcut.id === 'quickSave' || shortcut.id === 'quickLoad' ? (
                <ParamInput label="Slot" value={shortcut.params?.saveSlot ?? 1} onChange={(value) => setShortcutParam(shortcut.id, 'saveSlot', value)} />
              ) : null}
              {shortcut.id === 'setSpeed' ? (
                <ParamInput label="Move speed" value={shortcut.params?.moveSpeed ?? 4} onChange={(value) => setShortcutParam(shortcut.id, 'moveSpeed', value)} />
              ) : null}
              {shortcut.id === 'skipMessage' ? (
                <ParamInput label="Skip speed" value={shortcut.params?.skipSpeed ?? 6} onChange={(value) => setShortcutParam(shortcut.id, 'skipSpeed', value)} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ParamInput({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return (
    <label className="grid gap-1 text-xs text-rmc-slate">
      {label}
      <input className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist" min={1} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
