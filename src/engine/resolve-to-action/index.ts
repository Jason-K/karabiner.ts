import type { ToEvent } from "karabiner.ts";
import { toKey, toPointingButton } from "karabiner.ts";

import type { Action, ActionSpec } from "../../data";
import { FINDER_REPLACEMENT } from "../../data/constants/global";
import { ensurePathQuotingInCommand, resolveKeyAlias } from "../utils";

import {
  resolveAppTarget,
  toApp,
  toAppId,
  toAppPath,
} from "./resolve-app";
import { toVar } from "./resolve-conditions";
import { toFolder } from "./resolve-folder";
import { expandModifiers } from "./resolve-map";
import {
  toCmd,
  toHere2There,
  toOsa,
  toPy,
  toTp,
  toWithSleep,
} from "./resolve-script";

export * from "./resolve-app";
export * from "./resolve-conditions";
export * from "./resolve-folder";
export * from "./resolve-map";
export * from "./resolve-script";

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

export function resolveShellCommand(action: ActionSpec): string | null {
  switch (action.type) {
    case "folder":
      return toFolder(action.ref.path, FINDER_REPLACEMENT);
    case "actHere":
      return toHere2There(action.action);
    case "url": {
      const urlString =
        typeof action.url === "string" ? action.url : action.url.url;
      return action.background
        ? `open -g '${urlString}'`
        : `open -u '${urlString}'`;
    }
    case "caseChange":
      return toTp(action.operation);
    case "wrapString":
      return toWithSleep(
        action.delaySeconds ?? 0.1,
        toTp(action.operation),
      );
    case "shell":
      return typeof action.command === "string"
        ? action.command
        : action.command.command;
    case "python":
      return toPy(action.scriptPath, {
        venv: action.venv,
        args: action.args,
      });
    case "app":
      if (action.mode === "shell") {
        const target = resolveAppTarget(action.ref);
        return "filePath" in target
          ? toAppPath(target.filePath)
          : toAppId(target.bundleIdentifier);
      }
      return null;
    default:
      return null;
  }
}

function resolveActionToEventsRaw(action: Action): ToEvent[] {
  if (!("type" in action)) return [action];
  switch (action.type) {
    case "noop":
      return [];
    case "app": {
      const target = resolveAppTarget(action.ref);

      if (action.mode === "shell") {
        return [
          toCmd(
            "filePath" in target
              ? toAppPath(target.filePath)
              : toAppId(target.bundleIdentifier),
          ),
        ];
      }

      return [toApp(target)];
    }
    case "appHistory":
      return [toApp({ historyIndex: action.index })];
    case "key": {
      const modifiers = action.modifiers?.length
        ? expandModifiers(action.modifiers as string[])
        : undefined;
      const opts =
        action.options && Object.keys(action.options).length
          ? (action.options as any)
          : undefined;
      return [
        toKey(
          resolveKeyAlias(action.key) as any,
          modifiers?.length ? (modifiers as any) : undefined,
          opts,
        ),
      ];
    }
    case "button": {
      const modifiers = action.modifiers?.length
        ? expandModifiers(action.modifiers as string[])
        : undefined;
      return [
        toPointingButton(
          action.button as any,
          modifiers?.length ? (modifiers as any) : undefined,
          action.options && Object.keys(action.options).length
            ? (action.options as any)
            : undefined,
        ),
      ];
    }
    case "map": {
      if (typeof action.ref === "string") {
        const opts =
          action.options && Object.keys(action.options).length
            ? (action.options as any)
            : undefined;
        return [toKey(resolveKeyAlias(action.ref) as any, [], opts)];
      }
      const opts = { ...action.ref?.options, ...action.options };
      const keyOpts = Object.keys(opts).length ? (opts as any) : undefined;
      if (action.ref?.combos && action.ref.combos.length > 0) {
        return action.ref.combos.map((c) => {
          const modifiers = c.modifiers?.length
            ? expandModifiers(c.modifiers)
            : undefined;
          return toKey(
            resolveKeyAlias(c.key) as any,
            modifiers?.length ? (modifiers as any) : undefined,
            keyOpts,
          );
        });
      }
      const keyCodes = [action.ref.keyCode];
      const modifiers = action.ref?.modifiers?.length
        ? expandModifiers(action.ref.modifiers)
        : undefined;
      return keyCodes.map((n) => {
        const resolved = resolveKeyAlias(n);
        if (typeof resolved === "string" && resolved.startsWith("vk_")) {
          if (modifiers?.length) {
            return toKey(resolved as any, modifiers as any, keyOpts);
          }
          return keyOpts ? toKey(resolved as any, keyOpts) : toKey(resolved as any);
        }
        return toKey(
          resolved as any,
          modifiers?.length ? (modifiers as any) : undefined,
          keyOpts,
        );
      });
    }
    case "osascript":
      return [toOsa(action.scriptPath, ...(action.args ?? []))];
    case "cut":
      return [toKey("x", ["command"])];
    case "copy":
      return [toKey("c", ["command"])];
    case "paste":
      return [toKey("v", ["command"])];
    case "caseChange":
    case "wrapString":
      return [toKey("x", ["command"]), toCmd(resolveShellCommand(action)!)];
    case "sequence":
      return action.actions.flatMap(resolveActionToEvents);
    case "command":
      return [toCmd(action.ref.command)];
    case "setVar": {
      return [toVar(action.var.name, action.toggle ? "toggle" : action.value)];
    }
    default: {
      const shellCommand = resolveShellCommand(action);
      return shellCommand ? [toCmd(shellCommand)] : [];
    }
  }
}

export function resolveActionToEvents(action: Action): ToEvent[] {
  const events = resolveActionToEventsRaw(action);
  return events.map(normalizeToEvent);
}

export * from "./resolve-map";
