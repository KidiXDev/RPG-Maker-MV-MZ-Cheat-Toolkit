import type { Actor, DataItem, DataMapInfo, DataSystem, Enemy, SceneConstructor } from './types.ts';

declare global {
  interface Window {
    $dataSystem?: DataSystem;
    $dataItems?: Array<DataItem | null>;
    $dataWeapons?: Array<DataItem | null>;
    $dataArmors?: Array<DataItem | null>;
    $dataMapInfos?: Array<DataMapInfo | null>;
    $gameVariables?: {
      value(id: number): unknown;
      setValue(id: number, value: unknown): void;
    };
    $gameSwitches?: {
      value(id: number): boolean;
      setValue(id: number, value: boolean): void;
    };
    $gameParty?: {
      gold(): number;
      gainGold(value: number): void;
      members(): Actor[];
      battleMembers(): Actor[];
      inBattle?(): boolean;
      gainItem(item: DataItem, amount: number, includeEquip?: boolean): void;
      numItems(item: DataItem): number;
    };
    $gameTroop?: {
      members(): Enemy[];
    };
    $gameSystem?: {
      _encounterEnabled?: boolean;
      disableEncounter?(): void;
      enableEncounter?(): void;
      isEncounterEnabled?(): boolean;
    };
    Scene_Title?: SceneConstructor;
    Scene_Save?: SceneConstructor;
    Scene_Load?: SceneConstructor;
  }
}

export {};
