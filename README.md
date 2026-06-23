# RPG Maker MV/MZ Cheat Toolkit

React 19 + TypeScript rewrite of an injectable RPG Maker MV/MZ cheat overlay. The overlay runs
inside the NW.js game runtime so it can read and mutate live `$game*` globals.

Translation features from the reference project are intentionally removed.

## Development

```bash
bun install
bun dev
```

`bun dev` runs a browser harness with mocked RPG Maker globals for UI development. Press `Ctrl+C`
or the `RMC` badge to open the overlay.

## Build The Injectable Bundle

```bash
bun run build:inject
```

Output:

- `dist/cheat.js`
- `dist/cheat.css`

React and ReactDOM are bundled into the IIFE artifact. Styles are loaded into the overlay Shadow DOM.

## Install Into A Game

Prerequisites:

- Bun or Node 20+
- A target RPG Maker MV/MZ game that runs on NW.js
- A completed `bun run build:inject`

Run:

```bash
bun scripts/install.mjs --game "C:\path\to\Game"
```

or:

```bash
npm run install:game -- --game "C:\path\to\Game"
```

Windows users can also run `scripts/install.bat` and pass or paste the game folder path.

The installer:

- Detects MV via `www/js/main.js`
- Detects MZ via `js/rmmz_objects.js` and `js/main.js`
- Creates `main.js.rmc-backup` only if it does not already exist
- Injects a guarded `RMC-CHEAT-TOOLKIT` loader block into `main.js`
- Prints a unified-style diff
- Verifies the only `main.js` delta is the marked loader block
- Copies `dist/cheat.js` and `dist/cheat.css` into `www/cheat` for MV or `cheat` for MZ

Run the game and press `Ctrl+C` to open the cheat menu.

### Diagnostic Logging

For runtime debugging, install with diagnostic logging enabled:

```bash
bun scripts/install.mjs --game "C:\path\to\Game" --diagnostic
```

This writes `rmc-diagnostic.log` beside the installed cheat bundle:

- MV: `www/cheat/rmc-diagnostic.log`
- MZ: `cheat/rmc-diagnostic.log`

The log records bundle startup, game-ready wait completion, overlay mount state, global runtime
errors, and shortcut key matches. Reinstall without `--diagnostic` to disable logging.

## Uninstall

```bash
bun scripts/uninstall.mjs --game "C:\path\to\Game"
```

or:

```bash
npm run uninstall:game -- --game "C:\path\to\Game"
```

The uninstaller restores `main.js` from `main.js.rmc-backup` when available. If the backup is
missing, it removes only the marked loader block. Cheat files are removed; `cheat-settings/` is kept
unless `--purge` is passed.

## Troubleshooting

- If install fails, confirm `bun run build:inject` produced `dist/cheat.js` and `dist/cheat.css`.
- If a game uses an old NW.js runtime, devtools and some modern browser APIs may be unavailable.
- To reset browser-dev settings, clear local storage entries starting with `rmc-cheat-`.
- To reset in-game settings, delete the game's `cheat-settings/` folder.
