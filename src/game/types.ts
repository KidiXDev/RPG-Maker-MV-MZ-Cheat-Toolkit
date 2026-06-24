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

export type GameEventData = {
  id: number;
  name: string;
  pages: Array<{
    conditions?: {
      switch1Valid?: boolean;
      switch1Id?: number;
      switch2Valid?: boolean;
      switch2Id?: number;
      variableValid?: boolean;
      variableId?: number;
      variableValue?: number;
    };
    trigger?: number;
    list?: Array<{
      code: number;
      indent: number;
      parameters: unknown[];
    }>;
  }>;
  x: number;
  y: number;
};

export type GameEvent = {
  eventId(): number;
  event(): GameEventData;
  start(): void;
  erase(): void;
  isStarting(): boolean;
  isRunning(): boolean;
  pageIndex(): number;
  page(): GameEventData['pages'][number] | undefined;
  x: number;
  y: number;
  _trigger?: number;
  _erased?: boolean;
};

export type GameGlobalWindow = Window &
  typeof globalThis & {
    $dataSystem?: DataSystem;
    $dataItems?: Array<DataItem | null>;
    $dataWeapons?: Array<DataItem | null>;
    $dataArmors?: Array<DataItem | null>;
    $dataMapInfos?: Array<DataMapInfo | null>;
    $dataMap?: {
      events?: Array<GameEventData | null>;
    };
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
      events(): GameEvent[];
      _events?: Array<GameEvent | null>;
      width?(): number;
      height?(): number;
      isPassable?(x: number, y: number, d: number): boolean;
      tileWidth?(): number;
      tileHeight?(): number;
      _displayX?: number;
      _displayY?: number;
    };
    $gameSelfSwitches?: {
      value(key: [number, number, string]): boolean;
      setValue(key: [number, number, string], value: boolean): void;
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
      allMembers?(): Actor[];
      removeActor?(actorId: number): void;
      addActor?(actorId: number): void;
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
    $gameActors?: {
      actor(actorId: number): Actor | null;
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
      run?(sceneClass: SceneConstructor): void;
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
    Game_Actor?: {
      prototype: Record<string, unknown> & {
        changeExp(exp: number, show: boolean): void;
      };
    };
    Game_Action?: {
      prototype: Record<string, unknown> & {
        evalDamageFormula(target: Record<string, unknown>): number;
      };
    };
    Game_ActionResult?: {
      prototype: Record<string, unknown> & {
        makeDamage(value: number, elementId: number): void;
      };
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
