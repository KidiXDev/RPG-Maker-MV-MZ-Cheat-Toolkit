import { gameWindow } from '../types.ts';

export function variableEntries() {
  const runtime = gameWindow();
  const names = runtime.$dataSystem?.variables ?? [];

  return names.map((name, id) => ({
    id,
    name,
    value: runtime.$gameVariables?.value(id) ?? 0
  }));
}

export function setVariableValue(id: number, value: unknown) {
  gameWindow().$gameVariables?.setValue(id, value);
}

export function coerceVariableInput(value: string) {
  const trimmed = value.trim();

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed !== '' && Number.isFinite(Number(trimmed))) {
    return Number(trimmed);
  }

  return value;
}
