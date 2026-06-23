import type { StateStorage } from 'zustand/middleware';
import { gameWindow } from './types.ts';

type FileSystemModule = {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  readFileSync(path: string, encoding: 'utf8'): string;
  writeFileSync(path: string, value: string, encoding: 'utf8'): void;
  unlinkSync(path: string): void;
};

type PathModule = {
  join(...parts: string[]): string;
};

function localStorageAdapter(): StateStorage {
  return {
    getItem: (name) => window.localStorage.getItem(name),
    setItem: (name, value) => window.localStorage.setItem(name, value),
    removeItem: (name) => window.localStorage.removeItem(name)
  };
}

export function createCheatStorage(): StateStorage {
  const runtime = gameWindow();

  if (!runtime.require) {
    return localStorageAdapter();
  }

  try {
    const fs = runtime.require('fs') as FileSystemModule;
    const path = runtime.require('path') as PathModule;
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
    const baseDir = path.join(decodeURIComponent(basePath), 'cheat-settings');

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    return {
      getItem(name) {
        const filePath = path.join(baseDir, `${name}.json`);
        return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
      },
      setItem(name, value) {
        fs.writeFileSync(path.join(baseDir, `${name}.json`), value, 'utf8');
      },
      removeItem(name) {
        const filePath = path.join(baseDir, `${name}.json`);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    };
  } catch {
    return localStorageAdapter();
  }
}
