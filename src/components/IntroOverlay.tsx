import { useEffect, useState } from 'react';
import { startDelayedGame } from '../game/engine.ts';
import { useCheatStore } from '../store/useCheatStore.ts';

export function IntroOverlay() {
  const hideIntro = useCheatStore((state) => state.hideIntro);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let fadeOutTimeout: number;

    function handleDismiss() {
      if (isFadingOut) return;
      setIsFadingOut(true);
      startDelayedGame(); // Start game in background immediately during fadeout
      fadeOutTimeout = window.setTimeout(() => {
        hideIntro();
      }, 500); // 500ms transition duration
    }

    // Auto-dismiss after 2s (2000ms), cannot be skipped manually
    const dismissTimeout = window.setTimeout(() => {
      handleDismiss();
    }, 2000);

    return () => {
      window.clearTimeout(dismissTimeout);
      window.clearTimeout(fadeOutTimeout);
    };
  }, [hideIntro, isFadingOut]);

  return (
    <div
      className={`fixed inset-0 z-10002 flex items-center justify-center bg-rmc-abyss text-center transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        <h1
          className="font-rmc-display text-3xl font-bold tracking-[0.3em] text-rmc-ember uppercase"
          style={{
            textShadow:
              '0 0 12px rgba(255, 179, 92, 0.45), 0 0 24px rgba(255, 179, 92, 0.2)'
          }}
        >
          RMC Installed
        </h1>
        <div className="w-12 h-[2px] bg-rmc-ember mt-3 rounded-full opacity-60 animate-pulse" />
        <p className="mt-4 font-rmc-mono text-[0.6rem] tracking-[0.35em] text-rmc-slate uppercase">
          Press Ctrl+C to Open GUI
        </p>
      </div>
    </div>
  );
}
