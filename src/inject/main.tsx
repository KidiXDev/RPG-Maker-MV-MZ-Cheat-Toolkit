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
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  const rootContainer = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'cheat/cheat.css';
  rootContainer.appendChild(stylesheet);

  const rootElement = document.createElement('div');
  const portalRoot = document.createElement('div');
  portalRoot.id = PORTAL_ID;
  rootElement.style.pointerEvents = 'auto';
  portalRoot.style.pointerEvents = 'auto';
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
