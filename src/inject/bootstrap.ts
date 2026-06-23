import { isGameReady, patchTouchInputPassThrough } from '../game/engine.ts';
import { getMoveSpeed, setMoveSpeed, setNoClip } from '../game/cheats/general.ts';
import { setGameSpeedAll, setGameSpeedBattle } from '../game/cheats/gameSpeed.ts';
import { patchMessageSkip } from '../game/cheats/message.ts';
import { setExpMultiplier, setDamageMultiplier } from '../game/cheats/multipliers.ts';
import { useCheatStore } from '../store/useCheatStore.ts';

const READY_TIMEOUT_MS = 30_000;
const READY_INTERVAL_MS = 250;

export async function waitForGameReady() {
  const startedAt = Date.now();

  while (!isGameReady()) {
    if (Date.now() - startedAt > READY_TIMEOUT_MS) {
      break;
    }

    await new Promise((resolve) => window.setTimeout(resolve, READY_INTERVAL_MS));
  }

  patchTouchInputPassThrough();
  patchMessageSkip();
  applyPersistedRuntimeSettings();
}

function applyPersistedRuntimeSettings() {
  const state = useCheatStore.getState();

  setNoClip(state.noClip);

  // Sync move speed: if the user previously set a non-default speed, reapply it
  // with lock. Otherwise use the game's actual speed so we don't override the
  // developer's intended default.
  if (state.moveSpeed !== 4) {
    setMoveSpeed(state.moveSpeed, true);
  } else {
    // Store the game's actual speed so the slider shows the correct value
    const actualSpeed = getMoveSpeed();
    if (actualSpeed !== 4) {
      useCheatStore.getState().setMoveSpeed(actualSpeed);
    }
  }

  // Restore both independent game speed values from persistence
  setGameSpeedAll(state.gameSpeedAll);
  setGameSpeedBattle(state.gameSpeedBattle);
  // Apply persisted multiplier settings
  if (state.expMultiplier !== 1) {
    setExpMultiplier(state.expMultiplier);
  }
  if (state.damageMultiplier !== 1) {
    setDamageMultiplier(state.damageMultiplier);
  }
}
