import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';
import { waitForGameReady } from './bootstrap.ts';
import '../index.css';

const HOST_ID = 'rmc-cheat-host';
const PORTAL_ID = 'rmc-cheat-portals';

function mount() {
  const existing = document.getElementById(HOST_ID);

  if (existing) {
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.inset = '0';
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
}

void waitForGameReady().then(mount);
