import type { ActionSpec } from "../core/action-dsl";
import { keyTokenToLabel, modifierTokenToSymbols } from "../core/rule-descriptions";
import { resolveButton } from "../data/mouse";
import type { Binding, Condition, Phase, Trigger } from "./binding";
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
    case "setVar":
      return `Set ${action.var.varDesc}`;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

type AppCondition = Extract<Condition, { app: unknown }>;
type VarCondition = Extract<Condition, { var: unknown }>;

function describeAppCondition(app: AppCondition["app"], unless?: boolean): string {
  const refs = Array.isArray(app) ? app : [app];
  const names = refs.map((r) => r.refDesc).join("/");
  return unless ? `Outside ${names}` : `In ${names}`;
}

/** Human label for one condition group (spec §6). Empty group -> "Always". */
export function describeConditionGroup(conditions: Condition[] | undefined): string {
  if (!conditions?.length) return "Always";
  const parts = conditions.map((c) => {
    if ("app" in c) return describeAppCondition(c.app, c.unless);
    if ("var" in c) {
      const v: VarCondition = c;
      return v.unless ? `not ${v.var.varDesc}` : v.var.varDesc;
    }
    const d = c as Extract<Condition, { device: unknown }>;
    return d.unless ? `not on ${d.device.deviceDesc}` : `on ${d.device.deviceDesc}`;
  });
  return parts.join(" and ");
}

/**
 * The `[TRIGGER]:` segment (spec §7). Reuses the key→symbol mapping from
 * rule-descriptions. Pointer triggers render as `Click:` (button1) / `Pointer <x>:`.
 * `SimOrder`-augmented rendering (strict key-down sequences, upWhen notes) is
 * intentionally minimal here: no Phase 2 binding uses a simultaneous trigger, so
 * the basic `]+[` join is complete for this phase; Phase 3 (simultaneous
 * migration) extends it.
 */
export function describeTrigger(trigger: Trigger): string {
  const modSymbols = (mods?: string[]) =>
    mods?.length ? mods.map(modifierTokenToSymbols).join("") : "";
  if ("pointer" in trigger) {
    const symbols = modSymbols(trigger.modifiers);
    const { desc } = resolveButton(trigger.pointer);
    return symbols ? `[${symbols}]+${desc}:` : `${desc}:`;
  }
  const segments: string[] = [];
  const symbols = modSymbols(trigger.modifiers);
  if (symbols) segments.push(`[${symbols}]`);
  for (const k of trigger.keys) segments.push(`[${keyTokenToLabel(k)}]`);
  return `${segments.join("+")}:`;
}

function bucketFor(tapCount: number, phase: Phase): string {
  if (tapCount === 1 && (phase === "press" || phase === "release")) return "On Tap";
  if (tapCount === 1 && phase === "hold") return "On Hold";
  if (tapCount >= 2 && (phase === "press" || phase === "release")) return "On Double Tap";
  return "On Double Tap Hold";
}

/**
 * Rich multi-line rule description (spec §9). Layout:
 *   [TRIGGER]:\n---\n\t<Phase>:\n\t\t<conditionLabel>:\t<actionLine>
 * Phases emitted in fixed order (On Tap, On Hold, On Double Tap, On Double Tap
 * Hold); empty phases omitted. Per-case conditionLabel combines hoisted
 * binding.conditions + the case's own conditions. Case.description, when set,
 * overrides the derived action line verbatim.
 */
export function synthesizeRuleDescription(binding: Binding): string {
  const buckets = new Map<string, number[]>();
  for (const label of ["On Tap", "On Hold", "On Double Tap", "On Double Tap Hold"]) {
    buckets.set(label, []);
  }
  binding.cases.forEach((c, i) => {
    buckets.get(bucketFor(c.tapCount ?? 1, c.phase ?? "press"))!.push(i);
  });

  const sections: string[] = [];
  for (const [label, idxs] of buckets) {
    if (!idxs.length) continue;
    const lines = idxs.map((i) => {
      const c = binding.cases[i]!;
      const condLabel = describeConditionGroup([
        ...(binding.conditions ?? []),
        ...(c.conditions ?? []),
      ]);
      const actionLine = c.description ?? c.do.map(describeAction).join(" then ");
      return `\t\t${condLabel}:\t${actionLine}`;
    });
    sections.push(`\t${label}:\n${lines.join("\n")}`);
  }
  return `${describeTrigger(binding.trigger)}\n---\n${sections.join("\n")}`;
}

/**
 * Per-manipulator slice-label (spec §9): the condition-group's short label.
 * Returns undefined for the single unconditional group so the manipulator's
 * `description` field is omitted entirely.
 */
export function synthesizeManipulatorLabel(
  conditions: Condition[] | undefined,
): string | undefined {
  if (!conditions?.length) return undefined;
  return describeConditionGroup(conditions);
}
