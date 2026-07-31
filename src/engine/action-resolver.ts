import type { Manipulator, ToEvent } from "karabiner.ts";
import { toKey } from "karabiner.ts";

import type { Action, ActionSpec, AppTarget } from "./action-dsl";
import { getOpenFolderCommand } from "./folder-opener";
import { FINDER_REPLACEMENT } from "../data/settings-global";
import {
  actHereCmd,
  applescript,
  cmd,
  openAppBundleCommand,
  openAppPathCommand,
  pythonScriptCommand,
  textProcessorCommand,
  withSleep,
} from "./scripts";
import { openApp } from "./software";
import type { Modifier } from "karabiner.ts";
import { VMOD, type ModComboAlias } from "../data/key-aliases";

const VMOD_ALIAS_LOWER = new Map<string, ModComboAlias>(
  Object.keys(VMOD).map((key) => [
    key.toLowerCase(),
    key as ModComboAlias,
  ]),
);

export function getModComboAliasCanonicalKey(
  alias: string,
): ModComboAlias | undefined {
  return VMOD_ALIAS_LOWER.get(alias.toLowerCase());
}

export function resolveModComboAlias(alias: string): Modifier[] | undefined {
  const canonical = getModComboAliasCanonicalKey(alias);
  return canonical ? [...VMOD[canonical]] : undefined;
}

export function isModComboAlias(alias: string): boolean {
  return Boolean(getModComboAliasCanonicalKey(alias));
}

export function expandModifiers(modifiers: string[]): string[] {
  const expanded: string[] = [];
  const seen = new Set<string>();
  for (const mod of modifiers) {
    for (const m of resolveModComboAlias(mod) ?? [mod]) {
      if (!seen.has(m)) {
        seen.add(m);
        expanded.push(m);
      }
    }
  }
  return expanded;
}

function resolveName(ref: { name: string | string[] }): string {
  return Array.isArray(ref.name) ? ref.name[0]! : ref.name;
}


/**
 * Resolve an AppTarget ref to the correct openApp() argument shape.
 * - AppRef  (type:"app")  → { bundleIdentifier }
 * - PathRef (type:"path") → { filePath }
 * - raw string starting with "/" or ending with ".app" → { filePath }
 * - raw string otherwise → { bundleIdentifier } (treated as a bundle ID)
 */
function resolveAppTarget(ref: AppTarget): { bundleIdentifier: string } | { filePath: string } {
  if (typeof ref === "string") {
    return ref.startsWith("/") || ref.endsWith(".app")
      ? { filePath: ref }
      : { bundleIdentifier: ref };
  }
  if (ref.type === "path") {
    return { filePath: resolveName(ref) };
  }
  return { bundleIdentifier: resolveName(ref) };
}

