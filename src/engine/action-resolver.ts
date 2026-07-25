import type { ToEvent } from "karabiner.ts";
import { toKey } from "karabiner.ts";

import type { Action, ActionSpec } from "../core/action-dsl";
import { getOpenFolderCommand } from "../core/folder-opener";
import {
  actHereCmd,
  applescript,
  cmd,
  focusApp,
  openAppBundleCommand,
  pythonScriptCommand,
  textProcessorCommand,
  withSleep,
} from "../core/scripts";
import { openApp } from "../core/software";
import type { AppRef } from "../data";
import { resolveModComboAlias } from "../data/key-aliases";

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

function resolveAppBundleId(ref: AppRef): string {
  return resolveName(ref);
}

function resolveShellCommand(action: ActionSpec): string | null {
  switch (action.type) {
    case "folder":
      return getOpenFolderCommand(resolveName(action.ref));
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
        action.delaySeconds ?? 0.2,
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
        return openAppBundleCommand(resolveAppBundleId(action.ref));
      }
      return null;
    default:
      return null;
  }
}

export function resolveActionToEvents(action: Action): ToEvent[] {
  // Raw ToEvent passthrough: a `do` entry without a `type` discriminator is a
  // verbatim Karabiner to-event (mouse mappings). ActionSpec always carries `type`.
  if (!("type" in action)) return [action];
  switch (action.type) {
    case "noop":
      return [];
    case "app": {
      const bundleId = resolveAppBundleId(action.ref);

      if (action.mode === "focus") {
        return [focusApp(bundleId)];
      }

      if (action.mode === "shell") {
        return [cmd(openAppBundleCommand(bundleId))];
      }

      return [openApp({ bundleIdentifier: bundleId })];
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
