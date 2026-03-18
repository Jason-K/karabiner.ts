import type { ToEvent } from 'karabiner.ts';

export function cmd(shell: string): ToEvent {
  return { shell_command: shell } as ToEvent;
}

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

export function python(spec: string | string[], opts?: { useEnv?: boolean; pythonBin?: string }): ToEvent {
  const pythonBin = opts?.pythonBin ?? 'python3';
  if (Array.isArray(spec)) {
    const joined = spec.map((s) => (s.includes(' ') ? shellSingleQuote(s) : s)).join(' ');
    return cmd(`${pythonBin} ${joined}`);
  }
  return cmd(`${pythonBin} ${spec}`);
}

export function lua(code: string): ToEvent {
  const codeQuoted = shellSingleQuote(code);
  return cmd(`lua -e ${codeQuoted}`);
}
