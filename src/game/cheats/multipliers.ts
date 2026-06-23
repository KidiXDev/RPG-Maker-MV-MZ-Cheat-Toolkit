/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameWindow } from '../types.ts';

let expMultiplier = 1;
let damageMultiplier = 1;
let expPatched = false;
let damagePatched = false;

const originals = new WeakMap<object, Map<string, (...args: any[]) => any>>();

export function setExpMultiplier(multiplier: number) {
  expMultiplier = Math.max(0, Math.min(100, multiplier));
  patchExpMultiplier();
}

export function getExpMultiplier() {
  return expMultiplier;
}

export function setDamageMultiplier(multiplier: number) {
  damageMultiplier = Math.max(0, Math.min(999, multiplier));
  patchDamageMultiplier();
}

export function getDamageMultiplier() {
  return damageMultiplier;
}

function patchExpMultiplier() {
  if (expPatched) return;

  const runtime = gameWindow();
  const proto = runtime.Game_Actor?.prototype as Record<string, (...args: any[]) => any> | undefined;

  if (!proto) return;

  const key = 'changeExp';
  const originalMethod = proto[key];

  if (typeof originalMethod !== 'function') return;

  let protoOriginals = originals.get(proto);
  if (!protoOriginals) {
    protoOriginals = new Map();
    originals.set(proto, protoOriginals);
  }

  if (protoOriginals.has(key)) return;

  protoOriginals.set(key, originalMethod);

  proto[key] = function patchedChangeExp(this: any, exp: number, show: boolean) {
    const multiplied = exp > 0 ? Math.ceil(exp * expMultiplier) : exp;
    return originalMethod.call(this, multiplied, show);
  };

  expPatched = true;
}

function patchDamageMultiplier() {
  if (damagePatched) return;

  const runtime = gameWindow();

  // Prefer patching Game_Action.prototype.evalDamageFormula.
  // Do NOT also patch Game_ActionResult.prototype.makeDamage — RPG Maker
  // chains them (evalDamageFormula → makeDamage), so patching both would
  // square the multiplier.
  const actionProto = runtime.Game_Action?.prototype as Record<string, (...args: any[]) => any> | undefined;
  if (actionProto && typeof actionProto.evalDamageFormula === 'function') {
    const key = 'evalDamageFormula';

    let protoOriginals = originals.get(actionProto);
    if (!protoOriginals) {
      protoOriginals = new Map();
      originals.set(actionProto, protoOriginals);
    }

    if (!protoOriginals.has(key)) {
      const original = actionProto.evalDamageFormula;
      protoOriginals.set(key, original);

      actionProto.evalDamageFormula = function patchedEvalDamageFormula(
        this: any,
        target: any,
      ) {
        const value = original.call(this, target) as number;
        if (value > 0) {
          return Math.ceil(value * damageMultiplier);
        }
        return value;
      };
      damagePatched = true;
      return;
    }
  }

  // Fallback: some older or modified engines expose makeDamage but not
  // evalDamageFormula. Use it only when the preferred entry point is absent.
  const resultProto = runtime.Game_ActionResult?.prototype as Record<string, (...args: any[]) => any> | undefined;
  if (resultProto && typeof resultProto.makeDamage === 'function') {
    const key = 'makeDamage';

    let protoOriginals = originals.get(resultProto);
    if (!protoOriginals) {
      protoOriginals = new Map();
      originals.set(resultProto, protoOriginals);
    }

    if (!protoOriginals.has(key)) {
      const original = resultProto.makeDamage;
      protoOriginals.set(key, original);

      resultProto.makeDamage = function patchedMakeDamage(
        this: any,
        value: number,
        elementId: number,
      ) {
        const multiplied = value > 0 ? Math.ceil(value * damageMultiplier) : value;
        return original.call(this, multiplied, elementId);
      };
    }
  }

  damagePatched = true;
}
