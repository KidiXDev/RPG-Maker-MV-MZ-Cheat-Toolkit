import { useReducer } from 'react';
import { Button, Card, Select } from '../components/ui/index.ts';
import { NumberField } from '../components/NumberField.tsx';
import { Toggle } from '../components/Toggle.tsx';
import { getGold, setGold, setMoveSpeed, setNoClip } from '../game/cheats/general.ts';
import {
  getGameSpeed,
  restoreGameSpeed,
  setGameSpeed,
  setGameSpeedScope
} from '../game/cheats/gameSpeed.ts';
import { gotoTitle, openLoadScene, openSaveScene, reloadGame } from '../game/cheats/scene.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function GeneralPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const moveSpeed = useCheatStore((state) => state.moveSpeed);
  const gameSpeedScope = useCheatStore((state) => state.gameSpeedScope);
  const noClip = useCheatStore((state) => state.noClip);
  const setStoredMoveSpeed = useCheatStore((state) => state.setMoveSpeed);
  const setStoredGameSpeed = useCheatStore((state) => state.setGameSpeed);
  const setStoredGameSpeedScope = useCheatStore((state) => state.setGameSpeedScope);
  const setStoredNoClip = useCheatStore((state) => state.setNoClip);
  const pushToast = useCheatStore((state) => state.pushToast);
  const requestConfirm = useCheatStore((state) => state.requestConfirm);

  return (
    <section>
      <PanelHeader
        title="General"
        description="Fast runtime controls for movement, gold, scene jumps, and global game speed."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Player">
          <div className="grid gap-3">
            <Toggle
              checked={noClip}
              label="No clip movement"
              onChange={(enabled) => {
                setNoClip(enabled);
                setStoredNoClip(enabled);
              }}
            />
            <NumberField
              label="Move speed"
              value={moveSpeed}
              min={1}
              max={10}
              onChange={(value) => {
                setStoredMoveSpeed(value);
                setMoveSpeed(value, true);
              }}
            />
            <NumberField
              label="Gold"
              value={getGold()}
              min={0}
              onChange={(value) => {
                setGold(value);
                pushToast(`Gold set to ${value}`);
                refresh();
              }}
            />
          </div>
        </Card>
        <Card title="Runtime">
          <div className="grid gap-3">
            <NumberField
              label={`Game speed (${getGameSpeed(gameSpeedScope).toFixed(1)}x)`}
              value={getGameSpeed(gameSpeedScope)}
              min={0.1}
              max={10}
              step={0.1}
              instant
              onChange={(value) => {
                setGameSpeed(value, gameSpeedScope);
                setStoredGameSpeed(value);
                refresh();
              }}
            />
            <Select
              label="Game speed scope"
              options={[
                { value: 'all', label: 'All scenes' },
                { value: 'battle', label: 'Battle only' }
              ]}
              value={gameSpeedScope}
              onChange={(event) => {
                const scope = event.target.value === 'battle' ? 'battle' : 'all';
                setStoredGameSpeedScope(scope);
                setGameSpeedScope(scope);
                refresh();
              }}
            />
            <Button variant="secondary" onClick={() => { restoreGameSpeed(); setStoredGameSpeed(1); setStoredGameSpeedScope('all'); refresh(); }}>
              Restore 1x
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => requestConfirm({ title: 'Go to title?', message: 'Unsaved progress can be lost when the game changes scene.', confirmLabel: 'Go to title', onConfirm: gotoTitle })}>Title</Button>
              <Button variant="ghost" onClick={openSaveScene}>Save</Button>
              <Button variant="ghost" onClick={openLoadScene}>Load</Button>
              <Button variant="danger" onClick={() => requestConfirm({ title: 'Reload game data?', message: 'Reloading the game runtime can interrupt the current scene.', confirmLabel: 'Reload', tone: 'danger', onConfirm: reloadGame })}>Reload</Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
