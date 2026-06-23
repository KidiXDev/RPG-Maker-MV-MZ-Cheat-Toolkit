import { useReducer } from 'react';
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
  const gameSpeed = useCheatStore((state) => state.gameSpeed);
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h4 className="font-rmc-display text-xl font-bold">Player</h4>
          <div className="mt-4 grid gap-3">
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
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h4 className="font-rmc-display text-xl font-bold">Runtime</h4>
          <div className="mt-4 grid gap-3">
            <NumberField
              label={`Game speed (${getGameSpeed().toFixed(1)}x)`}
              value={gameSpeed}
              min={0.1}
              max={10}
              onChange={(value) => {
                setStoredGameSpeed(value);
                setGameSpeed(value, gameSpeedScope);
              }}
            />
            <label className="grid gap-2 text-sm text-rmc-slate">
              Game speed scope
              <select
                className="rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 text-rmc-mist outline-none transition focus:border-rmc-aether"
                value={gameSpeedScope}
                onChange={(event) => {
                  const scope = event.target.value === 'battle' ? 'battle' : 'all';
                  setStoredGameSpeedScope(scope);
                  setGameSpeedScope(scope);
                  refresh();
                }}
              >
                <option value="all">All scenes</option>
                <option value="battle">Battle only</option>
              </select>
            </label>
            <button
              className="rounded-2xl bg-rmc-aether px-4 py-3 font-semibold text-rmc-abyss"
              type="button"
              onClick={() => {
                restoreGameSpeed();
                setStoredGameSpeed(1);
                setStoredGameSpeedScope('all');
                refresh();
              }}
            >
              Restore 1x
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm hover:bg-white/[0.1]"
                type="button"
                onClick={() =>
                  requestConfirm({
                    title: 'Go to title?',
                    message: 'Unsaved progress can be lost when the game changes scene.',
                    confirmLabel: 'Go to title',
                    onConfirm: gotoTitle
                  })
                }
              >
                Title
              </button>
              <button className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm hover:bg-white/[0.1]" type="button" onClick={openSaveScene}>
                Save
              </button>
              <button className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm hover:bg-white/[0.1]" type="button" onClick={openLoadScene}>
                Load
              </button>
              <button
                className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm hover:bg-white/[0.1]"
                type="button"
                onClick={() =>
                  requestConfirm({
                    title: 'Reload game data?',
                    message: 'Reloading the game runtime can interrupt the current scene.',
                    confirmLabel: 'Reload',
                    tone: 'danger',
                    onConfirm: reloadGame
                  })
                }
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
