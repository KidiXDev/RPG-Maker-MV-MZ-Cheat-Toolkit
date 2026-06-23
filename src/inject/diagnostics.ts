import { eventToCombo } from '../shortcuts/keycodes.ts';
import { gameWindow } from '../game/types.ts';

type NodeFs = {
  appendFileSync(filePath: string, content: string): void;
  mkdirSync(filePath: string, options?: { recursive?: boolean }): void;
  writeFileSync(filePath: string, content: string): void;
};

type NodePath = {
  dirname(filePath: string): string;
  join(...parts: string[]): string;
};

type NodeProcess = {
  cwd(): string;
  versions?: Record<string, string | undefined>;
};

type DiagnosticRuntime = typeof globalThis & {
  process?: NodeProcess;
  require?: (moduleName: string) => unknown;
  __RMC_DIAGNOSTIC__?: {
    enabled?: boolean;
    path?: string | null;
    log?: (message: string, details?: unknown) => void;
  };
};

type DiagnosticFileWriter = {
  path: string;
  write(message: string): void;
};

const STORAGE_KEY = 'rmc-cheat-diagnostic';
let diagnostics: Diagnostics | null = null;

export type Diagnostics = {
  enabled: boolean;
  log(message: string, details?: unknown): void;
  installGlobalHandlers(): void;
  inspectHost(label: string): void;
};

export function getDiagnostics() {
  if (!diagnostics) {
    diagnostics = createDiagnostics();
  }

  return diagnostics;
}

export function diagnosticLog(message: string, details?: unknown) {
  getDiagnostics().log(message, details);
}

export function diagnosticKeyLog(event: KeyboardEvent, label: string, matched: boolean) {
  const logger = getDiagnostics();

  if (!logger.enabled) {
    return;
  }

  logger.log(label, {
    combo: eventToCombo(event),
    key: event.key,
    keyCode: event.keyCode,
    which: event.which,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    matched
  });
}

function createDiagnostics(): Diagnostics {
  const script = getDiagnosticScript();
  const external = getExternalDiagnostics();
  const enabled = Boolean(external?.enabled) || isDiagnosticEnabled(script);
  const fileWriter = external?.log
    ? createExternalWriter(external)
    : enabled
      ? createFileWriter(script?.src ?? '')
      : null;
  let handlersInstalled = false;

  function log(message: string, details?: unknown) {
    if (!enabled) {
      return;
    }

    const line = `[RMC] ${message}${details === undefined ? '' : ` ${safeJson(details)}`}`;
    console.log(line);
    fileWriter?.write(line);
  }

  return {
    enabled,
    log,
    installGlobalHandlers() {
      if (!enabled || handlersInstalled) {
        return;
      }

      handlersInstalled = true;
      log('diagnostic enabled', getRuntimeInfo(fileWriter?.path));

      window.addEventListener('error', (event) => {
        log('window error', {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: errorStack(event.error)
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        log('unhandled rejection', {
          reason: errorStack(event.reason) ?? String(event.reason)
        });
      });
    },
    inspectHost(label: string) {
      if (!enabled) {
        return;
      }

      const host = document.getElementById('rmc-cheat-host');
      const shadowRoot = host?.shadowRoot;

      log(`host inspect: ${label}`, {
        host: Boolean(host),
        shadow: Boolean(shadowRoot),
        bodyChildren: document.body.children.length,
        hostStyle: host?.getAttribute('style') ?? '',
        shadowHtml: shadowRoot?.innerHTML.slice(0, 500) ?? ''
      });
    }
  };
}

function getDiagnosticScript() {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript;
  }

  return document.querySelector<HTMLScriptElement>('script[data-rmc-diagnostic="1"]');
}

function isDiagnosticEnabled(script: HTMLScriptElement | null) {
  if (script?.getAttribute('data-rmc-diagnostic') === '1') {
    return true;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function createFileWriter(scriptUrl: string): DiagnosticFileWriter | null {
  const runtime = gameWindow() as DiagnosticRuntime;
  const nodeRequire = gameWindow().require ?? runtime.require;
  const processRef = runtime.process;

  if (!nodeRequire || !processRef) {
    return null;
  }

  try {
    const fs = nodeRequire('fs') as NodeFs;
    const path = nodeRequire('path') as NodePath;
    const cheatDir = scriptUrl.includes('/www/cheat/') ? ['www', 'cheat'] : ['cheat'];
    const logPath = path.join(processRef.cwd(), ...cheatDir, 'rmc-diagnostic.log');

    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, `rmc diagnostic start ${new Date().toISOString()}\n`);

    return {
      path: logPath,
      write(message: string) {
        fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
      }
    };
  } catch (error) {
    console.warn('[RMC] diagnostic file writer unavailable', error);
    return null;
  }
}

function getExternalDiagnostics() {
  return (gameWindow() as DiagnosticRuntime).__RMC_DIAGNOSTIC__;
}

function createExternalWriter(external: NonNullable<ReturnType<typeof getExternalDiagnostics>>): DiagnosticFileWriter {
  return {
    path: external.path ?? '',
    write(message: string) {
      external.log?.(message);
    }
  };
}

function getRuntimeInfo(logPath?: string) {
  const runtime = gameWindow() as DiagnosticRuntime;

  return {
    href: window.location.href,
    logPath,
    nw: runtime.process?.versions?.nw,
    chromium: runtime.process?.versions?.chromium,
    userAgent: window.navigator.userAgent
  };
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function errorStack(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return undefined;
}
