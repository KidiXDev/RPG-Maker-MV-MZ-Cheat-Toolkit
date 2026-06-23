# Plan: Rewrite RPG Maker MV/MZ Cheat Toolkit in React

## Context

The reference project (`../inspiration-project`) is a **vanilla JS + Vue 2 + Vuetify** cheat
overlay that is injected into RPG Maker MV/MZ games running under **NW.js**. It works by
replacing the game's `main.js` with a custom one that loads `cheat/init/import.js`, which builds
a `<div id="app">`, pulls Vue/Vuetify/Axios from CDN, and mounts a Vue app. The Vue components
read and mutate live game globals (`$gamePlayer`, `$gameParty`, `$gameTroop`, `$dataItems`,
`$gameVariables`, `$gameSwitches`, etc.) in real time.

We are rewriting it into **this** project (React 19 + TypeScript + Vite + Tailwind 4 + Zustand +
Zod) with **full feature parity except all translation functionality**, which is dropped entirely
(this also lets us remove the `axios` dependency — it was only used by the translator).

Goal outcome:
1. A React cheat overlay that bundles to a **single self-contained file** injected into the game.
2. A **mock-game dev harness** so the UI can be built/iterated in a normal browser (`bun dev`).
3. A **safe auto-installer** that detects MV vs MZ, **backs up `main.js`**, **injects a minimal
   guarded loader line** (instead of overwriting the whole file), shows a **diff/compare**, and is
   idempotent + reversible (uninstaller restores the backup).
4. A **build + install tutorial** in the README.

---

## Key architectural decisions

The cheat must run *inside* the game runtime to reach `window.$game*` globals. So unlike a normal
SPA, the production artifact is an **injectable bundle**, not a hosted site. Two build targets:

| Target | Purpose | Command | Output |
|---|---|---|---|
| **Dev/SPA** | Iterate UI in a browser against a mock game | `bun dev` | Vite dev server + HMR |
| **Injectable** | Real artifact loaded into the game | `bun run build:inject` | `dist/cheat.js` + `dist/cheat.css` (single-file IIFE, React bundled in) |

Decisions:

1. **Injectable build = Vite library mode** (`vite.config.inject.ts`): `build.lib` entry
   `src/inject/main.tsx`, `formats: ['iife']`, `inlineDynamicImports: true`, `cssCodeSplit: false`,
   React/ReactDOM bundled (NOT externalized) so it runs from `file://` with no server/CDN.
2. **Style + DOM isolation via Shadow DOM.** The host page is the game; global CSS/Vuetify
   pollution was a weakness of the original. We attach a host `<div id="rmc-cheat-host">` and mount
   React into its **shadow root**. The compiled Tailwind CSS (`cheat.css`) is loaded into the shadow
   root via a `<link>`. React **portals** (dialogs, dropdowns, toasts) target a container *inside*
   the shadow root, not `document.body`.
3. **Mock-game dev harness** (`src/dev/mockGame.ts`): in `import.meta.env.DEV`, populate
   `window` with realistic stubs of `$gameParty`, `$gameTroop`, `$gamePlayer`, `$dataItems`,
   `$dataWeapons`, `$dataArmors`, `$dataMapInfos`, `$gameVariables`, `$gameSwitches`,
   `SceneManager`, `DataManager`, `Utils`, etc. This decouples UI work from a running game.
4. **Engine adapter layer** (`src/game/`): all game mutation logic from the reference
   (`CheatHelper.js`, battle/speed/scene/god-mode/message cheats) is reimplemented as **typed,
   pure-ish TS modules** that operate on the globals. UI never touches `$game*` directly — only
   through this layer. Globals are declared in `src/game/rpgmaker.d.ts`.
5. **State = Zustand**; **persisted settings validated with Zod** on load.
6. **Persistence adapter** (`src/game/storage.ts`): mirrors the reference `KeyValueStorage` —
   if NW.js (`require('fs')` available) write JSON files under the game's `cheat-settings/` dir;
   otherwise fall back to `localStorage` (used in browser dev). Wrap as a Zustand `persist` storage.
7. **No React Router.** The overlay is a single modal with tab/tree navigation driven by state.
8. **Idempotent line-injection installer** (Node, zero-dependency `.mjs` + `.bat` wrapper) instead
   of full `main.js` replacement — safer across RPG Maker versions.

---

## Target project structure

