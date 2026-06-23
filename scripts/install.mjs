#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const MARKER_START = '/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */';
const MARKER_END = '/* === RMC-CHEAT-TOOLKIT:END === */';
const LOADER_BLOCK = `${MARKER_START}
(function(){var s=document.createElement('script');s.src='cheat/cheat.js';
s.async=false;document.body.appendChild(s);})();
${MARKER_END}`;

function parseArgs(argv) {
  const args = { game: '', help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
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

function injectLoader(content) {
  if (content.includes(MARKER_START)) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const insertAfter = Math.max(
    0,
    lines.findIndex((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    })
  );

  lines.splice(insertAfter + 1, 0, LOADER_BLOCK);
  return lines.join(newline);
}

function printDiff(before, after, filePath) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  const max = Math.max(beforeLines.length, afterLines.length);

  console.log(`--- ${filePath}.rmc-backup`);
  console.log(`+++ ${filePath}`);

  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] === afterLines[index]) {
      continue;
    }

    if (beforeLines[index] !== undefined) {
      console.log(`-${beforeLines[index]}`);
    }

    if (afterLines[index] !== undefined) {
      console.log(`+${afterLines[index]}`);
    }
  }
}

function copyBundle(cheatDir) {
  const distDir = path.resolve('dist');
  const requiredFiles = ['cheat.js', 'cheat.css'];

  for (const file of requiredFiles) {
    const source = path.join(distDir, file);

    if (!fs.existsSync(source)) {
      throw new Error(`Missing ${source}. Run bun run build:inject first.`);
    }
  }

  fs.mkdirSync(cheatDir, { recursive: true });

  for (const file of requiredFiles) {
    fs.copyFileSync(path.join(distDir, file), path.join(cheatDir, file));
  }

  const assetsDir = path.join(distDir, 'assets');

  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(cheatDir, 'assets'), { recursive: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log('Usage: node scripts/install.mjs --game "C:\\path\\to\\Game"');
    return;
  }

  const gameDir = path.resolve(args.game || (await promptForGameDir()).trim());
  const game = detectGame(gameDir);
  const backupPath = `${game.mainJs}.rmc-backup`;

  console.log(`Detected RPG Maker ${game.engine}`);
  console.log(`main.js: ${game.mainJs}`);

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(game.mainJs, backupPath);
    console.log(`Created backup: ${backupPath}`);
  } else {
    console.log(`Using existing backup: ${backupPath}`);
  }

  const backup = fs.readFileSync(backupPath, 'utf8');
  const current = fs.readFileSync(game.mainJs, 'utf8');
  const injected = injectLoader(current);

  if (injected !== current) {
    fs.writeFileSync(game.mainJs, injected, 'utf8');
  } else {
    console.log('Loader already present; injection skipped.');
  }

  const modified = fs.readFileSync(game.mainJs, 'utf8');

  if (modified !== injectLoader(backup)) {
    fs.copyFileSync(backupPath, game.mainJs);
    throw new Error('main.js changed outside the loader block. Restored backup and aborted.');
  }

  printDiff(backup, modified, game.mainJs);
  copyBundle(game.cheatDir);

  console.log(`Copied bundle to ${game.cheatDir}`);
  console.log('Install complete. Press Ctrl+C in game to open the overlay.');
}

main().catch((error) => {
  console.error(`Install failed: ${error.message}`);
  process.exitCode = 1;
});