/** Check if a token represents a file-system path. */
function isPathToken(token: string): boolean {
  const clean = token.replace(/^['"]+|['"]+$/g, "");
  if (!clean) return false;

  if (
    clean.startsWith("/") ||
    clean.startsWith("~/") ||
    clean === "~" ||
    clean.startsWith("$HOME/") ||
    clean.startsWith("${HOME}/") ||
    clean.startsWith("./") ||
    clean.startsWith("../")
  ) {
    return true;
  }

  if (
    clean.includes("/") &&
    !clean.includes("://") &&
    !clean.startsWith("-") &&
    !/\s\/\s/.test(clean)
  ) {
    return true;
  }

  return false;
}

/**
 * Splits a shell command string into discrete tokens (arguments, operators, whitespace),
 * preserving single and double quoted argument boundaries.
 */
function tokenizeShellCommand(cmdStr: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < cmdStr.length; i++) {
    const char = cmdStr[i];
    const prevChar = i > 0 ? cmdStr[i - 1] : "";

    if (char === "'" && !inDouble && prevChar !== "\\") {
      inSingle = !inSingle;
      current += char;
    } else if (char === '"' && !inSingle && prevChar !== "\\") {
      inDouble = !inDouble;
      current += char;
    } else if (/\s/.test(char) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Ensures that any file-system paths in a shell command string are enclosed in a single set of quotes,
 * removing duplicate/nested quoting and adding missing quotes to unquoted paths.
 */
export function ensurePathQuotingInCommand(commandStr: string): string {
  if (!commandStr) return commandStr;

  const tokens = tokenizeShellCommand(commandStr);
  const normalizedTokens = tokens.map((token) => {
    if (/^\s+$/.test(token) || /^(&&|\|\||;|\|)$/.test(token)) {
      return token;
    }

    const leadingMatch = token.match(/^['"]+/);
    const trailingMatch = token.match(/['"]+$/);

    const leadingQuotes = leadingMatch ? leadingMatch[0] : "";
    const trailingQuotes = trailingMatch ? trailingMatch[0] : "";

    const inner = token.slice(
      leadingQuotes.length,
      token.length - trailingQuotes.length
    );

    if (!isPathToken(inner)) {
      return token;
    }

    // Single set of quotes check: exactly 1 leading quote, 1 trailing quote, matching quote char
    if (
      leadingQuotes.length === 1 &&
      trailingQuotes.length === 1 &&
      leadingQuotes === trailingQuotes
    ) {
      return token;
    }

    return `"${inner}"`;
  });

  return normalizedTokens.join("");
}

function normalizeToEvent(event: ToEvent): ToEvent {
  if (
    event &&
    typeof event === "object" &&
    "shell_command" in event &&
    typeof (event as any).shell_command === "string"
  ) {
    return {
      ...event,
      shell_command: ensurePathQuotingInCommand((event as any).shell_command),
    };
  }
  return event;
}

function normalizeToEvents(events?: ToEvent[]): ToEvent[] | undefined {
  if (!events || !Array.isArray(events)) return events;
  return events.map(normalizeToEvent);
}

/**
 * Ensures that any file-system paths in manipulators are enclosed in a single set of quotes.
 */
export function ensurePathQuotingInManipulators<T extends Manipulator | Manipulator[]>(
  input: T
): T {
  if (Array.isArray(input)) {
    return input.map((m) => ensurePathQuotingInManipulators(m)) as T;
  }
  if (!input || typeof input !== "object") return input;

  const m: any = { ...input };

  if (m.to) m.to = normalizeToEvents(m.to);
  if (m.to_if_alone) m.to_if_alone = normalizeToEvents(m.to_if_alone);
  if (m.to_if_held_down) m.to_if_held_down = normalizeToEvents(m.to_if_held_down);
  if (m.to_after_key_up) m.to_after_key_up = normalizeToEvents(m.to_after_key_up);
  if (m.to_if_canceled) m.to_if_canceled = normalizeToEvents(m.to_if_canceled);

  if (m.to_delayed_action) {
    m.to_delayed_action = {
      ...m.to_delayed_action,
      ...(m.to_delayed_action.to_if_invoked
        ? { to_if_invoked: normalizeToEvents(m.to_delayed_action.to_if_invoked) }
        : {}),
      ...(m.to_delayed_action.to_if_canceled
        ? { to_if_canceled: normalizeToEvents(m.to_delayed_action.to_if_canceled) }
        : {}),
    };
  }

  return m as unknown as T;
}

export const ensurePathQuoting = ensurePathQuotingInManipulators;

function resolveShellCommand(action: ActionSpec): string | null {
  switch (action.type) {
    case "folder":
      return getOpenFolderCommand(resolveName(action.ref), FINDER_REPLACEMENT);
    case "actHere":
      return actHereCmd(action.action);
    case "url": {
      const urlString =
        typeof action.url === "string" ? action.url : resolveName(action.url);
      return action.background
        ? `open -g '${urlString}'`
        : `open -u '${urlString}'`;
    }
    case "caseChange":
      return textProcessorCommand(action.operation);
    case "wrapString":
      return withSleep(
        action.delaySeconds ?? 0.1,
        textProcessorCommand(action.operation),
      );
    // Accepts an arbitrary shell string or a CommandRef (resolve its .name).
    case "shell":
      return typeof action.command === "string"
        ? action.command
        : resolveName(action.command);
    case "python":
      return pythonScriptCommand(action.scriptPath, {
        venv: action.venv,
        args: action.args,
      });
    case "app":
      if (action.mode === "shell") {
        const target = resolveAppTarget(action.ref);
        return "filePath" in target
          ? openAppPathCommand(target.filePath)
          : openAppBundleCommand(target.bundleIdentifier);
      }
      return null;
    default:
      return null;
  }
}

function resolveActionToEventsRaw(action: Action): ToEvent[] {
  // Raw ToEvent passthrough: a `do` entry without a `type` discriminator is a
  // verbatim Karabiner to-event (mouse mappings). ActionSpec always carries `type`.
  if (!("type" in action)) return [action];
  switch (action.type) {
    case "noop":
      return [];
    case "app": {
      const target = resolveAppTarget(action.ref);

      if (action.mode === "shell") {
        return [cmd(
          "filePath" in target
            ? openAppPathCommand(target.filePath)
            : openAppBundleCommand(target.bundleIdentifier),
        )];
      }

      return [openApp(target)];
    }
    case "appHistory":
      return [openApp({ historyIndex: action.index })];
    case "key": {
      const modifiers = action.modifiers?.length
        ? expandModifiers(action.modifiers as string[])
        : undefined;
      return [
        toKey(
          action.key as any,
          modifiers?.length ? (modifiers as any) : undefined,
          action.options && Object.keys(action.options).length
            ? (action.options as any)
            : undefined,
        ),
      ];
    }
    case "externalHk": {
      const modifiers = action.ref.modifiers.length
        ? expandModifiers(action.ref.modifiers)
        : undefined;
      const opts = { ...action.ref.options, ...action.options };
      return [
        toKey(
          action.ref.name as any,
          modifiers?.length ? (modifiers as any) : undefined,
          Object.keys(opts).length ? (opts as any) : undefined,
        ),
      ];
    }
    case "osascript":
      return [applescript(action.scriptPath, ...(action.args ?? []))];
    case "cut":
      return [toKey("x", ["command"])];
    case "copy":
      return [toKey("c", ["command"])];
    case "paste":
      return [toKey("v", ["command"])];
    case "caseChange":
    case "wrapString":
      return [toKey("x", ["command"]), cmd(resolveShellCommand(action)!)];
    case "sequence":
      return action.actions.flatMap(resolveActionToEvents);
    case "command":
      return [cmd(resolveName(action.ref))];
    case "setVar": {
      let value: string | number = 1;
      if (action.toggle) value = "toggle";
      else if (typeof action.value === "boolean") value = action.value ? 1 : 0;
      else if (action.value !== undefined) value = action.value;
      return [{ set_variable: { name: action.var.name, value } } as unknown as ToEvent];
    }
    default: {
      const shellCommand = resolveShellCommand(action);
      return shellCommand ? [cmd(shellCommand)] : [];
    }
  }
}

export function resolveActionToEvents(action: Action): ToEvent[] {
  const events = resolveActionToEventsRaw(action);
  return events.map(normalizeToEvent);
}

