import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ToEvent } from 'karabiner.ts';

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




function shellSingleQuote(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
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
  const parts = [PATHS.binUV.name, "run"];
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
      PATHS.scriptTextProcessorCLI.name,
      action,
      "--source",
      "clipboard",
      "--dest",
      "paste",
    ],
    {
      pythonBin: `${PATHS.binUV.name} --directory ${PATHS.dirTextProcessor.name} run python`,
    },
  );
}



export function withSleep(delaySeconds: number, shell: string): string {
  return `sleep ${delaySeconds} && ${shell}`;
}



export function actHereCmd(action: string): string {
  return `${PATHS.scriptHere2There.name} --action ${action}`;
}

export function openAppBundleCommand(bundleIdentifier: string): string {
  return `${PATHS.binAppOpen.name} -b ${shellSingleQuote(bundleIdentifier)}`;
}

export function openAppPathCommand(filePath: string): string {
  return `${PATHS.binAppOpen.name} ${shellSingleQuote(filePath)}`;
}