```
src/
  inject/
    main.tsx            # injectable entry: make shadow host, mount <App/>, wait for game globals
    bootstrap.ts        # poll until $dataSystem/SceneManager ready, then patch engine + load settings
  dev/
    mockGame.ts         # window.$game* stubs for browser dev
    DevHarness.tsx      # dev-only frame that loads mocks then renders <App/>
  game/
    rpgmaker.d.ts       # ambient types for $gamePlayer, $gameParty, SceneManager, etc.
    engine.ts           # TouchInput patches (click pass-through guard), ready-detection
    storage.ts          # fs/localStorage KV adapter (Zustand persist storage)
    cheats/
      general.ts        # noClip, setGold, move speed (+ fixed interval), scene jumps, reload
      gameSpeed.ts      # game-speed multiplier w/ all|battle scene option, restore
      battle.ts         # encounter toggle, victory/defeat/escape/abort, recover/fillTP/setHP
      stats.ts          # god mode (method-wrap + interval), level/exp/8 stats edit
      inventory.ts      # read items/weapons/armor; gain/set quantities
      variables.ts      # read/write $gameVariables (NO translation)
      switches.ts       # read/write $gameSwitches, toggle-all-filtered (NO translation)
      location.ts       # save/recall named locations, teleport (NO translation)
      teleport.ts       # map list w/ path, teleport to map x/y (NO translation)
      message.ts        # message-skip engine patches + start/stop skip
      scene.ts          # gotoTitle, toggle save/load scene, quick save/load
  shortcuts/
    keycodes.ts         # port of KeyCodes.js
    defaults.ts         # 13 default shortcut definitions (port of CheatKeyMap)
    manager.ts          # global keydown/keyup dispatch, combo matching, params (port GlobalShortcut)
  store/
    useCheatStore.ts    # ui (open/active tab/prefs), speed, gameSpeed, godMode actor set
    useShortcutStore.ts # shortcut bindings + params (persisted, Zod-validated)
    useLocationStore.ts # saved locations (persisted)
  components/
    CheatModal.tsx, Sidebar/TreeNav.tsx, Toast.tsx, ConfirmDialog.tsx, KeyInputField.tsx,
    DataTable.tsx (searchable/sortable shared table), NumberField.tsx, Toggle.tsx, Slider.tsx
  panels/
    GeneralPanel.tsx, BattlePanel.tsx, StatsPanel.tsx, InventoryPanel.tsx,
    VariablesPanel.tsx, SwitchesPanel.tsx, LocationPanel.tsx, TeleportPanel.tsx,
    ShortcutsPanel.tsx
  App.tsx               # renders CheatModal + global toast/dialog/shortcut listener
scripts/
  install.mjs           # detect MV/MZ, backup, inject, diff, copy bundle
  uninstall.mjs         # restore backup, remove cheat dir
  install.bat / install.sh   # double-click wrappers -> node scripts/install.mjs
vite.config.ts          # dev/SPA (existing)
vite.config.inject.ts   # NEW: library-mode injectable build
```

---

## Feature parity checklist (port ALL except translation)

- **General** — No Clip; set Gold; Move Speed 1–10 (+ "fixed" lock via interval); Game Speed 0.1–10
  with All / Battle-only / Restore-to-1x; quick actions: go to Title, open Save scene, open Load
  scene, reload-from-data.
- **Battle / HP-MP** — disable random encounter; force encounter; force Victory/Defeat/Escape/Abort;
  set all enemies/party HP 0 or 1; recover all; fill TP all; per-member HP/MP editor tables.
- **Stats / Level** — per-actor tabs; God Mode toggle; edit Level/EXP; edit all 8 stats
  (MaxHP, MaxMP, Atk, Def, MAtk, MDef, Agi, Luck); reload-from-data.
- **Inventory** — searchable Items / Weapons / Armor tables; edit owned quantities.
- **Variables** — editable table of `$gameVariables`; search; "hide nameless"; reload. *(translation removed)*
- **Switches** — toggle table of `$gameSwitches`; search; "hide nameless"; toggle-all-filtered; reload. *(translation removed)*
- **Location Save/Recall** — save current location with alias; table with edit/teleport/delete; search; current-map display. *(translation removed)*
- **Teleport** — X/Y inputs; searchable map table with full path + hide-path toggle; teleport. *(translation removed)*
- **Shortcuts** — customizable bindings table; search; per-shortcut params; restore defaults;
  hide-description toggle; non-deletable required shortcuts. Defaults match reference (Ctrl+C toggle,
  Ctrl+M locations, quick save/load, scene jumps, force victory/defeat/escape, no-clip, wound/recover,
  set speed, skip-message hold, F12 dev tools).
- **Message Skip** — engine patches (`updateShowFast`, `updateInput`, scroll/battle-log speed),
  hold-to-skip with optional game-speed acceleration.
- **Dev Tools** — F12 opens NW.js devtools (NW.js only).

**Explicitly removed:** `TranslateSettingsPanel`, `TranslateHelper`/Translator, all `translateBulk`
calls in variables/switches/teleport/location panels, `translate.json` settings, and the `axios`
dependency.

---

## Injection & installer design (the "safe code injection")

**Loader injected into the game's `main.js`** — minimal, guarded, idempotent block:

```js
/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */
(function(){var s=document.createElement('script');s.src='cheat/cheat.js';
s.async=false;document.body.appendChild(s);})();
/* === RMC-CHEAT-TOOLKIT:END === */
```

The bundle self-polls for game globals before patching, so exact injection position is not critical;
we insert right after the first non-comment line. `cheat/cheat.js` is the correct path relative to
`index.html` for **both** MV (`www/index.html`) and MZ (`index.html`).

