import { type ReactNode, useState } from 'react';
import { setupMockGame } from './mockGame.ts';

type DevHarnessProps = {
  children: ReactNode;
};

export function DevHarness({ children }: DevHarnessProps) {
  const [ready] = useState(() => {
    if (!import.meta.env.DEV) {
      return true;
    }

    setupMockGame();
    return true;
  });

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-rmc-abyss text-rmc-mist">
        Loading RPG Maker mock...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(117,214,255,0.16),transparent_26rem),linear-gradient(135deg,#070a0f,#131c29_52%,#1f1410)] p-6 text-rmc-mist">
      <div className="mx-auto max-w-5xl rounded-4xl border border-white/10 bg-black/20 p-8 shadow-rmc-panel backdrop-blur">
        <p className="font-rmc-mono text-xs tracking-[0.35em] text-rmc-aether uppercase">
          Mock NW.js runtime
        </p>
        <h1 className="mt-3 max-w-3xl font-rmc-display text-4xl font-bold tracking-tight text-rmc-mist md:text-6xl">
          RPG Maker MV/MZ Cheat Toolkit
        </h1>
        <p className="mt-4 max-w-2xl text-rmc-slate">
          Development harness with mocked party, switches, variables, maps, and
          battle state. Press Ctrl+C or the RMC badge to open the overlay.
        </p>
      </div>
      {children}
    </div>
  );
}
