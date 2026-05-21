import type { ToEvent } from "karabiner.ts";
import { toKey } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { getFolderOpenerBundleId, getOpenFolderCommand } from "../core/folder-opener";
import {
  actHereCmd,
  applescript,
  cleanShotCommand,
  cmd,
  focusApp,
  openAppBundleCommand,
  openUrlCommand,
  pythonScriptCommand,
  raycastExtensionCommand,
  textProcessorCommand,
  withSleep,
} from "../core/scripts";
import { openApp } from "../core/software";
import { appRegistry, folderRegistry } from "../data";
import { cleanShotRegistry } from "../data/cleanshot";
import { MODIFIER_ALIASES } from "../data/key-aliases";
import { raycastRegistry } from "../data/raycast";

function expandModifiers(modifiers: string[]): string[] {
  const expanded: string[] = [];
  const seen = new Set<string>();
  for (const mod of modifiers) {
    for (const m of MODIFIER_ALIASES[mod] ?? [mod]) {
      if (!seen.has(m)) {
        seen.add(m);
        expanded.push(m);
      }
    }
  }
  return expanded;
}

function resolveAppBundleId(ref: keyof typeof appRegistry): string {
  if (ref === "folderOpener") {
    return getFolderOpenerBundleId();
  }

  return appRegistry[ref];
}

function resolveShellCommand(action: ActionSpec): string | null {
  switch (action.type) {
    case "folder":
      return getOpenFolderCommand(folderRegistry[action.ref]);
    case "raycast":
      return raycastExtensionCommand(raycastRegistry[action.ref]);
    case "cleanShot":
      return cleanShotCommand(cleanShotRegistry[action.ref]);
    case "actHere":
      return actHereCmd(action.action);
    case "url":
      return action.background
        ? `open -g '${action.url}'`
        : openUrlCommand(action.url);
    case "caseChange":
      return textProcessorCommand(action.operation);
    case "wrapString":
      return withSleep(
        action.delaySeconds ?? 0.2,
        textProcessorCommand(action.operation),
      );
    case "shell":
      return action.command;
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

export function resolveActionToEvents(action: ActionSpec): ToEvent[] {
  switch (action.type) {
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
      return [toKey("x", ["left_command"])];
    case "copy":
      return [toKey("c", ["left_command"])];
    case "paste":
      return [toKey("v", ["left_command"])];
    case "caseChange":
    case "wrapString":
      return [toKey("x", ["left_command"]), cmd(resolveShellCommand(action)!)];
    case "sequence":
      return action.actions.flatMap(resolveActionToEvents);
    default: {
      const shellCommand = resolveShellCommand(action);
      return shellCommand ? [cmd(shellCommand)] : [];
    }
  }
}
