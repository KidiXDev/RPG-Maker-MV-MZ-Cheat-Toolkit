import { useReducer, useState } from 'react';
import { DataTable } from '../components/DataTable.tsx';
import { Button, Card } from '../components/ui/index.ts';
import { partyMembers } from '../game/cheats/battle.ts';
import {
  isGodModeEnabled,
  PARAM_NAMES,
  reloadActorFromData,
  reloadPartyFromData,
  setActorExp,
  setActorLevel,
  setActorParam,
  toggleGodMode
} from '../game/cheats/stats.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function StatsPanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const members = partyMembers();
  const [selectedActorId, setSelectedActorId] = useState(
    () => members[0]?.actorId() ?? 0
  );
  const pushToast = useCheatStore((state) => state.pushToast);
  const selectedActor =
    members.find((actor) => actor.actorId() === selectedActorId) ?? members[0];

  return (
    <section>
      <PanelHeader
        title="Stats / Level"
        description="Per-actor level and parameter inspection with lightweight editing."
      />
      <div className="mb-4 flex flex-wrap items-center">
        <Button variant="ghost" onClick={refresh} className="mr-2 mb-2">
          Reload
        </Button>
        <Button
          variant="ghost"
          className="mr-2 mb-2"
          onClick={() => {
            const reloaded = reloadPartyFromData();
            pushToast(
              reloaded > 0
                ? `Reloaded ${reloaded} actor${reloaded === 1 ? '' : 's'} from data`
                : 'Actor setup reload is unavailable',
              reloaded > 0 ? 'info' : 'danger'
            );
            refresh();
          }}
        >
          Reload from data
        </Button>
        {members.map((actor) => (
          <Button
            variant={
              selectedActor?.actorId() === actor.actorId() ? 'primary' : 'ghost'
            }
            key={actor.actorId()}
            onClick={() => setSelectedActorId(actor.actorId())}
            className="mr-2 mb-2"
          >
            {actor.name()}
          </Button>
        ))}
      </div>
      {selectedActor ? (
        <Card
          className="mb-5"
          title={selectedActor.name()}
          actions={
            <>
              <label className="grid grid-flow-col auto-cols-max items-center gap-2 rounded-lg bg-rmc-abyss px-3 py-1.5 text-sm cursor-pointer">
                <input
                  className="h-5 w-5 accent-rmc-ember"
                  checked={isGodModeEnabled(selectedActor.actorId())}
                  type="checkbox"
                  onChange={(event) => {
                    toggleGodMode(
                      selectedActor.actorId(),
                      event.target.checked
                    );
                    refresh();
                  }}
                />
                <span>God mode</span>
              </label>
              <Button
                variant="secondary"
                onClick={() => {
                  const reloaded = reloadActorFromData(selectedActor.actorId());
                  pushToast(
                    reloaded
                      ? `${selectedActor.name()} reloaded from data`
                      : 'Actor setup reload is unavailable',
                    reloaded ? 'info' : 'danger'
                  );
                  refresh();
                }}
              >
                Reload actor data
              </Button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <StatInput
              label="Level"
              value={selectedActor.level}
              onChange={(value) => {
                setActorLevel(selectedActor.actorId(), value);
                refresh();
              }}
            />
            <StatInput
              label="EXP"
              value={selectedActor.currentExp()}
              onChange={(value) => {
                setActorExp(selectedActor.actorId(), value);
                refresh();
              }}
            />
            {PARAM_NAMES.map((name, index) => (
              <StatInput
                key={name}
                label={name}
                value={selectedActor.param(index)}
                onChange={(value) => {
                  setActorParam(selectedActor.actorId(), index, value);
                  refresh();
                }}
              />
            ))}
          </div>
        </Card>
      ) : null}
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Actor',
            render: (actor) => actor.name(),
            sortValue: (actor) => actor.name()
          },
          {
            key: 'level',
            header: 'Level',
            sortValue: (actor) => actor.level,
            render: (actor) => (
              <input
                className="w-24 rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
                type="number"
                value={actor.level}
                onChange={(event) => {
                  setActorLevel(actor.actorId(), Number(event.target.value));
                  refresh();
                }}
              />
            )
          },
          {
            key: 'exp',
            header: 'EXP',
            render: (actor) => actor.currentExp(),
            sortValue: (actor) => actor.currentExp()
          },
          {
            key: 'params',
            header: 'Params',
            render: (actor) =>
              PARAM_NAMES.map(
                (name, index) => `${name}:${actor.param(index)}`
              ).join(' ')
          }
        ]}
        rows={members}
        filter={(actor, query) => actor.name().toLowerCase().includes(query)}
        getRowId={(actor) => actor.actorId()}
      />
    </section>
  );
}

function StatInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) {
  const [localValue, setLocalValue] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(String(value));
  }

  function commit() {
    const numeric = Number(localValue);
    if (isNaN(numeric)) {
      setLocalValue(String(value));
      return;
    }
    if (numeric !== value) {
      onChange(numeric);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit();
      event.currentTarget.blur();
    }
  }

  return (
    <label className="grid gap-2 text-sm text-rmc-slate">
      {label}
      <input
        className="rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist outline-none transition focus:border-rmc-aether"
        min={0}
        type="number"
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </label>
  );
}
