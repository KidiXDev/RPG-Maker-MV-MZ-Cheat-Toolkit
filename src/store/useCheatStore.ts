import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import type { GameSpeedScope } from '../game/cheats/gameSpeed.ts';
import { createCheatStorage } from '../game/storage.ts';
import { generateId } from '../utils/id.ts';

export type PanelId =
  | 'general'
  | 'battle'
  | 'stats'
  | 'inventory'
  | 'variables'
  | 'switches'
  | 'location'
  | 'teleport'
  | 'shortcuts'
  | 'trainer'
  | 'events'
  | 'settings';

const panelSchema = z.enum([
  'general',
  'battle',
  'stats',
  'inventory',
  'variables',
  'switches',
  'location',
  'teleport',
  'shortcuts',
  'trainer',
  'events',
  'settings'
]);

const persistedSchema = z.object({
  activePanel: panelSchema.catch('general'),
  gameSpeed: z.number().min(0.1).max(10).catch(1),
  gameSpeedScope: z.enum(['all', 'battle']).catch('all'),
  moveSpeed: z.number().min(1).max(10).catch(4),
  noClip: z.boolean().catch(false),
  hideBadge: z.boolean().catch(false),
  expMultiplier: z.number().min(0).max(100).catch(1),
  damageMultiplier: z.number().min(0).max(999).catch(1)
});

type CheatState = z.infer<typeof persistedSchema> & {
  confirmDialog: {
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'info' | 'danger';
    onConfirm(): void;
  } | null;
  isOpen: boolean;
  isIntroVisible: boolean;
  toasts: Array<{ id: string; message: string; tone: 'info' | 'danger' }>;
  closeConfirm(): void;
  setOpen(open: boolean): void;
  toggleOpen(): void;
  showIntro(): void;
  hideIntro(): void;
  setActivePanel(panel: PanelId): void;
  setGameSpeed(speed: number): void;
  setGameSpeedScope(scope: GameSpeedScope): void;
  setMoveSpeed(speed: number): void;
  setNoClip(enabled: boolean): void;
  setHideBadge(hide: boolean): void;
  setExpMultiplier(multiplier: number): void;
  setDamageMultiplier(multiplier: number): void;
  requestConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'info' | 'danger';
    onConfirm(): void;
  }): void;
  pushToast(message: string, tone?: 'info' | 'danger'): void;
  dismissToast(id: string): void;
};

export const useCheatStore = create<CheatState>()(
  persist(
    (set) => ({
      activePanel: 'general',
      confirmDialog: null,
      gameSpeed: 1,
      gameSpeedScope: 'all',
      hideBadge: false,
      expMultiplier: 1,
      damageMultiplier: 1,
      isOpen: false,
      isIntroVisible: true,
      moveSpeed: 4,
      noClip: false,
      toasts: [],
      closeConfirm: () => set({ confirmDialog: null }),
      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      showIntro: () => set({ isIntroVisible: true }),
      hideIntro: () => set({ isIntroVisible: false }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setGameSpeed: (speed) => set({ gameSpeed: speed }),
      setGameSpeedScope: (scope) => set({ gameSpeedScope: scope }),
      setMoveSpeed: (speed) => set({ moveSpeed: speed }),
      setNoClip: (enabled) => set({ noClip: enabled }),
      setHideBadge: (hide) => set({ hideBadge: hide }),
      setExpMultiplier: (multiplier) => set({ expMultiplier: multiplier }),
      setDamageMultiplier: (multiplier) => set({ damageMultiplier: multiplier }),
      requestConfirm: ({ title, message, confirmLabel = 'Confirm', tone = 'info', onConfirm }) =>
        set({
          confirmDialog: {
            title,
            message,
            confirmLabel,
            tone,
            onConfirm
          }
        }),
      pushToast: (message, tone = 'info') =>
        set((state) => ({
          toasts: [...state.toasts.slice(-3), { id: generateId(), message, tone }]
        })),
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id)
        }))
    }),
    {
      name: 'rmc-cheat-ui',
      partialize: (state) => persistedSchema.parse(state),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedSchema.partial().catch({}).parse(persistedState)
      }),
      storage: createJSONStorage(createCheatStorage)
    }
  )
);