**`scripts/install.mjs`** (Node, no deps — `fs`/`path`/`readline` only; runnable with system Node or
the NW.js-bundled node):
1. Resolve game dir (CLI arg `--game` or interactive prompt).
2. **Detect engine**: MZ if `js/rmmz_objects.js` exists at root; MV if `www/js/main.js` exists.
   Set `mainJs` path and `cheatDir` (`www/cheat` for MV, `cheat` for MZ).
3. **Backup**: copy `main.js` → `main.js.rmc-backup` **only if backup absent** (preserves true
   original across re-installs).
4. **Idempotency**: if the `RMC-CHEAT-TOOLKIT:START` marker is already in `main.js`, skip injection.
5. **Inject** the guarded loader block; write file.
6. **Compare/diff**: print a unified-style diff of backup vs modified `main.js` so the user sees
   exactly what changed, and assert the only difference is the injected block (abort + restore on
   anomaly).
7. **Copy bundle**: copy `dist/cheat.js` + `dist/cheat.css` (+ assets) into `<cheatDir>/`.
8. Print success + how to uninstall.

**`scripts/uninstall.mjs`**: restore `main.js` from `main.js.rmc-backup` (or strip the marked block
if backup missing), delete `<cheatDir>/`, leave `cheat-settings/` unless `--purge`.

**`install.bat` / `install.sh`**: thin wrappers that run `node scripts/install.mjs "%~1"` so users
can drag-drop the game folder or double-click and paste the path.

This replaces the reference project's `deploy/main.py` (which only packaged releases and required
manual whole-file `main.js` replacement).

---

## README: build & install tutorial (to add)

1. **Prerequisites**: Bun (or Node 20+); the target RPG Maker MV/MZ game must run on NW.js.
2. **Build the bundle**: `bun install` → `bun run build:inject` → produces `dist/cheat.js` + `dist/cheat.css`.
3. **Install into a game (auto)**: `bun scripts/install.mjs --game "C:\path\to\Game"` (or run
   `install.bat`). It auto-detects MV/MZ, backs up `main.js`, injects the loader, shows the diff,
   and copies the bundle.
4. **Run the game** and press **Ctrl+C** to open the cheat menu.
5. **Uninstall**: `bun scripts/uninstall.mjs --game "C:\path\to\Game"` (restores `main.js`, removes cheat files).
6. **UI development without a game**: `bun dev` runs the overlay against the mock game in a browser.
7. **Troubleshooting**: NW.js < 0.26.4 warning; resetting settings by deleting `cheat-settings/`.

---

## Implementation phases

1. **Scaffolding & types**: `rpgmaker.d.ts`, `vite.config.inject.ts`, `build:inject` script, shadow-host
   `inject/main.tsx`, `dev/mockGame.ts` + `DevHarness`, remove unused `axios` dep.
2. **Engine adapter**: port all `src/game/cheats/*` + `engine.ts` (TouchInput patches) + `storage.ts`
   against the typed globals; unit-checkable against mocks.
3. **State + shortcuts**: Zustand stores, Zod schemas, port `keycodes`/`defaults`/`manager`.
4. **Shared UI**: `CheatModal`, `TreeNav`, `DataTable`, form controls, toast, confirm dialog,
   `KeyInputField` — styled with Tailwind; apply `frontend-design` skill for a distinctive,
   non-templated dark overlay aesthetic.
5. **Panels**: implement all 9 panels (translation excluded) wired to the adapter + stores.
6. **Installer**: `install.mjs` / `uninstall.mjs` + wrappers; README tutorial.
7. **Polish**: keyboard handling parity, persistence round-trip, NW.js detection paths.

---

## Verification

- **Browser (mocks)**: `bun dev` — exercise every panel against `mockGame`; confirm reads render and
  edits update mock state; toasts/dialogs/portals render inside the shadow root; Tailwind styles are
  isolated (no leakage to host page in dev frame).
- **Type/lint**: `bun run typecheck` (strict, `noUnusedLocals/Parameters`) and `bun run lint` clean.
- **Build**: `bun run build:inject` emits a single `cheat.js` (React inlined, no external imports/CDN)
  + `cheat.css`.
- **Installer (dry)**: run `install.mjs` against a copied MV sample and an MZ sample; verify backup
  created, diff shows only the injected block, re-run is a no-op (idempotent), bundle copied to the
  right dir; `uninstall.mjs` restores `main.js` byte-for-byte.
- **In-game (manual, if a test game is available)**: launch under NW.js, press Ctrl+C, smoke-test
  No-Clip, gold edit, force-victory in a battle, teleport, god mode, and settings persistence across
  a relaunch.
```

---

## Assumptions (adjust if needed)
- Injectable bundle is single-file IIFE with React bundled; styles isolated via **Shadow DOM**.
- Installer is **Node, zero-dependency**, line-injection + backup + diff (not whole-file replace).
- UI is developed against a **mock game**; no router.
- `axios` is dropped (translation-only dependency).
```
