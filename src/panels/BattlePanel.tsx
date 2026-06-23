import { useReducer } from 'react';
import { Button } from '../components/ui/index.ts';
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
        <Button variant={encountersEnabled ? 'secondary' : 'danger'} onClick={() => { setRandomEncountersEnabled(!encountersEnabled); refresh(); }}>
          Encounters {encountersEnabled ? 'on' : 'off'}
        </Button>
        <Button variant="ghost" onClick={forceEncounter}>Force encounter</Button>
        {(['victory', 'defeat', 'escape', 'abort'] as const).map((result) => (
          <Button variant="primary" key={result} onClick={() => forceBattleResult(result)}>{result}</Button>
        ))}
        <Button variant="ghost" onClick={() => { recoverParty(); refresh(); }}>Recover party</Button>
        <Button variant="ghost" onClick={() => { woundParty(); refresh(); }}>Wound party</Button>
        <Button variant="ghost" onClick={() => { fillPartyTp(); refresh(); }}>Fill TP</Button>
        <Button variant="ghost" onClick={() => { setPartyHp(0); refresh(); }}>Party HP 0</Button>
        <Button variant="ghost" onClick={() => { setPartyHp(1); refresh(); }}>Party HP 1</Button>
        <Button variant="ghost" onClick={() => { setEnemiesHp(0); refresh(); }}>Enemies HP 0</Button>
        <Button variant="ghost" onClick={() => { setEnemiesHp(1); refresh(); }}>Enemies HP 1</Button>
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
        className="w-24 rounded-lg border border-white/10 bg-rmc-abyss px-3 py-2 font-rmc-mono"
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
