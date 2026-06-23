import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { DEFAULT_SHORTCUTS, type ShortcutDefinition } from '../shortcuts/defaults.ts';
import { createCheatStorage } from '../game/storage.ts';

const shortcutActionSchema = z.enum([
  'toggleOverlay',
  'locations',
  'quickSave',
  'quickLoad',
  'gotoTitle',
  'forceVictory',
  'forceDefeat',
  'forceEscape',
  'toggleNoClip',
  'woundParty',
  'recoverParty',
  'setSpeed',
  'skipMessage',
  'devTools'
]);

const shortcutSchema = z.object({
  id: shortcutActionSchema,
  label: z.string(),
  description: z.string(),
  combo: z.string(),
  required: z.boolean(),
  params: z
    .object({
      saveSlot: z.number().optional(),
      moveSpeed: z.number().optional(),
      skipSpeed: z.number().optional()
    })
    .optional()
});

type ShortcutState = {
  shortcuts: ShortcutDefinition[];
  setShortcut(id: string, combo: string): void;
  setShortcutParam(id: string, key: 'saveSlot' | 'moveSpeed' | 'skipSpeed', value: number): void;
  restoreDefaults(): void;
};

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set) => ({
      shortcuts: DEFAULT_SHORTCUTS,
      setShortcut: (id, combo) =>
        set((state) => ({
          shortcuts: state.shortcuts.map((shortcut) =>
            shortcut.id === id ? { ...shortcut, combo } : shortcut
          )
        })),
      setShortcutParam: (id, key, value) =>
        set((state) => ({
          shortcuts: state.shortcuts.map((shortcut) =>
            shortcut.id === id
              ? { ...shortcut, params: { ...shortcut.params, [key]: value } }
              : shortcut
          )
        })),
      restoreDefaults: () => set({ shortcuts: DEFAULT_SHORTCUTS })
    }),
    {
      name: 'rmc-cheat-shortcuts',
      partialize: (state) => ({
        shortcuts: z.array(shortcutSchema).catch(DEFAULT_SHORTCUTS).parse(state.shortcuts)
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        shortcuts: mergeShortcuts(
          z
            .object({ shortcuts: z.array(shortcutSchema).catch([]) })
            .catch({ shortcuts: [] })
            .parse(persistedState).shortcuts
        )
      }),
      storage: createJSONStorage(createCheatStorage)
    }
  )
);

function mergeShortcuts(savedShortcuts: ShortcutDefinition[]) {
  const savedById = new Map(savedShortcuts.map((shortcut) => [shortcut.id, shortcut]));

  return DEFAULT_SHORTCUTS.map((defaultShortcut) => {
    const savedShortcut = savedById.get(defaultShortcut.id);

    if (!savedShortcut) {
      return defaultShortcut;
    }

    return {
      ...defaultShortcut,
      combo: savedShortcut.combo || defaultShortcut.combo,
      params: { ...defaultShortcut.params, ...savedShortcut.params }
    };
  });
}
