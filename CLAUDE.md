# CLAUDE.md

This file provides guidance to AI Agents when working with code in this repository.

## Commands

```bash
bun dev              # Dev server with HMR (browser harness with mock RPG Maker globals)
bun run build        # TypeScript check + Vite production build (browser config)
bun run build:inject # Build the injectable bundle (dist/cheat.js) for game installation
bun run lint         # ESLint
bun run typecheck    # TypeScript check only (no emit)
bun run format       # Prettier format
```

## Architecture

React 19 + TypeScript + Vite SPA. An injectable cheat overlay for RPG Maker MV/MZ games that runs inside the game's NW.js runtime, reading and mutating live `$game*` globals.

### Dual build configuration

- **`vite.config.ts`** — browser dev harness. Uses `src/dev/mockGame.ts` to simulate RPG Maker globals (`$gameParty`, `$dataSystem`, etc.) so the UI can be developed in a browser.
- **`vite.config.inject.ts`** — produces the standalone IIFE bundle (`dist/cheat.js`) that gets injected into real games.

### Injection flow

The install script (`scripts/install.mjs`) patches the game's `main.js` to load `dist/cheat.js` as a `<script>` before the game engine initializes. The bundle (`src/inject/main.tsx`) creates a Shadow DOM host (`#rmc-cheat-host`) covering the full viewport with `z-index: 2147483647` and `pointer-events: none`. All overlay UI renders inside this shadow root to isolate styles from the host game.

### Game startup gating

`delaySceneManagerRun()` (in `engine.ts`) intercepts `SceneManager.run` — the game's first scene load is deferred until the intro overlay dismisses (auto-dismiss after 2s). This prevents the game from starting before the cheat toolkit is fully initialized. `startDelayedGame()` releases the deferred scene.

### CSS compatibility layer

RPG Maker MV uses NW.js 0.29 (Chromium 65), which lacks support for `@layer`, logical properties (`padding-inline`, etc.), and `color-mix()`. `inject/main.tsx` preprocesses the CSS at runtime:
- `stripAtLayer()` — removes `@layer` wrappers, inlines the inner rules
- `replaceLogicalAndGapProperties()` — expands logical properties to physical equivalents, duplicates `gap` to `grid-gap` for older Chrome
- `:root` → `:host` for Shadow DOM scoping
- `/index.css` contains manual `color-mix` fallback overrides for every `bg-white/N` utility used

### Game state access

All RPG Maker globals are accessed through `gameWindow()` (`src/game/types.ts`), which casts `window` to `GameGlobalWindow`. This type declares all the `$game*`, `$data*`, `SceneManager`, `BattleManager`, etc. globals. Cheat modules under `src/game/cheats/` read and write these directly — there is no abstraction layer.

### Cheat modules (`src/game/cheats/`)

Each file encapsulates one cheat domain. They hold module-level state (multiplier values, patch flags) and expose getter/setter functions:

- **`general.ts`** — gold, move speed, no-clip, current map name
- **`gameSpeed.ts`** — game speed multiplier (all scenes vs battle-only), patches `SceneManager._deltaTime`
- **`battle.ts`** — party/enemy HP/MP/TP manipulation, encounter control, battle result forcing
- **`stats.ts`** — per-actor level/EXP/params, god mode (interval-based HP/MP/TP refill)
- **`inventory.ts`** — item/weapon/armor quantity read/write
- **`switches.ts`** / **`variables.ts`** — game switch and variable inspection/mutation
- **`teleport.ts`** — map listing and `reserveTransfer` teleportation
- **`location.ts`** — save/recall map positions (persisted via `useLocationStore`)
- **`message.ts`** — patches `Window_Message`/`Window_ScrollText`/`Window_BattleLog` prototypes to accelerate or skip text rendering
- **`scene.ts`** — scene navigation (title, save/load, reload), quick save/load, DevTools
- **`multipliers.ts`** — patches `Game_Actor.prototype.changeExp` for EXP multiplier; patches `Game_Action.prototype.evalDamageFormula` (not `makeDamage` — they chain, so patching both would square the multiplier)
- **`events.ts`** — list/trigger/erase events on the current map via `$gameMap.events()`
- **`trainer.ts`** — bulk-cheat presets (max gold/level/stats, all items ×99, bulk EXP)

When writing new cheat modules, follow the patching pattern from `message.ts` or `multipliers.ts`: store originals in a `WeakMap`, wrap with a guard flag so patches apply exactly once, and read multiplier state from module scope so changes take effect immediately without re-patching.

### Store architecture (Zustand + Zod persistence)

- **`useCheatStore`** (`rmc-cheat-ui` key) — main store: active panel, overlay open state, game/move speed, no-clip, hide-badge, multipliers. Persisted settings are validated with Zod schemas in `partialize()` before writing.
- **`useLocationStore`** (`rmc-cheat-locations` key) — saved map locations.
- **`useShortcutStore`** — keyboard shortcut definitions (not persisted; defaults from `shortcuts/defaults.ts`).

Persistence storage (`createCheatStorage()` in `storage.ts`): in NW.js, writes JSON files to a `cheat-settings/` directory next to the game executable using Node's `fs` module. In browsers (dev harness), falls back to `localStorage`.

### Keyboard shortcut system

`useShortcutManager()` (`shortcuts/manager.ts`) listens on `window` at the capture phase. It matches key events against configured shortcuts (defaults in `shortcuts/defaults.ts`), fires the corresponding cheat action, and calls `preventDefault()`/`stopImmediatePropagation()` to prevent the key from reaching the game. The **skipMessage** (Shift) shortcut is special — it only calls `preventDefault` on `keyup`, and fires `startMessageSkip`/`stopMessageSkip` on hold/release.

### Touch input isolation

`patchTouchInputPassThrough()` (in `engine.ts`) wraps RPG Maker's `TouchInput` methods to bail out when the event target is inside `#rmc-cheat-host` (checked via `isOverlayEvent()`). This prevents clicks on the overlay from being interpreted as game input.

### CSS / Design tokens

Tailwind CSS 4 with a custom theme (`@theme` in `index.css`):
- Colors: `rmc-abyss` (darkest bg), `rmc-ink`, `rmc-panel`, `rmc-slate` (muted text), `rmc-mist` (light text), `rmc-copper`, `rmc-ember` (accent), `rmc-aether` (info), `rmc-danger`
- Fonts: `Plus Jakarta Sans` (display/body), `JetBrains Mono` (mono)
- UI components in `src/components/ui/` follow a consistent prop pattern (`className?: string` for extension)

### Dev harness (`src/dev/`)

`mockGame.ts` populates `window` with fake RPG Maker globals so the UI can be tested in a browser. `DevHarness.tsx` provides a debug panel showing the mock state. The mock must be kept in sync with `GameGlobalWindow` types when new globals are added.

## Key Config

- **Tailwind CSS 4** — Vite plugin (`@tailwindcss/vite`), no `tailwind.config.ts`
- **TypeScript** — strict mode, `noUnusedLocals` + `noUnusedParameters` enforced
- **Prettier** — single quotes, 2-space indent, Tailwind class sorting via `prettier-plugin-tailwindcss`
- **Path alias** — `@/` → `./src/`
- No test framework
