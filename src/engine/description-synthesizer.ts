import type { ActionSpec } from "../core/action-dsl";
import { keyTokenToLabel, modifierTokenToSymbols } from "../core/rule-descriptions";
import { expandModifiers } from "./action-resolver";

/** Append ` | actionDesc` when the action carries a nuance label. */
function withActionDesc(base: string, actionDesc?: string): string {
  return actionDesc ? `${base} | ${actionDesc}` : base;
}

function describeKeyAction(action: Extract<ActionSpec, { type: "key" }>): string {
  const keyLabel = keyTokenToLabel(action.key);
  const mods = action.modifiers?.length
    ? expandModifiers(action.modifiers as string[]).map(modifierTokenToSymbols).join("")
    : "";
  return mods ? `Emit '${keyLabel}'+${mods}` : `Emit '${keyLabel}'`;
}

/** Single-line human description for one action (spec §5 templates). */
export function describeAction(action: ActionSpec): string {
  switch (action.type) {
    case "app": {
      const verb =
        action.mode === "focus" ? "focus" : action.mode === "shell" ? "open-shell" : "open";
      return withActionDesc(`${verb} ${action.ref.refDesc}`, action.actionDesc);
    }
    case "appHistory":
      return `Go back ${action.index} apps`;
    case "folder":
      return withActionDesc(`open '${action.ref.refDesc}'`, action.actionDesc);
    case "raycast":
      return withActionDesc(`Call '${action.ref.refDesc}'`, action.actionDesc);
    case "cleanShot":
      return `${action.ref.refDesc} using CSX`;
    case "command":
      return withActionDesc(`Run command '${action.ref.refDesc}'`, action.actionDesc);
    case "actHere":
      return `Context action: ${action.action}`;
    case "caseChange":
      return `Change case to ${action.operation}`;
    case "wrapString":
      return `Wrap selection in ${action.operation}`;
    case "key":
      return withActionDesc(describeKeyAction(action), action.actionDesc);
    case "url":
      return withActionDesc(`Open '${action.url}'`, action.actionDesc);
    case "shell":
      return withActionDesc(`Run '${action.command}'`, action.actionDesc);
    case "python":
      return withActionDesc(`Run python '${action.scriptPath}'`, action.actionDesc);
    case "osascript":
      return withActionDesc(`Run osascript '${action.scriptPath}'`, action.actionDesc);
    case "cut":
      return "Cut selection";
    case "copy":
      return "Copy selection";
    case "paste":
      return "Paste selection";
    case "noop":
      return "No operation";
    case "sequence":
      return action.actions.map(describeAction).join(" then ");
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
