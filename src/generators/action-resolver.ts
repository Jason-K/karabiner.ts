import type { ToEvent } from "karabiner.ts";
import { toKey } from "karabiner.ts";

import { getFolderOpenerBundleId, getOpenFolderCommand } from "../lib/folder-opener";
import {
    applescript,
    cleanShotCommand,
    cmd,
    openAppBundleCommand,
    openUrlCommand,
    raycastExtensionCommand,
    takeActionHereCommand,
    textProcessorCommand,
    withSleep,
} from "../lib/scripts";
import { openApp } from "../lib/software";
import type { ActionSpec } from "../mappings/action-dsl";
import { appRegistry } from "../mappings/apps";
import { cleanShotRegistry } from "../mappings/cleanshot";
import { folderRegistry } from "../mappings/folders";
import { raycastRegistry } from "../mappings/raycast";

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
    case "takeActionHere":
      return takeActionHereCommand(action.action);
    case "url":
      return action.background
        ? `open -g '${action.url}'`
        : openUrlCommand(action.url);
    case "selectionTransform":
      return textProcessorCommand(action.operation);
    case "selectionWrap":
      return withSleep(
        action.delaySeconds ?? 0.2,
        textProcessorCommand(action.operation),
      );
    case "shell":
      return action.command;
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
        return [cmd(`open -b '${bundleId}'`)];
      }

      if (action.mode === "shell") {
        return [cmd(openAppBundleCommand(bundleId))];
      }

      return [openApp({ bundleIdentifier: bundleId })];
    }
    case "appHistory":
      return [openApp({ historyIndex: action.index })];
    case "key":
      return [
        toKey(
          action.key as any,
          (action.modifiers as any) ?? [],
          action.options ?? {},
        ),
      ];
    case "applescript":
      return [applescript(action.scriptPath, ...(action.args ?? []))];
    case "cut":
      return [toKey("x", ["left_command"])];
    case "copy":
      return [toKey("c", ["left_command"])];
    case "paste":
      return [toKey("v", ["left_command"])];
    case "selectionTransform":
    case "selectionWrap":
      return [toKey("x", ["left_command"]), cmd(resolveShellCommand(action)!)];
    default: {
      const shellCommand = resolveShellCommand(action);
      return shellCommand ? [cmd(shellCommand)] : [];
    }
  }
}
