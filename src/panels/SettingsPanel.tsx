import { Toggle } from '../components/Toggle.tsx';
import { Card, Select } from '../components/ui/index.ts';
import { useCheatStore, type HudPosition } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

const HUD_POSITION_OPTIONS: Array<{ value: HudPosition; label: string }> = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' }
];

export function SettingsPanel() {
  const hideBadge = useCheatStore((state) => state.hideBadge);
  const setHideBadge = useCheatStore((state) => state.setHideBadge);
  const hudEnabled = useCheatStore((state) => state.hudEnabled);
  const hudPosition = useCheatStore((state) => state.hudPosition);
  const hudShowFps = useCheatStore((state) => state.hudShowFps);
  const hudShowMap = useCheatStore((state) => state.hudShowMap);
  const hudShowCoords = useCheatStore((state) => state.hudShowCoords);
  const hudShowEvents = useCheatStore((state) => state.hudShowEvents);
  const setHudEnabled = useCheatStore((state) => state.setHudEnabled);
  const setHudPosition = useCheatStore((state) => state.setHudPosition);
  const setHudShowFps = useCheatStore((state) => state.setHudShowFps);
  const setHudShowMap = useCheatStore((state) => state.setHudShowMap);
  const setHudShowCoords = useCheatStore((state) => state.setHudShowCoords);
  const setHudShowEvents = useCheatStore((state) => state.setHudShowEvents);

  return (
    <section>
      <PanelHeader
        title="Settings"
        description="Customize the toolkit appearance and behaviour."
      />
      <div className="grid gap-4">
        <Card title="Appearance">
          <div className="grid gap-3">
            <Toggle
              checked={hideBadge}
              label="Hide RMC badge on bottom-right"
              onChange={(checked) => setHideBadge(checked)}
            />
          </div>
        </Card>

        <Card title="Overlay HUD">
          <div className="grid gap-3">
            <Toggle
              checked={hudEnabled}
              label="Enable overlay HUD"
              onChange={(checked) => setHudEnabled(checked)}
            />
            <Select
              label="HUD position"
              options={HUD_POSITION_OPTIONS}
              value={hudPosition}
              onChange={(event) =>
                setHudPosition(event.target.value as HudPosition)
              }
            />
            <Toggle
              checked={hudShowFps}
              label="Show FPS"
              onChange={setHudShowFps}
            />
            <Toggle
              checked={hudShowMap}
              label="Show map info"
              onChange={setHudShowMap}
            />
            <Toggle
              checked={hudShowCoords}
              label="Show player coordinates"
              onChange={setHudShowCoords}
            />
            <Toggle
              checked={hudShowEvents}
              label="Show running events"
              onChange={setHudShowEvents}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
