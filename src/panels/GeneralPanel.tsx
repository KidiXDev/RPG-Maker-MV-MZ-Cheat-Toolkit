import { useReducer } from 'react';
import { NumberField } from '../components/NumberField.tsx';
import { Toggle } from '../components/Toggle.tsx';
import { Button, Card, Slider } from '../components/ui/index.ts';
import {
  getGameSpeedAll,
  getGameSpeedBattle,
  setGameSpeedAll,
  setGameSpeedBattle
} from '../game/cheats/gameSpeed.ts';
import {
  getGold,
  setGold,
  setMoveSpeed,
  setNoClip
} from '../game/cheats/general.ts';
import {
  gotoTitle,
  openLoadScene,
  openSaveScene,
  reloadGame
} from '../game/cheats/scene.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function GeneralPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const moveSpeed = useCheatStore((state) => state.moveSpeed);
  const noClip = useCheatStore((state) => state.noClip);
  const setStoredMoveSpeed = useCheatStore((state) => state.setMoveSpeed);
  const setStoredGameSpeedAll = useCheatStore((state) => state.setGameSpeedAll);
  const setStoredGameSpeedBattle = useCheatStore(
    (state) => state.setGameSpeedBattle
  );
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
              label="No Clip"
              onChange={(enabled) => {
                setNoClip(enabled);
                setStoredNoClip(enabled);
              }}
            />
            <Slider
              label="Move speed"
              value={moveSpeed}
              min={1}
              max={10}
              step={1}
              instant
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
          <div className="grid gap-4">
            <Slider
              label="All Scenes Speed"
              value={getGameSpeedAll()}
              min={0.1}
              max={10}
              step={0.1}
              instant
              formatValue={(v) => `${v.toFixed(1)}x`}
              onChange={(value) => {
                setGameSpeedAll(value);
                setStoredGameSpeedAll(value);
                refresh();
              }}
            />
            <Slider
              label="Battle Speed"
              value={getGameSpeedBattle()}
              min={0.1}
              max={10}
              step={0.1}
              instant
              formatValue={(v) => `${v.toFixed(1)}x`}
              onChange={(value) => {
                setGameSpeedBattle(value);
                setStoredGameSpeedBattle(value);
                refresh();
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  requestConfirm({
                    title: 'Go to title?',
                    message:
                      'Unsaved progress can be lost when the game changes scene.',
                    confirmLabel: 'Go to title',
                    onConfirm: gotoTitle
                  })
                }
              >
                Title
              </Button>
              <Button variant="ghost" onClick={openSaveScene}>
                Save
              </Button>
              <Button variant="ghost" onClick={openLoadScene}>
                Load
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  requestConfirm({
                    title: 'Reload game data?',
                    message:
                      'Reloading the game runtime can interrupt the current scene.',
                    confirmLabel: 'Reload',
                    tone: 'danger',
                    onConfirm: reloadGame
                  })
                }
              >
                Reload
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
