import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';
import { waitForGameReady } from './bootstrap.ts';
import { getDiagnostics } from './diagnostics.ts';
import cssText from '../index.css?inline';

const HOST_ID = 'rmc-cheat-host';
const PORTAL_ID = 'rmc-cheat-portals';

function replaceLogicalAndGapProperties(css: string): string {
  return css
    .replace(/padding-inline:([^;}]+)/g, 'padding-left:$1;padding-right:$1')
    .replace(/padding-block:([^;}]+)/g, 'padding-top:$1;padding-bottom:$1')
    .replace(/margin-inline:([^;}]+)/g, 'margin-left:$1;margin-right:$1')
    .replace(/margin-block:([^;}]+)/g, 'margin-top:$1;margin-bottom:$1')
    .replace(/border-inline-width:([^;}]+)/g, 'border-left-width:$1;border-right-width:$1')
    .replace(/border-block-width:([^;}]+)/g, 'border-top-width:$1;border-bottom-width:$1')
    .replace(/(?<!grid-)(row-gap|column-gap|gap):([^;}]+)/g, 'grid-$1:$2;$1:$2')
    .replace(/grid-grid-/g, 'grid-');
}

/** Remove @layer wrappers (Chrome < 99 doesn't support @layer, and RPG Maker MV
 *  uses NW.js 0.29 / Chromium 65). Keeps the inner content, removes the @layer
 *  enclosing braces and standalone @layer declarations. */
function stripAtLayer(css: string): string {
  const out: string[] = [];
  let i = 0;

  while (i < css.length) {
    const layerMatch = css.slice(i).match(/^@layer\s+([\w-]+(?:\s*,\s*[\w-]+)*)\s*/);

    if (layerMatch) {
      const remaining = css.slice(i + layerMatch[0].length);

      if (remaining.startsWith('{')) {
        let depth = 1;
        let j = 1;

        while (j < remaining.length && depth > 0) {
          if (remaining[j] === '{') depth++;
          if (remaining[j] === '}') depth--;
          if (depth > 0) j++;
        }

        out.push(remaining.slice(1, j));
        i += layerMatch[0].length + j + 1;
      } else {
        i += layerMatch[0].length + 1;
      }

      continue;
    }

    out.push(css[i]);
    i++;
  }

  return out.join('');
}

function mount() {
  const diagnostics = getDiagnostics();
  const existing = document.getElementById(HOST_ID);

  if (existing) {
    diagnostics.log('mount skipped: host already exists');
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.right = '0';
  host.style.bottom = '0';
  host.style.left = '0';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  // Block all overlay events from bubbling out of the host to the main document (game)
  const eventsToBlock = [
    'keydown', 'keyup', 'keypress',
    'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu',
    'touchstart', 'touchend', 'touchmove', 'touchcancel',
    'pointerdown', 'pointerup', 'pointermove', 'pointercancel',
    'wheel', 'scroll'
  ];
  for (const eventName of eventsToBlock) {
    host.addEventListener(eventName, (e) => {
      e.stopPropagation();
    }, { capture: false });
  }

  const rootContainer = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  /* preprocess and inject CSS inside shadow root for proper styling and scoping */
  const style = document.createElement('style');
  style.textContent = replaceLogicalAndGapProperties(stripAtLayer(cssText));
  rootContainer.appendChild(style);

  const rootElement = document.createElement('div');
  const portalRoot = document.createElement('div');
  portalRoot.id = PORTAL_ID;
  rootContainer.appendChild(rootElement);
  rootContainer.appendChild(portalRoot);

  createRoot(rootElement).render(
    <StrictMode>
      <App portalRoot={portalRoot} />
    </StrictMode>
  );
  diagnostics.log('react root rendered');
  diagnostics.inspectHost('after render');
  window.setTimeout(() => diagnostics.inspectHost('after 1s'), 1000);
}

const diagnostics = getDiagnostics();
diagnostics.installGlobalHandlers();
diagnostics.log('cheat bundle executing');

void waitForGameReady()
  .then(() => {
    diagnostics.log('game ready wait completed');
    mount();
  })
  .catch((error: unknown) => {
    diagnostics.log('bootstrap failed', error instanceof Error ? error.stack : String(error));
  });
