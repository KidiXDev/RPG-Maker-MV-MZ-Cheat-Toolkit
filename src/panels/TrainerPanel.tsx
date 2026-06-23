import { useReducer } from 'react';
import { Button, Card, Slider } from '../components/ui/index.ts';
import { partyMembers } from '../game/cheats/battle.ts';
import {
  addExpToAll,
  allItems99,
  maxAgility,
  maxGold,
  maxLevel,
  maxStats,
} from '../game/cheats/trainer.ts';
import {
  getExpMultiplier,
  setExpMultiplier,
  getDamageMultiplier,
  setDamageMultiplier,
} from '../game/cheats/multipliers.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function TrainerPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const pushToast = useCheatStore((state) => state.pushToast);
  const setStoredExpMultiplier = useCheatStore((state) => state.setExpMultiplier);
  const setStoredDamageMultiplier = useCheatStore((state) => state.setDamageMultiplier);

  const members = partyMembers();

  return (
    <section>
      <PanelHeader
        title="Trainer"
        description="Bulk-cheat presets for party, plus EXP and damage multipliers. For per-actor edits and battle-result controls see the Battle and Stats panels."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick Cheats">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                maxGold();
                pushToast('Gold set to 9,999,999');
                refresh();
              }}
            >
              Max Gold
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                maxLevel();
                pushToast('All party members set to level 99');
                refresh();
              }}
            >
              Max Level
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                maxStats();
                pushToast('All stats set to 999');
                refresh();
              }}
            >
              Max Stats
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                maxAgility();
                pushToast('Agility set to 9999');
                refresh();
              }}
            >
              Max Agility
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                allItems99();
                pushToast('All items/weapons/armor set to 99');
                refresh();
              }}
            >
              All Items x99
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                addExpToAll(10000);
                pushToast('Added 10,000 EXP to all');
                refresh();
              }}
            >
              +10K EXP
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                addExpToAll(100000);
                pushToast('Added 100,000 EXP to all');
                refresh();
              }}
            >
              +100K EXP
            </Button>
          </div>
        </Card>

        <Card title="Multipliers">
          <div className="grid gap-4">
            <Slider
              label="EXP Multiplier"
              value={getExpMultiplier()}
              min={0}
              max={100}
              step={0.5}
              instant
              formatValue={(v) => `${v.toFixed(1)}x`}
              onReset={() => {
                setExpMultiplier(1);
                setStoredExpMultiplier(1);
                refresh();
              }}
              resetLabel="Reset to 1x"
              onChange={(value) => {
                setExpMultiplier(value);
                setStoredExpMultiplier(value);
                refresh();
              }}
            />
            <Slider
              label="Damage Multiplier"
              value={getDamageMultiplier()}
              min={0}
              max={999}
              step={0.5}
              instant
              formatValue={(v) => `${v.toFixed(1)}x`}
              onReset={() => {
                setDamageMultiplier(1);
                setStoredDamageMultiplier(1);
                refresh();
              }}
              resetLabel="Reset to 1x"
              onChange={(value) => {
                setDamageMultiplier(value);
                setStoredDamageMultiplier(value);
                refresh();
              }}
            />
          </div>
        </Card>

        <Card title="Party Info" className="lg:col-span-2">
          <div className="grid gap-2 text-sm">
            {members.length === 0 ? (
              <p className="text-rmc-slate">No party members.</p>
            ) : (
              members.map((actor) => (
                <div
                  key={actor.actorId()}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg bg-white/5 px-4 py-2"
                >
                  <span className="text-rmc-mist font-medium">
                    {actor.name()}
                  </span>
                  <span className="text-rmc-slate font-rmc-mono text-xs">
                    Lv {actor.level}
                  </span>
                  <span className="text-rmc-slate font-rmc-mono text-xs">
                    HP {actor.hp}/{actor.mhp}
                  </span>
                  <span className="text-rmc-slate font-rmc-mono text-xs">
                    MP {actor.mp}/{actor.mmp}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
