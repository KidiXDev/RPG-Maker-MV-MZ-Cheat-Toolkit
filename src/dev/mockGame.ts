import type { Actor, DataItem, DataMapInfo, Enemy, GameGlobalWindow } from '../game/types.ts';

class GameVariables {
  private values = new Map<number, unknown>();

  value(id: number) {
    return this.values.get(id) ?? 0;
  }

  setValue(id: number, value: unknown) {
    this.values.set(id, value);
  }
}

class GameSwitches {
  private values = new Map<number, boolean>();

  value(id: number) {
    return this.values.get(id) ?? false;
  }

  setValue(id: number, value: boolean) {
    this.values.set(id, value);
  }
}

function createActor(id: number, name: string): Actor {
  const baseParams = [620, 140, 72, 58, 64, 51, 88, 44];
  const params = [...baseParams];
  let exp = 1_200 + id * 240;

  return {
    actorId: () => id,
    name: () => name,
    level: 12 + id,
    currentExp: () => exp,
    changeExp(value) {
      this.exp = value;
      exp = value;
    },
    changeLevel(level) {
      this.level = level;
    },
    hp: params[0],
    mp: params[1],
    tp: 15,
    mhp: params[0],
    mmp: params[1],
    param: (paramId) => params[paramId] ?? 0,
    addParam(paramId, value) {
      params[paramId] = Math.max(1, (params[paramId] ?? 0) + value);
      this.mhp = params[0];
      this.mmp = params[1];
    },
    setup() {
      for (let index = 0; index < baseParams.length; index += 1) {
        params[index] = baseParams[index] ?? 1;
      }

      this.level = 12 + id;
      exp = 1_200 + id * 240;
      this.hp = params[0];
      this.mp = params[1];
      this.tp = 15;
      this.mhp = params[0];
      this.mmp = params[1];
    },
    setHp(value) {
      this.hp = Math.max(0, Math.min(this.mhp, value));
    },
    setMp(value) {
      this.mp = Math.max(0, Math.min(this.mmp, value));
    },
    setTp(value) {
      this.tp = Math.max(0, Math.min(100, value));
    },
    recoverAll() {
      this.hp = this.mhp;
      this.mp = this.mmp;
      this.tp = 100;
    }
  };
}

function item(id: number, name: string): DataItem {
  return { id, name, description: `${name} from mock data` };
}

export function setupMockGame() {
  const gameWindow = window as GameGlobalWindow;

  if (gameWindow.$dataSystem && gameWindow.$gameParty) {
    return;
  }

  const actors = [createActor(1, 'Liora'), createActor(2, 'Bram'), createActor(3, 'Nyx')];
  const enemies: Enemy[] = [
    { name: () => 'Slime Regent', hp: 180, mhp: 180, setHp(value) { this.hp = value; } },
    { name: () => 'Clockwork Bat', hp: 90, mhp: 90, setHp(value) { this.hp = value; } }
  ];
  const inventory = new Map<DataItem, number>();
  const dataItems = [null, item(1, 'Potion'), item(2, 'Hi-Potion'), item(3, 'Ether')];
  const dataWeapons = [null, item(1, 'Iron Sword'), item(2, 'Rune Dagger')];
  const dataArmors = [null, item(1, 'Traveler Coat'), item(2, 'Mirror Shield')];

  for (const entry of [...dataItems, ...dataWeapons, ...dataArmors]) {
    if (entry) {
      inventory.set(entry, entry.id * 2);
    }
  }

  gameWindow.$dataSystem = {
    switches: ['', 'Door unlocked', 'Boss defeated', 'Ship acquired'],
    variables: ['', 'Chapter', 'Reputation', 'Arena wins']
  };
  gameWindow.$dataItems = dataItems;
  gameWindow.$dataWeapons = dataWeapons;
  gameWindow.$dataArmors = dataArmors;
  gameWindow.$dataMapInfos = [
    null,
    { id: 1, name: 'Harbor of Ash', parentId: 0 },
    { id: 2, name: 'Copper Arcade', parentId: 1 },
    { id: 3, name: 'Moonwell Shrine', parentId: 0 }
  ] satisfies Array<DataMapInfo | null>;
  gameWindow.$gameVariables = new GameVariables();
  gameWindow.$gameSwitches = new GameSwitches();
  gameWindow.$gamePlayer = {
    x: 12,
    y: 18,
    _moveSpeed: 4,
    _through: false,
    setMoveSpeed(speed) {
      this._moveSpeed = speed;
    },
    setThrough(value) {
      this._through = value;
    },
    reserveTransfer(mapId, x, y) {
      this._reservedTransfer = { mapId, x, y };
      this.x = x;
      this.y = y;
    },
    executeEncounter() {
      return true;
    },
    makeEncounterCount() {
      this._encounterCountMade = true;
    }
  };
  gameWindow.$gameMap = {
    mapId: () => 1,
    displayName: () => 'Harbor of Ash'
  };
  gameWindow.$gameParty = {
    gold: () => 740,
    gainGold(value) {
      this._gold = Math.max(0, (this._gold ?? this.gold()) + value);
    },
    members: () => actors,
    battleMembers: () => actors,
    inBattle: () => true,
    gainItem(dataItem, amount) {
      inventory.set(dataItem, Math.max(0, (inventory.get(dataItem) ?? 0) + amount));
    },
    numItems: (dataItem) => inventory.get(dataItem) ?? 0
  };
  gameWindow.$gameSystem = {
    _encounterEnabled: true,
    disableEncounter() {
      this._encounterEnabled = false;
    },
    enableEncounter() {
      this._encounterEnabled = true;
    },
    isEncounterEnabled() {
      return this._encounterEnabled ?? true;
    }
  };
  gameWindow.$gameTroop = {
    members: () => enemies
  };
  gameWindow.SceneManager = {
    goto(scene) {
      this._scene = new scene();
    },
    push(scene) {
      this._scene = new scene();
    },
    reloadGame() {
      this._reloaded = true;
    },
    _scene: {}
  };
  gameWindow.BattleManager = {
    processVictory() {},
    processDefeat() {},
    processEscape() {
      return true;
    },
    abort() {}
  };
  gameWindow.DataManager = {
    saveGame: () => true,
    loadGame: () => true
  };
  gameWindow.TouchInput = {};
  gameWindow.Window_Message = {
    prototype: {
      updateShowFast() {
        return false;
      },
      updateInput() {
        return false;
      }
    }
  };
  gameWindow.Window_ScrollText = {
    prototype: {
      scrollSpeed() {
        return 2;
      }
    }
  };
  gameWindow.Window_BattleLog = {
    prototype: {
      messageSpeed() {
        return 16;
      }
    }
  };
  gameWindow.Utils = {
    RPGMAKER_NAME: 'MZ',
    isNwjs: () => false
  };
}
