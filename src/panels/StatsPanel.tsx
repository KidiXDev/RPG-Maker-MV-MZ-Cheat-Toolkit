import { useReducer, useState } from 'react';
import { DataTable } from '../components/DataTable.tsx';
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
  const [selectedActorId, setSelectedActorId] = useState(() => members[0]?.actorId() ?? 0);
  const pushToast = useCheatStore((state) => state.pushToast);
  const selectedActor = members.find((actor) => actor.actorId() === selectedActorId) ?? members[0];

  return (
    <section>
      <PanelHeader title="Stats / Level" description="Per-actor level and parameter inspection with lightweight editing." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded-2xl bg-white/[0.06] px-4 py-2" type="button" onClick={refresh}>
          Reload
        </button>
        <button
          className="rounded-2xl bg-white/[0.06] px-4 py-2"
          type="button"
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
        </button>
        {members.map((actor) => (
          <button
            className={`rounded-2xl px-4 py-2 ${selectedActor?.actorId() === actor.actorId() ? 'bg-rmc-ember text-rmc-abyss' : 'bg-white/[0.06]'}`}
            key={actor.actorId()}
            type="button"
            onClick={() => setSelectedActorId(actor.actorId())}
          >
            {actor.name()}
          </button>
        ))}
      </div>
      {selectedActor ? (
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h4 className="font-rmc-display text-xl font-bold">{selectedActor.name()}</h4>
              <p className="text-sm text-rmc-slate">Actor #{selectedActor.actorId()}</p>
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-rmc-abyss px-4 py-3">
              <input
                className="h-5 w-5 accent-rmc-ember"
                checked={isGodModeEnabled(selectedActor.actorId())}
                type="checkbox"
                onChange={(event) => {
                  toggleGodMode(selectedActor.actorId(), event.target.checked);
                  refresh();
                }}
              />
              God mode
            </label>
            <button
              className="rounded-2xl bg-rmc-aether px-4 py-3 text-sm font-semibold text-rmc-abyss"
              type="button"
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
            </button>
          </div>
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
        </div>
      ) : null}
      <DataTable
        columns={[
          { key: 'name', header: 'Actor', render: (actor) => actor.name(), sortValue: (actor) => actor.name() },
          {
            key: 'level',
            header: 'Level',
            sortValue: (actor) => actor.level,
            render: (actor) => (
              <input
                className="w-24 rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
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
          { key: 'params', header: 'Params', render: (actor) => PARAM_NAMES.map((name, index) => `${name}:${actor.param(index)}`).join(' ') }
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
  return (
    <label className="grid gap-2 text-sm text-rmc-slate">
      {label}
      <input
        className="rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono text-rmc-mist"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
