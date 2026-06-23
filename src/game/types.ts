export type EngineKind = 'MV' | 'MZ' | 'unknown';

export type DataItem = {
  id: number;
  name: string;
  description?: string;
};

export type DataMapInfo = {
  id: number;
  name: string;
  parentId: number;
};

export type DataSystem = {
  switches: string[];
  variables: string[];
};

export type Actor = {
  actorId(): number;
  name(): string;
  level: number;
  exp?: number;
  hp: number;
  mp: number;
  tp: number;
  mhp: number;
  mmp: number;
  currentExp(): number;
  changeExp(exp: number, show?: boolean): void;
  changeLevel(level: number, show?: boolean): void;
  param(paramId: number): number;
  addParam(paramId: number, value: number): void;
  setup?(actorId: number): void;
  setHp(value: number): void;
  setMp(value: number): void;
  setTp(value: number): void;
  recoverAll(): void;
};

export type Enemy = {
  name(): string;
  hp: number;
  mhp: number;
  setHp(value: number): void;
};

export type SceneConstructor = new () => object;

export type GameGlobalWindow = Window &
  typeof globalThis & {
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
    $gamePlayer?: {
      x: number;
      y: number;
      _moveSpeed?: number;
      _through?: boolean;
      _reservedTransfer?: { mapId: number; x: number; y: number };
      _encounterCountMade?: boolean;
      setMoveSpeed(speed: number): void;
      setThrough(value: boolean): void;
      reserveTransfer(mapId: number, x: number, y: number, direction?: number, fadeType?: number): void;
      executeEncounter?(): boolean;
      makeEncounterCount?(): void;
    };
    $gameMap?: {
      mapId(): number;
      displayName?(): string;
    };
    $gameParty?: {
      _gold?: number;
      gold(): number;
      gainGold(value: number): void;
      members(): Actor[];
      battleMembers(): Actor[];
      inBattle?(): boolean;
      gainItem(item: DataItem, amount: number, includeEquip?: boolean): void;
      numItems(item: DataItem): number;
    };
    $gameSystem?: {
      _encounterEnabled?: boolean;
      disableEncounter?(): void;
      enableEncounter?(): void;
      isEncounterEnabled?(): boolean;
    };
    $gameTroop?: {
      members(): Enemy[];
    };
    BattleManager?: {
      processVictory(): void;
      processDefeat(): void;
      processEscape(): boolean;
      abort(): void;
    };
    DataManager?: {
      saveGame(savefileId: number): boolean | Promise<boolean>;
      loadGame(savefileId: number): boolean | Promise<boolean>;
    };
    SceneManager?: {
      _scene?: object;
      goto(scene: SceneConstructor): void;
      push(scene: SceneConstructor): void;
      reloadGame?(): void;
      _deltaTime?: number;
      _reloaded?: boolean;
    };
    TouchInput?: Record<string, unknown>;
    Utils?: {
      RPGMAKER_NAME?: string;
      isNwjs?(): boolean;
    };
    Scene_Title?: SceneConstructor;
    Scene_Save?: SceneConstructor;
    Scene_Load?: SceneConstructor;
    Window_Message?: {
      prototype: Record<string, unknown>;
    };
    Window_ScrollText?: {
      prototype: Record<string, unknown>;
    };
    Window_BattleLog?: {
      prototype: Record<string, unknown>;
    };
    require?: (moduleName: string) => unknown;
    nw?: {
      Window?: {
        get(): {
          showDevTools?(): void;
        };
      };
    };
  };

export function gameWindow() {
  return window as GameGlobalWindow;
}
