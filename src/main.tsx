import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DevHarness } from './dev/DevHarness.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevHarness>
      <App />
    </DevHarness>
  </StrictMode>
);
