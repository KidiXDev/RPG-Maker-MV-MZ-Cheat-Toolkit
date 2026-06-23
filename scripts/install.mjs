#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKER_START = '/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */';
const MARKER_END = '/* === RMC-CHEAT-TOOLKIT:END === */';

function buildLoaderBlock({ diagnostic = false } = {}) {
  const diagnosticLine = diagnostic ? "s.setAttribute('data-rmc-diagnostic','1');" : '';
  const scriptSrc = diagnostic ? 'cheat/rmc-diagnostic.js' : 'cheat/cheat.js';

  return `${MARKER_START}
(function(){var s=document.createElement('script');s.src='${scriptSrc}';
s.async=false;${diagnosticLine}document.head.appendChild(s);})();
${MARKER_END}`;
}

function parseArgs(argv) {
  const args = { game: '', help: false, diagnostic: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--diagnostic' || arg === '--debug') {
      args.diagnostic = true;
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

function injectLoader(content, options = {}) {
  const loaderBlock = buildLoaderBlock(options);
  const start = content.indexOf(MARKER_START);
  const end = content.indexOf(MARKER_END);

  if (start !== -1 && end !== -1) {
    const blockEnd = end + MARKER_END.length;
    return content.slice(0, start) + loaderBlock + content.slice(blockEnd);
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

  lines.splice(insertAfter + 1, 0, loaderBlock);
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

function copyBundle(cheatDir, options = {}) {
  const distDir = path.resolve(__dirname, '..', 'dist');
  const requiredFiles = ['cheat.js'];
  const optionalFiles = ['cheat.css'];

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

  for (const file of optionalFiles) {
    const source = path.join(distDir, file);
    const target = path.join(cheatDir, file);

    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
    } else if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }

  const diagnosticLoader = path.join(cheatDir, 'rmc-diagnostic.js');

  if (options.diagnostic) {
    fs.copyFileSync(path.resolve(__dirname, 'rmc-diagnostic.js'), diagnosticLoader);
  } else if (fs.existsSync(diagnosticLoader)) {
    fs.unlinkSync(diagnosticLoader);
  }

  const assetsDir = path.join(distDir, 'assets');

  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(cheatDir, 'assets'), { recursive: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log('Usage: node scripts/install.mjs --game "C:\\path\\to\\Game" [--diagnostic]');
    return;
  }

  const gameDir = path.resolve(args.game || (await promptForGameDir()).trim());
  const game = detectGame(gameDir);
  const backupPath = `${game.mainJs}.rmc-backup`;

  console.log(`Detected RPG Maker ${game.engine}`);
  console.log(`main.js: ${game.mainJs}`);
  console.log(`diagnostic logging: ${args.diagnostic ? 'enabled' : 'disabled'}`);

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(game.mainJs, backupPath);
    console.log(`Created backup: ${backupPath}`);
  } else {
    console.log(`Using existing backup: ${backupPath}`);
  }

  const backup = fs.readFileSync(backupPath, 'utf8');
  const current = fs.readFileSync(game.mainJs, 'utf8');
  const injected = injectLoader(current, { diagnostic: args.diagnostic });

  if (injected !== current) {
    fs.writeFileSync(game.mainJs, injected, 'utf8');
  } else {
    console.log('Loader already up to date; injection skipped.');
  }

  const modified = fs.readFileSync(game.mainJs, 'utf8');

  if (modified !== injectLoader(backup, { diagnostic: args.diagnostic })) {
    fs.copyFileSync(backupPath, game.mainJs);
    throw new Error('main.js changed outside the loader block. Restored backup and aborted.');
  }

  printDiff(backup, modified, game.mainJs);
  copyBundle(game.cheatDir, { diagnostic: args.diagnostic });

  console.log(`Copied bundle to ${game.cheatDir}`);
  if (args.diagnostic) {
    console.log(`Diagnostic log: ${path.join(game.cheatDir, 'rmc-diagnostic.log')}`);
  }
  console.log('Install complete. Press Ctrl+C in game to open the overlay.');
}

main().catch((error) => {
  console.error(`Install failed: ${error.message}`);
  process.exitCode = 1;
});
