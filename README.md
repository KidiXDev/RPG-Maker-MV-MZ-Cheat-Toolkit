# 🎮 RPG Maker MV/MZ Cheat Toolkit

A modern, high-performance, and feature-rich injectable cheat overlay for RPG Maker MV and MZ games. This toolkit is a complete rewrite in **React 19**, **TypeScript**, and **Tailwind CSS 4**, running directly inside the game's NW.js runtime to read and mutate live game states (`$game*` globals).


## Overview

This project is a modernized, from-scratch rewrite based on the logic and features of the following legacy plugins:
- 🔗 [RPG-Maker-MV-MZ-Cheat-UI-Plugin](https://github.com/paramonos/RPG-Maker-MV-MZ-Cheat-UI-Plugin) by **paramonos**
- 🔗 [RPG-Maker-MV-Cheat-Menu-Plugin](https://github.com/emerladCoder/RPG-Maker-MV-Cheat-Menu-Plugin) by **emerladCoder**

### Key Enhancements in this Rewrite:
- **Modern Tech Stack:** Built from the ground up using **React 19**, **TypeScript**, and **Tailwind CSS 4** for a clean, modular, and typed codebase.
- **Shadow DOM Isolation:** Styles are isolated inside a Shadow DOM container, preventing any CSS leakages or styling conflicts with the host game.


## 🛠️ Features

The toolkit provides a comprehensive suite of panels to inspect and modify game states:

| Panel | Description |
| :--- | :--- |
| **📁 General** | Manage core variables (Gold, Steps, Saves, Speed hack, No Clip, God Mode). |
| **⚔️ Trainer** | Manage party members, level, EXP, HP, MP, TP, and buff states. |
| **💥 Battle** | Modify battle states, escape battles, kill enemies, or instant win. |
| **📈 Stats** | View and edit individual character base stats, parameters, and traits. |
| **🎒 Inventory** | Add, remove, or modify quantities of Items, Weapons, and Armor. |
| **🔧 Variables** | Search, inspect, and change live RPG Maker game variables. |
| **🔌 Switches** | Search, inspect, and toggle live RPG Maker game switches. |
| **📍 Locations** | Teleport to different coordinates, maps, or specific locations. |
| **🌀 Teleport** | Save custom teleport coordinates and warp directly to them. |
| **🎬 Events** | Trigger, run, or reset map events dynamically. |
| **⌨️ Shortcuts** | Configure hotkeys for quick actions (e.g., healing, toggling no-clip, spawning items). |
| **⚙️ Settings** | Customize the overlay appearance, badge visibility, and UI scaling. |

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or **Node.js 20+**
- A target RPG Maker MV or MZ game running on the NW.js runtime

### Development Setup
To run the browser-based test harness (with mocked RPG Maker global variables for UI design and development):

```bash
# Install dependencies
bun install

# Run the dev server
bun dev
```
*Note: Press `Ctrl+C` or click the floating `RMC` badge in the browser to toggle the cheat overlay.*

## 📦 Bundling & Installation

### 1. Build the Injectable Bundle
Compile the TypeScript and React code into a single client-side script:

```bash
bun run build:inject
```
This generates the standalone files:
- `dist/cheat.js` — Self-contained IIFE bundling React, ReactDOM, and toolkit logic.
- `dist/cheat.css` — Compiled Tailwind CSS 4 stylesheet injected into the Shadow DOM.

### 2. Install Into a Game
Run the installation script by providing the path to your target game's root directory:

Using Bun:
```bash
bun scripts/install.mjs --game "C:\path\to\Game"
```

Using npm:
```bash
npm run install:game -- --game "C:\path\to\Game"
```

*For Windows users, you can also run `scripts/install.bat` and paste your game path when prompted.*

#### What the Installer Does:
1. **Detections:** Auto-detects MV (via `www/js/main.js`) or MZ (via `js/rmmz_objects.js` & `js/main.js`).
2. **Backups:** Automatically creates a `main.js.rmc-backup` file (if not already existing).
3. **Injection:** Injects a guarded loading script (`RMC-CHEAT-TOOLKIT`) into the game's `main.js`.
4. **Verification:** Outputs a unified diff comparison and verifies that only the loader block was altered.
5. **Assets Copying:** Copies `dist/cheat.js` and `dist/cheat.css` into the game's subfolder:
   - **MV:** `www/cheat/`
   - **MZ:** `cheat/`

## 🛠️ Advanced Usage & Diagnostics

### Diagnostic Logging
If the cheat overlay is not opening or you want to debug runtime errors in the game engine:

```bash
bun scripts/install.mjs --game "C:\path\to\Game" --diagnostic
```
This writes `rmc-diagnostic.log` beside the installed cheat bundle:
- **MV:** `www/cheat/rmc-diagnostic.log`
- **MZ:** `cheat/rmc-diagnostic.log`

The log records bundle startup, game-ready wait completion, overlay mount state, global runtime errors, and shortcut key matches. Reinstall without `--diagnostic` to disable logging.


## 🗑️ Uninstalling

To safely remove the toolkit and restore the game's files to their original state:

Using Bun:
```bash
bun scripts/uninstall.mjs --game "C:\path\to\Game"
```

Using npm:
```bash
npm run uninstall:game -- --game "C:\path\to\Game"
```

*This restores `main.js` from backup, cleans up injected scripts, and deletes the cheat asset folder. Your custom settings folder (`cheat-settings/`) is kept unless you pass `--purge`.*


## 🔍 Troubleshooting

- **Overlay won't open in game:**
  - Verify that `Ctrl+C` is the correct key and that you successfully ran `bun run build:inject` before installation.
  - Check the Developer Tools console (`F8`, `F12`, or `Ctrl+Shift+I` depending on the game configuration) for initialization errors.
- **Older NW.js runtimes:**
  - If a game uses an older NW.js version, modern JS features might not be supported. Try updating the NW.js runtime of the game or check developer logs.
- **Resetting Settings:**
  - **In Browser Dev:** Clear Local Storage keys prefixed with `rmc-cheat-`.
  - **In Game:** Delete the `cheat-settings/` directory created in your game's runtime folder.

