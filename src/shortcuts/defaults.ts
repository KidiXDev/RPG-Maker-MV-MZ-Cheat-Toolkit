export type ShortcutAction =
  | 'toggleOverlay'
  | 'locations'
  | 'quickSave'
  | 'quickLoad'
  | 'gotoTitle'
  | 'forceVictory'
  | 'forceDefeat'
  | 'forceEscape'
  | 'toggleNoClip'
  | 'woundParty'
  | 'recoverParty'
  | 'setSpeed'
  | 'skipMessage'
  | 'devTools';

export type ShortcutDefinition = {
  id: ShortcutAction;
  label: string;
  description: string;
  combo: string;
  required: boolean;
  params?: {
    saveSlot?: number;
    moveSpeed?: number;
    skipSpeed?: number;
  };
};

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  { id: 'toggleOverlay', label: 'Toggle overlay', description: 'Open or close the cheat menu.', combo: 'Control+C', required: true },
  { id: 'locations', label: 'Locations', description: 'Jump to saved locations panel.', combo: 'Control+M', required: true },
  { id: 'quickSave', label: 'Quick save', description: 'Save to slot 1.', combo: 'Control+S', required: false, params: { saveSlot: 1 } },
  { id: 'quickLoad', label: 'Quick load', description: 'Load slot 1.', combo: 'Control+L', required: false, params: { saveSlot: 1 } },
  { id: 'gotoTitle', label: 'Title scene', description: 'Return to title.', combo: 'Control+T', required: false },
  { id: 'forceVictory', label: 'Force victory', description: 'Resolve the current battle as victory.', combo: 'Control+V', required: false },
  { id: 'forceDefeat', label: 'Force defeat', description: 'Resolve the current battle as defeat.', combo: 'Control+D', required: false },
  { id: 'forceEscape', label: 'Force escape', description: 'Escape from battle.', combo: 'Control+E', required: false },
  { id: 'toggleNoClip', label: 'No clip', description: 'Toggle pass-through movement.', combo: 'Control+N', required: false },
  { id: 'woundParty', label: 'Wound party', description: 'Drop party HP to 1 and clear MP/TP.', combo: 'Control+W', required: false },
  { id: 'recoverParty', label: 'Recover party', description: 'Restore HP, MP, and TP.', combo: 'Control+R', required: false },
  { id: 'setSpeed', label: 'Set speed', description: 'Apply configured move speed.', combo: 'Control+Shift+S', required: false, params: { moveSpeed: 4 } },
  { id: 'skipMessage', label: 'Skip message', description: 'Hold to accelerate messages.', combo: 'Shift', required: false, params: { skipSpeed: 6 } },
  { id: 'devTools', label: 'Dev tools', description: 'Open NW.js developer tools.', combo: 'F12', required: false }
];
