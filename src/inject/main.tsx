import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';
import { waitForGameReady } from './bootstrap.ts';
import { getDiagnostics } from './diagnostics.ts';
import cssText from '../index.css?inline';
import { delaySceneManagerRun } from '../game/engine.ts';

const HOST_ID = 'rmc-cheat-host';
const PORTAL_ID = 'rmc-cheat-portals';

function replaceLogicalAndGapProperties(css: string): string {
  return css
    .replace(/:root/g, ':host') // Map :root variables to :host for Shadow DOM!
    // Replace Tailwind v4's modern features supports check with an always-true check
    .replace(/@supports\s*[^{]*color:rgb\(from[^{]*{/g, '@supports (display: block) {')
    .replace(/padding-inline:([^;}]+)/g, 'padding-left:$1;padding-right:$1')
    .replace(/padding-block:([^;}]+)/g, 'padding-top:$1;padding-bottom:$1')
    .replace(/margin-inline:([^;}]+)/g, 'margin-left:$1;margin-right:$1')
    .replace(/margin-block:([^;}]+)/g, 'margin-top:$1;margin-bottom:$1')
    .replace(/border-inline-width:([^;}]+)/g, 'border-left-width:$1;border-right-width:$1')
    .replace(/border-block-width:([^;}]+)/g, 'border-top-width:$1;border-bottom-width:$1')
    .replace(/(^|[^a-zA-Z0-9-])(row-gap|column-gap|gap):([^;}]+)/g, '$1grid-$2:$3; $2:$3')
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

  if (!document.body) {
    diagnostics.log('mount deferred: document.body not ready');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      window.setTimeout(mount, 50);
    }
    return;
  }

  const existing = document.getElementById(HOST_ID);

  if (existing) {
    diagnostics.log('mount skipped: host already exists');
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.setProperty('position', 'fixed', 'important');
  host.style.setProperty('top', '0', 'important');
  host.style.setProperty('right', '0', 'important');
  host.style.setProperty('bottom', '0', 'important');
  host.style.setProperty('left', '0', 'important');
  host.style.setProperty('z-index', '2147483647', 'important');
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
  style.textContent = ':host { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 2147483647 !important; display: block !important; pointer-events: none !important; }\n' + replaceLogicalAndGapProperties(stripAtLayer(cssText));
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

  window.setTimeout(() => {
    try {
      const host = document.getElementById(HOST_ID);
      const shadow = host?.shadowRoot;
      const button = shadow?.querySelector('button');

      const hostRect = host?.getBoundingClientRect();
      const btnRect = button?.getBoundingClientRect();

      const hostStyle = host ? window.getComputedStyle(host) : null;
      const btnStyle = button ? window.getComputedStyle(button) : null;

      const testDiv = document.createElement('div');
      testDiv.style.position = 'fixed';
      document.body.appendChild(testDiv);
      const zTests: Record<string, string> = {};
      for (const zVal of ['999', '9999', '99999', '999999', '2147483647']) {
        testDiv.style.zIndex = zVal;
        zTests[zVal] = window.getComputedStyle(testDiv).zIndex;
      }
      document.body.removeChild(testDiv);
      diagnostics.log('z-index capability test', zTests);

      diagnostics.log('layout diagnostic', {
        host: {
          exists: Boolean(host),
          width: hostRect?.width,
          height: hostRect?.height,
          display: hostStyle?.display,
          position: hostStyle?.position,
          zIndex: hostStyle?.zIndex,
          visibility: hostStyle?.visibility,
          opacity: hostStyle?.opacity
        },
        button: {
          exists: Boolean(button),
          width: btnRect?.width,
          height: btnRect?.height,
          display: btnStyle?.display,
          position: btnStyle?.position,
          right: btnStyle?.right,
          bottom: btnStyle?.bottom,
          visibility: btnStyle?.visibility,
          opacity: btnStyle?.opacity,
          color: btnStyle?.color,
          bg: btnStyle?.backgroundColor
        },
        shadowChildren: shadow ? Array.from(shadow.children).map(c => `${c.tagName}${c.id ? '#' + c.id : ''}`) : []
      });
    } catch (e) {
      diagnostics.log('layout diagnostic error', e instanceof Error ? e.message : String(e));
    }
  }, 3000);
}

// Intercept and delay SceneManager.run immediately
delaySceneManagerRun();

const diagnostics = getDiagnostics();
diagnostics.installGlobalHandlers();
diagnostics.log('cheat bundle executing');

// Mount React immediately on startup to show RMC Active boot intro
mount();

void waitForGameReady()
  .then(() => {
    diagnostics.log('game ready wait completed');
  })
  .catch((error: unknown) => {
    diagnostics.log('bootstrap failed', error instanceof Error ? error.stack : String(error));
  });
