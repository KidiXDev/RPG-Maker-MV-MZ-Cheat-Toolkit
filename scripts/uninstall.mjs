#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const MARKER_START = '/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */';
const MARKER_END = '/* === RMC-CHEAT-TOOLKIT:END === */';

function parseArgs(argv) {
  const args = { game: '', help: false, purge: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--purge') {
      args.purge = true;
    } else if (arg === '--game') {
      args.game = argv[index + 1] ?? '';
      index += 1;
    } else if (!args.game) {
      args.game = arg;
    }
  }

  return args;
}

async function promptForGameDir() {
  const rl = readline.createInterface({ input, output });

  try {
    return await rl.question('Game folder path: ');
  } finally {
    rl.close();
  }
}

function detectGame(gameDir) {
  const mvMain = path.join(gameDir, 'www', 'js', 'main.js');
  const mzMain = path.join(gameDir, 'js', 'main.js');
  const mzObjects = path.join(gameDir, 'js', 'rmmz_objects.js');

  if (fs.existsSync(mzObjects) && fs.existsSync(mzMain)) {
    return {
      engine: 'MZ',
      mainJs: mzMain,
      cheatDir: path.join(gameDir, 'cheat'),
      settingsDir: path.join(gameDir, 'cheat-settings')
    };
  }

  if (fs.existsSync(mvMain)) {
    return {
      engine: 'MV',
      mainJs: mvMain,
      cheatDir: path.join(gameDir, 'www', 'cheat'),
      settingsDir: path.join(gameDir, 'www', 'cheat-settings')
    };
  }

  throw new Error('Could not detect RPG Maker MV or MZ. Expected www/js/main.js or js/rmmz_objects.js.');
}

function stripLoader(content) {
  const start = content.indexOf(MARKER_START);
  const end = content.indexOf(MARKER_END);

  if (start === -1 || end === -1) {
    return content;
  }

  const blockEnd = end + MARKER_END.length;
  const nextNewline = content.slice(blockEnd).match(/^\r?\n/);

  return content.slice(0, start) + content.slice(blockEnd + (nextNewline?.[0].length ?? 0));
}

async function maybePause() {
  const isInteractive = process.stdout.isTTY && !process.argv.slice(2).some(arg => arg.startsWith('-'));
  if (isInteractive) {
    const rl = readline.createInterface({ input, output });
    await rl.question('\nPress Enter to exit...', rl.close.bind(rl));
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log('Usage: node scripts/uninstall.mjs --game "C:\\path\\to\\Game" [--purge]');
    return;
  }

  console.log('\nRPG Maker Cheat Toolkit Uninstaller');
  console.log('===================================\n');

  console.log('[INFO] Detecting game engine...');
  const gameDir = path.resolve(args.game || (await promptForGameDir()).trim());
  const game = detectGame(gameDir);
  const backupPath = `${game.mainJs}.rmc-backup`;

  console.log(`[OK] Detected RPG Maker ${game.engine}`);
  console.log(`     Game entry file: ${game.mainJs}`);

  console.log('\n[INFO] Restoring main.js entry file...');
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, game.mainJs);
    console.log(`[OK] Restored ${game.mainJs} from backup.`);
  } else {
    const current = fs.readFileSync(game.mainJs, 'utf8');
    fs.writeFileSync(game.mainJs, stripLoader(current), 'utf8');
    console.log('[INFO] Backup file missing; stripped injected loader script instead.');
  }

  console.log('\n[INFO] Cleaning up bundle directories...');
  if (fs.existsSync(game.cheatDir)) {
    fs.rmSync(game.cheatDir, { recursive: true, force: true });
    console.log(`[OK] Removed cheat folder: ${game.cheatDir}`);
  } else {
    console.log('[OK] Cheat folder already removed or not found.');
  }

  if (args.purge) {
    if (fs.existsSync(game.settingsDir)) {
      fs.rmSync(game.settingsDir, { recursive: true, force: true });
      console.log(`[OK] Purged settings folder: ${game.settingsDir}`);
    } else {
      console.log('[OK] Settings folder already purged or not found.');
    }
  } else if (fs.existsSync(game.settingsDir)) {
    console.log('[INFO] Note: Saved configurations left intact. Run with --purge to remove them.');
  }

  console.log('\n[SUCCESS] Uninstallation successful!');
}

async function main() {
  try {
    await run();
  } catch (error) {
    console.error(`\n[ERROR] Uninstallation failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await maybePause();
  }
}

main();
