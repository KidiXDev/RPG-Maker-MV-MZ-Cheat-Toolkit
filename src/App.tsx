import { useEffect, useState } from 'react';
import { CheatModal } from './components/CheatModal.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { EspOverlay } from './components/EspOverlay.tsx';
import { IntroOverlay } from './components/IntroOverlay.tsx';
import { OverlayHud } from './components/OverlayHud.tsx';
import { ToastViewport } from './components/Toast.tsx';
import { showStartupWarnings } from './inject/startupWarnings.ts';
import { useShortcutManager } from './shortcuts/manager.ts';
import { useCheatStore } from './store/useCheatStore.ts';

type AppProps = {
  portalRoot?: HTMLElement;
};

function App({ portalRoot }: AppProps) {
  const isOpen = useCheatStore((state) => state.isOpen);
  const isIntroVisible = useCheatStore((state) => state.isIntroVisible);
  const gameReady = useCheatStore((state) => state.gameReady);
  const hideBadge = useCheatStore((state) => state.hideBadge);
  const badgeOpacity = useCheatStore((state) => state.badgeOpacity);
  const toggleOpen = useCheatStore((state) => state.toggleOpen);
  const [badgeHovered, setBadgeHovered] = useState(false);

  useShortcutManager();

  // Show runtime warnings once the intro has dismissed AND the game engine is
  // ready (so isNwjs()/isSdkBuild() report correctly, not before the engine
  // has loaded). Fires once per session via the guard inside the helper.
  useEffect(() => {
    if (isIntroVisible || !gameReady) return;
    showStartupWarnings();
  }, [isIntroVisible, gameReady]);

  useEffect(() => {
    const host = document.getElementById('rmc-cheat-host');
    if (host) {
      const val = isOpen || isIntroVisible ? 'auto' : 'none';
      host.style.setProperty('pointer-events', val, 'important');
    }

    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isIntroVisible]);

  return (
    <div className="pointer-events-none">
      {!hideBadge ? (
        <button
          className="pointer-events-auto fixed right-5 bottom-5 z-9998 rounded-full border border-rmc-copper/60 bg-rmc-ink/90 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-rmc-ember shadow-rmc-panel backdrop-blur transition-all duration-200 hover:border-rmc-ember focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-rmc-ember"
          style={{ opacity: badgeHovered ? 1 : badgeOpacity }}
          type="button"
          onMouseEnter={() => setBadgeHovered(true)}
          onMouseLeave={() => setBadgeHovered(false)}
          onClick={toggleOpen}
        >
          RMC
        </button>
      ) : null}
      {isOpen ? <CheatModal portalRoot={portalRoot} /> : null}
      {isIntroVisible ? <IntroOverlay /> : null}
      <EspOverlay />
      <ConfirmDialog portalRoot={portalRoot} />
      <OverlayHud portalRoot={portalRoot} />
      <ToastViewport portalRoot={portalRoot} />
    </div>
  );
}

export default App;
