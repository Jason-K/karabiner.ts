import type { ToEvent } from 'karabiner.ts';

export function cmd(shell: string): ToEvent {
  return { shell_command: shell } as ToEvent;
}

const TEXT_PROCESSOR_UV_BIN = '/Users/jason/.local/bin/uv';
const TEXT_PROCESSOR_DIR = '~/Scripts/strings/text_processor';
const TEXT_PROCESSOR_ENTRYPOINT = 'interfaces/cli.py';
const TAKE_ACTION_HERE_SCRIPT = '/Users/jason/Scripts/active_process/take_action_here/take_action_here.sh';
const OPEN_APP_BIN = '/Users/jason/.local/bin/open-app';

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
