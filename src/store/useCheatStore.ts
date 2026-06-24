import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
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
  | 'minimap'
  | 'settings';

export type HudPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Full set of value fields the store holds. Cheat values (game speed, move
// speed, no-clip, multipliers) are transient and reset every session.
type CheatValues = {
  activePanel: PanelId;
  gameSpeedAll: number;
  gameSpeedBattle: number;
  moveSpeed: number;
  noClip: boolean;
  hideBadge: boolean;
  badgeOpacity: number;
  expMultiplier: number;
  damageMultiplier: number;
  hudEnabled: boolean;
  hudPosition: HudPosition;
  hudShowFps: boolean;
  hudShowMap: boolean;
  hudShowCoords: boolean;
  hudShowEvents: boolean;
  warnOldNwjs: boolean;
  warnNoDevTools: boolean;
  espEnabled: boolean;
};

// Only these settings persist across sessions. Cheat toggles/values do not.
const persistedSchema = z.object({
  hideBadge: z.boolean().catch(false),
  badgeOpacity: z.number().min(0.1).max(1).catch(1),
  hudEnabled: z.boolean().catch(false),
  hudPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).catch('top-left'),
  hudShowFps: z.boolean().catch(true),
  hudShowMap: z.boolean().catch(true),
  hudShowCoords: z.boolean().catch(true),
  hudShowEvents: z.boolean().catch(true),
  warnOldNwjs: z.boolean().catch(true),
  warnNoDevTools: z.boolean().catch(true),
});

type CheatState = CheatValues & {
  confirmDialog: {
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'info' | 'danger';
    onConfirm(): void;
  } | null;
  isOpen: boolean;
  isIntroVisible: boolean;
  gameReady: boolean;
  toasts: Array<{ id: string; message: string; tone: 'info' | 'danger' }>;
  closeConfirm(): void;
  setOpen(open: boolean): void;
  toggleOpen(): void;
  showIntro(): void;
  hideIntro(): void;
  setGameReady(ready: boolean): void;
  setActivePanel(panel: PanelId): void;
  setGameSpeedAll(speed: number): void;
  setGameSpeedBattle(speed: number): void;
  setMoveSpeed(speed: number): void;
  setNoClip(enabled: boolean): void;
  setHideBadge(hide: boolean): void;
  setBadgeOpacity(opacity: number): void;
  setExpMultiplier(multiplier: number): void;
  setDamageMultiplier(multiplier: number): void;
  setHudEnabled(enabled: boolean): void;
  setHudPosition(pos: HudPosition): void;
  setHudShowFps(show: boolean): void;
  setHudShowMap(show: boolean): void;
  setHudShowCoords(show: boolean): void;
  setHudShowEvents(show: boolean): void;
  setWarnOldNwjs(warn: boolean): void;
  setWarnNoDevTools(warn: boolean): void;
  setEspEnabled(enabled: boolean): void;
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
      gameSpeedAll: 1,
      gameSpeedBattle: 1,
      hideBadge: false,
      badgeOpacity: 1,
      expMultiplier: 1,
      damageMultiplier: 1,
      hudEnabled: false,
      hudPosition: 'top-left',
      hudShowFps: true,
      hudShowMap: true,
      hudShowCoords: true,
      hudShowEvents: true,
      warnOldNwjs: true,
      warnNoDevTools: true,
      espEnabled: false,
      isOpen: false,
      isIntroVisible: true,
      gameReady: false,
      moveSpeed: 4,
      noClip: false,
      toasts: [],
      closeConfirm: () => set({ confirmDialog: null }),
      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      showIntro: () => set({ isIntroVisible: true }),
      hideIntro: () => set({ isIntroVisible: false }),
      setGameReady: (ready) => set({ gameReady: ready }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setGameSpeedAll: (speed) => set({ gameSpeedAll: speed }),
      setGameSpeedBattle: (speed) => set({ gameSpeedBattle: speed }),
      setMoveSpeed: (speed) => set({ moveSpeed: speed }),
      setNoClip: (enabled) => set({ noClip: enabled }),
      setHideBadge: (hide) => set({ hideBadge: hide }),
      setBadgeOpacity: (opacity) => set({ badgeOpacity: opacity }),
      setExpMultiplier: (multiplier) => set({ expMultiplier: multiplier }),
      setDamageMultiplier: (multiplier) => set({ damageMultiplier: multiplier }),
      setHudEnabled: (enabled) => set({ hudEnabled: enabled }),
      setHudPosition: (pos) => set({ hudPosition: pos }),
      setHudShowFps: (show) => set({ hudShowFps: show }),
      setHudShowMap: (show) => set({ hudShowMap: show }),
      setHudShowCoords: (show) => set({ hudShowCoords: show }),
      setHudShowEvents: (show) => set({ hudShowEvents: show }),
      setWarnOldNwjs: (warn) => set({ warnOldNwjs: warn }),
      setWarnNoDevTools: (warn) => set({ warnNoDevTools: warn }),
      setEspEnabled: (enabled) => set({ espEnabled: enabled }),
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
