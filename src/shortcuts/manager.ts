import { useEffect } from 'react';
import {
  forceBattleResult,
  recoverParty,
  woundParty
} from '../game/cheats/battle.ts';
import { setMoveSpeed, setNoClip } from '../game/cheats/general.ts';
import { startMessageSkip, stopMessageSkip } from '../game/cheats/message.ts';
import {
  gotoTitle,
  openDevTools,
  quickLoad,
  quickSave
} from '../game/cheats/scene.ts';
import { isOverlayEvent } from '../game/engine.ts';
import { diagnosticKeyLog } from '../inject/diagnostics.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { useShortcutStore } from '../store/useShortcutStore.ts';
import { eventToCombo } from './keycodes.ts';

export function useShortcutManager() {
  const shortcuts = useShortcutStore((state) => state.shortcuts);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const combo = eventToCombo(event);
      const shortcut = shortcuts.find((candidate) => candidate.combo === combo);

      if (shortcut) {
        diagnosticKeyLog(event, 'keydown', true);
        if (shortcut.id !== 'skipMessage') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }

        const cheatState = useCheatStore.getState();

        if (shortcut.id === 'toggleOverlay') {
          cheatState.toggleOpen();
        } else if (shortcut.id === 'locations') {
          cheatState.setOpen(true);
          cheatState.setActivePanel('location');
        } else if (shortcut.id === 'quickSave') {
          const slot = shortcut.params?.saveSlot ?? 1;
          void Promise.resolve(quickSave(slot))
            .then((saved) => {
              cheatState.pushToast(
                saved ? `Saved slot ${slot}` : `Save slot ${slot} failed`,
                saved ? 'info' : 'danger'
              );
            })
            .catch(() =>
              cheatState.pushToast(`Save slot ${slot} failed`, 'danger')
            );
        } else if (shortcut.id === 'quickLoad') {
          const slot = shortcut.params?.saveSlot ?? 1;
          void Promise.resolve(quickLoad(slot))
            .then((loaded) => {
              cheatState.pushToast(
                loaded ? `Loaded slot ${slot}` : `Load slot ${slot} failed`,
                loaded ? 'info' : 'danger'
              );
            })
            .catch(() =>
              cheatState.pushToast(`Load slot ${slot} failed`, 'danger')
            );
        } else if (shortcut.id === 'gotoTitle') {
          gotoTitle();
        } else if (shortcut.id === 'forceVictory') {
          forceBattleResult('victory');
        } else if (shortcut.id === 'forceDefeat') {
          forceBattleResult('defeat');
        } else if (shortcut.id === 'forceEscape') {
          forceBattleResult('escape');
        } else if (shortcut.id === 'toggleNoClip') {
          setNoClip(!cheatState.noClip);
          cheatState.setNoClip(!cheatState.noClip);
        } else if (shortcut.id === 'woundParty') {
          woundParty();
        } else if (shortcut.id === 'recoverParty') {
          recoverParty();
        } else if (shortcut.id === 'setSpeed') {
          const speed = shortcut.params?.moveSpeed ?? cheatState.moveSpeed;
          setMoveSpeed(speed, true);
          cheatState.setMoveSpeed(speed);
          cheatState.pushToast(`Move speed set to ${speed}`);
        } else if (shortcut.id === 'skipMessage') {
          startMessageSkip(shortcut.params?.skipSpeed ?? 6);
        } else if (shortcut.id === 'devTools') {
          if (!openDevTools()) {
            cheatState.pushToast('NW.js devtools are unavailable', 'danger');
          }
        }
        return;
      }

      // If the overlay is open, block all other keys from propagating to the game,
      // EXCEPT when the event is targeting the overlay itself (which will bubble and be handled by the overlay).
      const isOpen = useCheatStore.getState().isOpen;
      if (isOpen && !isOverlayEvent(event)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      const combo = eventToCombo(event);
      const skipShortcut = shortcuts.find(
        (shortcut) => shortcut.id === 'skipMessage'
      );

      if (skipShortcut?.combo === combo || event.key === 'Shift') {
        diagnosticKeyLog(event, 'keyup', true);
        stopMessageSkip();
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }

      const isOpen = useCheatStore.getState().isOpen;
      if (isOpen && !isOverlayEvent(event)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [shortcuts]);
}
