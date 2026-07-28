import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ToEvent } from 'karabiner.ts';

import { FOCUS_APP_BEHAVIORS } from "../data/focus-app";
import { PATHS } from "../data/paths";
import { toSendUserCommand } from "./beta";

export function cmd(shell: string): ToEvent {
  return { shell_command: shell } as ToEvent;
}

const ENABLE_LAYER_INDICATOR_USER_COMMAND = true;
const DEFAULT_LAYER_INDICATOR_USER_COMMAND_ENDPOINT = '/tmp/karabiner-layer-indicator.sock';

function readLayerIndicatorUserCommandEndpoint(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const endpointPath = resolve(currentDir, '../../scripts/layer-indicator-user-command-endpoint.txt');
    const endpoint = readFileSync(endpointPath, 'utf8').trim();
    return endpoint || DEFAULT_LAYER_INDICATOR_USER_COMMAND_ENDPOINT;
  } catch {
    return DEFAULT_LAYER_INDICATOR_USER_COMMAND_ENDPOINT;
  }
}

const LAYER_INDICATOR_USER_COMMAND_ENDPOINT = readLayerIndicatorUserCommandEndpoint();

/**
 * Create a user command for the layer-indicator receiver.
 * Replaces hammerspoon:// scheme calls with more efficient send_user_command events.
 */
export function layerIndicatorCommand(action: 'show' | 'hide', layer?: string): ToEvent {
  if (ENABLE_LAYER_INDICATOR_USER_COMMAND) {
    const payload: Record<string, string> = { action };
    if (layer !== undefined) {
      payload.layer = layer;
    }
    return toSendUserCommand(payload, LAYER_INDICATOR_USER_COMMAND_ENDPOINT);
  }

  if (action === 'show') {
    const targetLayer = layer ?? 'space';
    return cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=${targetLayer}'`);
  }

  return cmd(`open -g 'hammerspoon://layer_indicator?action=hide'`);
}



export type FocusAppOptions = {
  appName?: string;
  activationDelaySeconds?: number;
  createWindowShortcut?: {
    key: string;
    modifiers?: string[];
  };
};

function getFocusAppBehavior(bundleId: string): FocusAppOptions | undefined {
  return FOCUS_APP_BEHAVIORS[bundleId as keyof typeof FOCUS_APP_BEHAVIORS];
}

/**
 * Focus an application by bundle ID using native macOS `open` command.
 * Optionally checks whether the app has a visible window and creates one if needed.
 *
 * Example:
 *   focusApp('com.apple.Safari')
 *   focusApp('com.chabomakers.Antinote-setapp') // auto-creates a note window if none exists
 *
 * Latency: ~10-30ms (native open -b, no overhead)
 */
export function focusApp(bundleId: string, options?: FocusAppOptions): ToEvent {
  const openCommand = `open -b ${shellSingleQuote(bundleId)}`;
  const defaultBehavior = getFocusAppBehavior(bundleId);
  const resolvedOptions = {
    ...defaultBehavior,
    ...options,
    createWindowShortcut:
      options?.createWindowShortcut ?? defaultBehavior?.createWindowShortcut,
  };

  if (!resolvedOptions.appName || !resolvedOptions.createWindowShortcut) {
    return cmd(openCommand);
  }

  return cmd(
    `${openCommand} && ${buildFocusAppWindowCheckCommand(resolvedOptions)}`,
  );
}


function shellSingleQuote(str: string): string {
  return `'${str.replace(/'/g, `"'"'`)}'`;
}

function appleScriptDoubleQuote(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildFocusAppWindowCheckCommand(options: FocusAppOptions): string {
  const appName = appleScriptDoubleQuote(options.appName ?? "");
  const key = appleScriptDoubleQuote(options.createWindowShortcut?.key ?? "n");
  const modifiers = options.createWindowShortcut?.modifiers ?? [];
  const delaySeconds = options.activationDelaySeconds ?? 0.2;

  const keystrokeLine = modifiers.length
    ? `keystroke "${key}" using {${modifiers.join(", ")}}`
    : `keystroke "${key}"`;

  const script = [
    `delay ${delaySeconds}`,
    'tell application "System Events"',
    `if exists process "${appName}" then`,
    `set windowCount to count of windows of process "${appName}"`,
    "if windowCount is 0 then",
    keystrokeLine,
    "end if",
    "end if",
    "end tell",
  ].join("\n");

  return `osascript -e ${shellSingleQuote(script)}`;
}

function normalizePathForShell(path: string): string {
  if (path.startsWith('~/')) {
    return `"$HOME/${path.slice(2)}"`;
  }
  if (path.startsWith('$HOME/')) {
    return `"${path}"`;
  }
  return `"${path}"`;
}

export function applescript(scriptPath: string, ...args: string[]): ToEvent {
  const p = normalizePathForShell(scriptPath);
  const parts = ['osascript', p, ...args.map((a) => shellSingleQuote(a))];
  return cmd(parts.join(' '));
}

function pythonCommand(
  spec: string | string[],
  opts?: { useEnv?: boolean; pythonBin?: string }
): string {
  const pythonBin = opts?.pythonBin ?? 'python3';
  if (Array.isArray(spec)) {
    const joined = spec.map((s) => (s.includes(' ') ? shellSingleQuote(s) : s)).join(' ');
    return `${pythonBin} ${joined}`;
  }
  return `${pythonBin} ${spec}`;
}

export function pythonScriptCommand(
  scriptPath: string,
  opts?: { venv?: string; args?: string[] },
): string {
  const parts = [PATHS.uvBin.name, "run"];
  if (opts?.venv) {
    parts.push("--python", normalizePathForShell(`${opts.venv}/bin/python`));
  }
  parts.push(normalizePathForShell(scriptPath));
  if (opts?.args?.length) {
    parts.push(...opts.args.map(shellSingleQuote));
  }
  return parts.join(" ");
}

export function textProcessorCommand(action: string): string {
  return pythonCommand(
    [
      PATHS.textProcessorEntrypoint.name,
      action,
      "--source",
      "clipboard",
      "--dest",
      "paste",
    ],
    {
      pythonBin: `${PATHS.uvBin.name} --directory ${PATHS.textProcessorDir.name} run python`,
    },
  );
}



export function withSleep(delaySeconds: number, shell: string): string {
  return `sleep ${delaySeconds} && ${shell}`;
}



export function actHereCmd(action: string): string {
  return `${PATHS.actHereScript.name} --action ${action}`;
}

export function openAppBundleCommand(bundleIdentifier: string): string {
  return `${PATHS.openAppBin.name} -b ${shellSingleQuote(bundleIdentifier)}`;
}


