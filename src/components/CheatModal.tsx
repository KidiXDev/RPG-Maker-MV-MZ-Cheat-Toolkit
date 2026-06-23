import { useEffect, useRef } from 'react';
import { useCheatStore, type PanelId } from '../store/useCheatStore.ts';
import { BattlePanel } from '../panels/BattlePanel.tsx';
import { GeneralPanel } from '../panels/GeneralPanel.tsx';
import { InventoryPanel } from '../panels/InventoryPanel.tsx';
import { LocationPanel } from '../panels/LocationPanel.tsx';
import { ShortcutsPanel } from '../panels/ShortcutsPanel.tsx';
import { StatsPanel } from '../panels/StatsPanel.tsx';
import { SwitchesPanel } from '../panels/SwitchesPanel.tsx';
import { TeleportPanel } from '../panels/TeleportPanel.tsx';
import { VariablesPanel } from '../panels/VariablesPanel.tsx';

type CheatModalProps = {
  portalRoot?: HTMLElement;
};

const panels: Array<{ id: PanelId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'battle', label: 'Battle' },
  { id: 'stats', label: 'Stats' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'variables', label: 'Variables' },
  { id: 'switches', label: 'Switches' },
  { id: 'location', label: 'Locations' },
  { id: 'teleport', label: 'Teleport' },
  { id: 'shortcuts', label: 'Shortcuts' }
];

export function CheatModal({ portalRoot }: CheatModalProps) {
  const activePanel = useCheatStore((state) => state.activePanel);
  const setActivePanel = useCheatStore((state) => state.setActivePanel);
  const setOpen = useCheatStore((state) => state.setOpen);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    backdropRef.current?.focus();
  }, []);

  function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  return (
    <div
      ref={backdropRef}
      tabIndex={-1}
      className="pointer-events-auto fixed inset-0 z-[9999] grid place-items-center bg-rmc-abyss/70 p-3 text-rmc-mist backdrop-blur-md"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <section className="grid h-[min(820px,94vh)] w-[min(1180px,96vw)] animate-[rmc-fade-in_200ms_ease-out] grid-cols-1 overflow-hidden rounded-2xl border border-rmc-copper/30 bg-[linear-gradient(135deg,rgba(24,34,49,0.98),rgba(8,11,16,0.98)),radial-gradient(circle_at_20%_0%,rgba(255,179,92,0.24),transparent_24rem)] shadow-rmc-panel md:grid-cols-[17rem_1fr]">
        <aside className="border-b border-white/10 bg-black/20 p-4 md:border-r md:border-b-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-rmc-mono text-[0.65rem] tracking-[0.35em] text-rmc-copper uppercase">
                Runtime overlay
              </p>
              <h2 className="mt-2 font-rmc-display text-2xl font-black">RMC Toolkit</h2>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-rmc-slate hover:border-rmc-ember hover:text-rmc-ember"
              type="button"
              onClick={() => setOpen(false)}
            >
              Esc
            </button>
          </div>
          <nav className="mt-6 grid max-h-[40vh] grid-cols-2 gap-1 overflow-y-auto md:max-h-none md:grid-cols-1 md:gap-1">
            {panels.map((panel) => (
              <button
                className={`rounded-lg px-4 py-2 text-left text-sm transition ${
                  activePanel === panel.id
                    ? 'bg-rmc-ember text-rmc-abyss'
                    : 'bg-white/[0.04] text-rmc-slate hover:bg-white/[0.08] hover:text-rmc-mist'
                }`}
                key={panel.id}
                type="button"
                onClick={() => setActivePanel(panel.id)}
              >
                {panel.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="overflow-auto p-5 md:p-8">
          <PanelSwitch activePanel={activePanel} portalRoot={portalRoot} />
        </main>
      </section>
    </div>
  );
}

function PanelSwitch({ activePanel }: { activePanel: PanelId; portalRoot?: HTMLElement }) {
  if (activePanel === 'battle') {
    return <BattlePanel />;
  }

  if (activePanel === 'stats') {
    return <StatsPanel />;
  }

  if (activePanel === 'inventory') {
    return <InventoryPanel />;
  }

  if (activePanel === 'variables') {
    return <VariablesPanel />;
  }

  if (activePanel === 'switches') {
    return <SwitchesPanel />;
  }

  if (activePanel === 'location') {
    return <LocationPanel />;
  }

  if (activePanel === 'teleport') {
    return <TeleportPanel />;
  }

  if (activePanel === 'shortcuts') {
    return <ShortcutsPanel />;
  }

  return <GeneralPanel />;
}
