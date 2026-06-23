import { useEffect } from 'react';
import { CheatModal } from './components/CheatModal.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { ToastViewport } from './components/Toast.tsx';
import { useShortcutManager } from './shortcuts/manager.ts';
import { useCheatStore } from './store/useCheatStore.ts';

type AppProps = {
  portalRoot?: HTMLElement;
};

function App({ portalRoot }: AppProps) {
  const isOpen = useCheatStore((state) => state.isOpen);
  const toggleOpen = useCheatStore((state) => state.toggleOpen);

  useShortcutManager();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="fixed right-5 bottom-5 z-[9998] rounded-full border border-rmc-copper/60 bg-rmc-ink/90 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-rmc-ember shadow-rmc-panel backdrop-blur transition hover:border-rmc-ember focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rmc-ember"
        type="button"
        onClick={toggleOpen}
      >
        RMC
      </button>
      {isOpen ? <CheatModal portalRoot={portalRoot} /> : null}
      <ConfirmDialog portalRoot={portalRoot} />
      <ToastViewport portalRoot={portalRoot} />
    </>
  );
}

export default App;
