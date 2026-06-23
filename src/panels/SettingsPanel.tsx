import { Toggle } from '../components/Toggle.tsx';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function SettingsPanel() {
  const hideBadge = useCheatStore((state) => state.hideBadge);
  const setHideBadge = useCheatStore((state) => state.setHideBadge);

  return (
    <section>
      <PanelHeader
        title="Settings"
        description="Customize the toolkit appearance and behaviour."
      />
      <div className="grid gap-3">
        <Toggle
          checked={hideBadge}
          label="Hide RMC badge on bottom-right"
          onChange={(checked) => setHideBadge(checked)}
        />
        <p className="text-xs text-rmc-slate leading-relaxed">
          When hidden, use the configured keyboard shortcut or reload the page
          to show the toolkit again. The setting is saved automatically.
        </p>
      </div>
    </section>
  );
}
