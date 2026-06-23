import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCheatStore } from '../store/useCheatStore.ts';

type ConfirmDialogProps = {
  portalRoot?: HTMLElement;
};

export function ConfirmDialog({ portalRoot }: ConfirmDialogProps) {
  const confirmDialog = useCheatStore((state) => state.confirmDialog);
  const closeConfirm = useCheatStore((state) => state.closeConfirm);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    backdropRef.current?.focus();
  }, []);

  if (!confirmDialog) {
    return null;
  }

  function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  const content = (
    <div
      ref={backdropRef}
      tabIndex={-1}
      className="pointer-events-auto fixed inset-0 z-10001 grid place-items-center bg-rmc-abyss/75 p-4 text-rmc-mist backdrop-blur-sm"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <section className="w-[min(28rem,92vw)] animate-[rmc-fade-in_200ms_ease-out] rounded-2xl border border-white/10 bg-rmc-panel p-5 shadow-rmc-panel">
        <p className="font-rmc-mono text-xs tracking-[0.28em] text-rmc-aether uppercase">
          Confirm action
        </p>
        <h3 className="mt-2 font-rmc-display text-2xl font-black">
          {confirmDialog.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-rmc-slate">
          {confirmDialog.message}
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-rmc-slate hover:border-rmc-aether hover:text-rmc-mist cursor-pointer"
            type="button"
            onClick={closeConfirm}
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer ${
              confirmDialog.tone === 'danger'
                ? 'bg-rmc-danger text-white'
                : 'bg-rmc-ember text-rmc-abyss'
            }`}
            type="button"
            onClick={() => {
              const action = confirmDialog.onConfirm;
              closeConfirm();
              action();
            }}
          >
            {confirmDialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
}
