import assert from 'node:assert/strict';
import test from 'node:test';

import { injectLoader } from './install.mjs';

const marker = '/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */';

test('injects before executable code and relocates an existing MZ loader', () => {
  const mzMain = `// main.js\n\nconst scriptUrls = [\n${marker}\nold loader\n/* === RMC-CHEAT-TOOLKIT:END === */\n    "js/rmmz_core.js"\n];\n`;
  const injected = injectLoader(mzMain);

  assert.ok(injected.indexOf(marker) < injected.indexOf('const scriptUrls'));
  assert.equal(injected.split(marker).length - 1, 1);
});

test('injects before RPG Maker MV startup code', () => {
  const injected = injectLoader('// main.js\nPluginManager.setup($plugins);\n');

  assert.ok(injected.indexOf(marker) < injected.indexOf('PluginManager.setup'));
});
