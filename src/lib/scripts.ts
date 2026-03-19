import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ToEvent } from 'karabiner.ts';
import { toSendUserCommand } from 'karabiner.ts';

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

const TEXT_PROCESSOR_UV_BIN = '~/.local/bin/uv';
const TEXT_PROCESSOR_DIR = '~/Scripts/strings/text_processor';

/**
 * Create a generic user command for any registered endpoint.
 * Payloads are routed to the command server by 'endpoint' field.
 *
 * Example:
 *   userCommand('hammerspoon', { function: 'focusApp', args: { bundleId: 'com.apple.Safari' } })
 */
export function userCommand(endpoint: string, payload: Record<string, unknown>): ToEvent {
  if (ENABLE_LAYER_INDICATOR_USER_COMMAND) {
    return toSendUserCommand({ endpoint, ...payload }, LAYER_INDICATOR_USER_COMMAND_ENDPOINT);
  }
  // Fallback: no shell_command equivalent for generic endpoints
  console.warn(`userCommand: endpoint '${endpoint}' requires command server; fallback unavailable`);
  return cmd('open -g "hammerspoon://noop"');
}

/**
 * Send a notification via Hammerspoon using the command server.
 * Falls back to osascript if Hammerspoon unavailable.
 *
 * Example:
 *   showNotification('Alert', { subtitle: 'This is a message' })
 *
 * Latency: ~100ms (Hammerspoon) or ~50ms (osascript)
 */
export function showNotification(
  title: string,
  options?: { subtitle?: string; informativeText?: string }
): ToEvent {
  // Prefer Hammerspoon if available (allows custom styling)
  if (ENABLE_LAYER_INDICATOR_USER_COMMAND) {
    return userCommand('hammerspoon', {
      function: 'showNotification',
      args: {
        title,
        ...options,
      },
    });
  }

  // Fallback: osascript native notification
  const subtitle = options?.subtitle ? `with subtitle "${options.subtitle}"` : '';
  const info = options?.informativeText ? ` message "${options.informativeText}"` : '';
  const script = `display notification "${title}" ${subtitle}${info}`;
  return cmd(`osascript -e ${shellSingleQuote(script)}`);
}

/**
 * Focus an application by bundle ID using native macOS `open` command.
 * Direct implementation, no Hammerspoon routing needed.
 *
 * Example:
 *   focusApp('com.apple.Safari')
 *
 * Latency: ~10-30ms (native open -b, no overhead)
 */
export function focusApp(bundleId: string): ToEvent {
  // Use native macOS open -b for instant app focus
  // Much faster than socket routing through Hammerspoon
  return cmd(`open -b ${shellSingleQuote(bundleId)}`);
}

/**
 * Copy text to clipboard using native `pbcopy` command.
 * Direct implementation, no Hammerspoon routing needed.
 *
 * Example:
 *   copyToClipboard('Hello, world!')
 *
 * Latency: ~2-5ms (native pbcopy, 50-100x faster than Hammerspoon routing)
 */
export function copyToClipboard(text: string): ToEvent {
  // Use native pbcopy for instant clipboard write
  // Avoids socket overhead: no server latency, no Hammerspoon IPC
  // Direct stdin to pbcopy is fastest possible clipboard implementation
  const quoted = shellSingleQuote(text);
  return cmd(`echo -n ${quoted} | pbcopy`);
}
const TEXT_PROCESSOR_ENTRYPOINT = 'interfaces/cli.py';
const TAKE_ACTION_HERE_SCRIPT = '~/Scripts/active_process/take_action_here/take_action_here.sh';
const OPEN_APP_BIN = '~/.local/bin/open-app';

function shellSingleQuote(str: string): string {
  return `'${str.replace(/'/g, `"'"'`)}'`;
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

export function hs(code: string): ToEvent {
  const codeQuoted = shellSingleQuote(code);
  return cmd(`/opt/homebrew/bin/hs -c ${codeQuoted}`);
}

export function pythonCommand(
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

export function python(spec: string | string[], opts?: { useEnv?: boolean; pythonBin?: string }): ToEvent {
  return cmd(pythonCommand(spec, opts));
}

export function textProcessorCommand(action: string): string {
  return pythonCommand(
    [TEXT_PROCESSOR_ENTRYPOINT, action, '--source', 'clipboard', '--dest', 'paste'],
    { pythonBin: `${TEXT_PROCESSOR_UV_BIN} --directory ${TEXT_PROCESSOR_DIR} run python` }
  );
}

export function withSleep(delaySeconds: number, shell: string): string {
  return `sleep ${delaySeconds} && ${shell}`;
}

export function openUrlCommand(url: string): string {
  return `open ${shellSingleQuote(url)}`;
}

export function raycastExtensionCommand(route: string): string {
  return openUrlCommand(`raycast://extensions/${route}`);
}

export function cleanShotCommand(route: string): string {
  return openUrlCommand(`cleanshot://${route}`);
}

export function takeActionHereCommand(action: string): string {
  return `${TAKE_ACTION_HERE_SCRIPT} --action ${action}`;
}

export function openAppBundleCommand(bundleIdentifier: string): string {
  return `${OPEN_APP_BIN} -b ${shellSingleQuote(bundleIdentifier)}`;
}

export function lua(code: string): ToEvent {
  const codeQuoted = shellSingleQuote(code);
  return cmd(`lua -e ${codeQuoted}`);
}
