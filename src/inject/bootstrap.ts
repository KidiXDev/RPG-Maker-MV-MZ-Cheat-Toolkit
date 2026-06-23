import { isGameReady, patchTouchInputPassThrough } from '../game/engine.ts';
import { getMoveSpeed } from '../game/cheats/general.ts';
import { patchMessageSkip } from '../game/cheats/message.ts';
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
  applyRuntimeDefaults();
  useCheatStore.getState().setGameReady(true);
}

function applyRuntimeDefaults() {
  // Cheat values (game speed, move speed, no-clip, multipliers) are transient
  // and start fresh each session — nothing to restore here. We only sync the
  // store's move speed to the game's actual default so the slider displays the
  // correct starting value.
  const actualSpeed = getMoveSpeed();
  if (actualSpeed !== useCheatStore.getState().moveSpeed) {
    useCheatStore.getState().setMoveSpeed(actualSpeed);
  }
}
