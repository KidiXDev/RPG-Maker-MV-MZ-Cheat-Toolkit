export function eventToCombo(event: KeyboardEvent) {
  const parts: string[] = [];
  const key = getEventKey(event);

  if (event.ctrlKey) {
    parts.push('Control');
  }

  if (event.altKey) {
    parts.push('Alt');
  }

  if (event.shiftKey && key !== 'Shift') {
    parts.push('Shift');
  }

  if (event.metaKey) {
    parts.push('Meta');
  }

  if (key && !['Control', 'Alt', 'Meta'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

function getEventKey(event: KeyboardEvent) {
  if (event.key && event.key !== 'Unidentified') {
    return normalizeKey(event.key);
  }

  const code = event.keyCode || event.which;
  return keyCodeToKey(code);
}

function normalizeKey(key: string) {
  if (key === 'Esc') {
    return 'Escape';
  }

  if (key === 'Spacebar' || key === ' ') {
    return 'Space';
  }

  return key.length === 1 ? key.toUpperCase() : key;
}

function keyCodeToKey(code: number) {
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(code);
  }

  if (code >= 48 && code <= 57) {
    return String.fromCharCode(code);
  }

  if (code >= 112 && code <= 123) {
    return `F${code - 111}`;
  }

  const names: Record<number, string> = {
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    20: 'CapsLock',
    27: 'Escape',
    32: 'Space',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    91: 'Meta',
    93: 'Meta',
    186: ';',
    187: '=',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '[',
    220: '\\',
    221: ']',
    222: "'"
  };

  return names[code] ?? '';
}
