import { useEffect, useRef } from 'react';
import { BattlePanel } from '../panels/BattlePanel.tsx';
import { GeneralPanel } from '../panels/GeneralPanel.tsx';
import { InventoryPanel } from '../panels/InventoryPanel.tsx';
import { LocationPanel } from '../panels/LocationPanel.tsx';
import { ShortcutsPanel } from '../panels/ShortcutsPanel.tsx';
import { StatsPanel } from '../panels/StatsPanel.tsx';
import { SwitchesPanel } from '../panels/SwitchesPanel.tsx';
import { TeleportPanel } from '../panels/TeleportPanel.tsx';
import { VariablesPanel } from '../panels/VariablesPanel.tsx';
import { useCheatStore, type PanelId } from '../store/useCheatStore.ts';

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    }
    e.stopPropagation();
  }

  return (
    <div
      ref={backdropRef}
      tabIndex={-1}
      className="pointer-events-auto fixed inset-0 z-9999 grid place-items-center bg-rmc-abyss/70 p-3 text-rmc-mist backdrop-blur-md"
      onClick={stopPropagation}
      onKeyDown={handleKeyDown}
    >
      <section className="grid w-[96vw] h-[92vh] md:w-[960px] md:h-[640px] animate-[rmc-fade-in_200ms_ease-out] grid-cols-1 overflow-hidden rounded-2xl border border-rmc-copper/30 bg-[linear-gradient(135deg,rgba(24,34,49,0.98),rgba(8,11,16,0.98)),radial-gradient(circle_at_20%_0%,rgba(255,179,92,0.24),transparent_24rem)] shadow-rmc-panel md:grid-cols-[11rem_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/20 p-3 md:border-r md:border-b-0 md:p-3">
          <div className="grid grid-cols-[1fr_auto] items-start gap-2">
            <div>
              <h2 className="font-rmc-display text-base font-black tracking-tight">
                RMC Toolkit
              </h2>
            </div>
            <button
              className="rounded-full border border-white/10 px-2 py-0.5 text-[0.6rem] text-rmc-slate hover:border-rmc-ember hover:text-rmc-ember cursor-pointer"
              type="button"
              onClick={() => setOpen(false)}
            >
              Esc
            </button>
          </div>
          <nav className="mt-3 grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto md:max-h-none md:grid-cols-1 md:gap-2">
            {panels.map((panel) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-left text-xs transition cursor-pointer ${
                  activePanel === panel.id
                    ? 'bg-rmc-ember text-rmc-abyss font-bold shadow-[0_2px_8px_rgba(255,179,92,0.25)]'
                    : 'bg-white/10 text-rmc-slate hover:bg-white/20 hover:text-rmc-mist'
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
        <main className="overflow-auto p-6 md:p-10">
          <PanelSwitch activePanel={activePanel} portalRoot={portalRoot} />
        </main>
      </section>
    </div>
  );
}

function PanelSwitch({
  activePanel
}: {
  activePanel: PanelId;
  portalRoot?: HTMLElement;
}) {
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
