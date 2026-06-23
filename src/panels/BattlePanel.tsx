import { useReducer } from 'react';
import { DataTable } from '../components/DataTable.tsx';
import {
  areRandomEncountersEnabled,
  fillPartyTp,
  forceBattleResult,
  forceEncounter,
  partyMembers,
  recoverParty,
  setActorHp,
  setActorMp,
  setActorTp,
  setEnemiesHp,
  setPartyHp,
  setRandomEncountersEnabled,
  woundParty
} from '../game/cheats/battle.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function BattlePanel() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const members = partyMembers();
  const encountersEnabled = areRandomEncountersEnabled();

  return (
    <section>
      <PanelHeader title="Battle / HP-MP" description="Battle result controls and party HP/MP snapshots." />
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          className={`rounded-2xl px-4 py-3 font-semibold ${encountersEnabled ? 'bg-rmc-aether text-rmc-abyss' : 'bg-rmc-danger/20 text-rmc-danger'}`}
          type="button"
          onClick={() => {
            setRandomEncountersEnabled(!encountersEnabled);
            refresh();
          }}
        >
          Encounters {encountersEnabled ? 'on' : 'off'}
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={forceEncounter}>
          Force encounter
        </button>
        {(['victory', 'defeat', 'escape', 'abort'] as const).map((result) => (
          <button className="rounded-2xl bg-rmc-ember px-4 py-3 font-semibold text-rmc-abyss" key={result} type="button" onClick={() => forceBattleResult(result)}>
            {result}
          </button>
        ))}
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { recoverParty(); refresh(); }}>
          Recover party
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { woundParty(); refresh(); }}>
          Wound party
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { fillPartyTp(); refresh(); }}>
          Fill TP
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { setPartyHp(0); refresh(); }}>
          Party HP 0
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { setPartyHp(1); refresh(); }}>
          Party HP 1
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { setEnemiesHp(0); refresh(); }}>
          Enemies HP 0
        </button>
        <button className="rounded-2xl bg-white/[0.06] px-4 py-3" type="button" onClick={() => { setEnemiesHp(1); refresh(); }}>
          Enemies HP 1
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Actor', render: (actor) => actor.name(), sortValue: (actor) => actor.name() },
          {
            key: 'hp',
            header: 'HP',
            sortValue: (actor) => actor.hp,
            render: (actor) => (
              <ResourceInput max={actor.mhp} value={actor.hp} onChange={(value) => { setActorHp(actor.actorId(), value); refresh(); }} />
            )
          },
          {
            key: 'mp',
            header: 'MP',
            sortValue: (actor) => actor.mp,
            render: (actor) => (
              <ResourceInput max={actor.mmp} value={actor.mp} onChange={(value) => { setActorMp(actor.actorId(), value); refresh(); }} />
            )
          },
          {
            key: 'tp',
            header: 'TP',
            sortValue: (actor) => actor.tp,
            render: (actor) => (
              <ResourceInput max={100} value={actor.tp} onChange={(value) => { setActorTp(actor.actorId(), value); refresh(); }} />
            )
          }
        ]}
        rows={members}
        filter={(actor, query) => actor.name().toLowerCase().includes(query)}
        getRowId={(actor) => actor.actorId()}
      />
    </section>
  );
}

function ResourceInput({
  max,
  value,
  onChange
}: {
  max: number;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        className="w-24 rounded-xl border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
        max={max}
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="text-rmc-slate">/ {max}</span>
    </label>
  );
}
