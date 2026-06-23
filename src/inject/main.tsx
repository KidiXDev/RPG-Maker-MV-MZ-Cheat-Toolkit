import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';
import { waitForGameReady } from './bootstrap.ts';
import { getDiagnostics } from './diagnostics.ts';
import '../index.css';

const HOST_ID = 'rmc-cheat-host';
const PORTAL_ID = 'rmc-cheat-portals';

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
  document.body.appendChild(host);

  const rootContainer = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  function loadCss(url: string) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send();

      if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
        return xhr.responseText;
      }
    } catch {
      /* ignore */
    }

    return null;
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

  const cssUrl = 'cheat/cheat.css';

  /* inject <link> into document head — guaranteed to load CSS even in old NW.js */
  const docLink = document.createElement('link');
  docLink.rel = 'stylesheet';
  docLink.href = cssUrl;
  document.head.appendChild(docLink);

  /* inject CSS as <style> inside shadow root for proper scoping in modern browsers */
  const cssText = loadCss(cssUrl);

  if (cssText) {
    const style = document.createElement('style');
    style.textContent = stripAtLayer(cssText);
    rootContainer.appendChild(style);
  }

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
