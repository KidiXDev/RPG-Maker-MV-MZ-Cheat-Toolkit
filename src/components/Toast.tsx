import { createPortal } from 'react-dom';
import { useCheatStore } from '../store/useCheatStore.ts';

type ToastViewportProps = {
  portalRoot?: HTMLElement;
};

export function ToastViewport({ portalRoot }: ToastViewportProps) {
  const toasts = useCheatStore((state) => state.toasts);
  const dismissToast = useCheatStore((state) => state.dismissToast);
  const content = (
    <div className="pointer-events-auto fixed top-5 right-5 z-[10000] grid w-80 gap-2">
      {toasts.map((toast) => (
        <button
          className={`animate-[rmc-slide-in_200ms_ease-out] rounded-lg border px-4 py-3 text-left text-sm shadow-rmc-panel backdrop-blur ${
            toast.tone === 'danger'
              ? 'border-rmc-danger/60 bg-rmc-danger/20 text-white'
              : 'border-rmc-aether/40 bg-rmc-ink/90 text-rmc-mist'
          }`}
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
}
