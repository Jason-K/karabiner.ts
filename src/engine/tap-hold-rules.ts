import { rule } from "karabiner.ts";
import type { ActionKeyModifier, ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { tapHold } from "../core/tap-hold";
import { resolveModifierAlias } from "../data/key-aliases";
import { resolveActionToEvents } from "./action-resolver";

export type TapHoldConfig = {
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  description: string;
  timeoutMs?: number;
  thresholdMs?: number;
  appOverrides?: Array<{
    app: string;
    unless?: boolean;
    alone?: ActionSpec[];
    hold?: ActionSpec[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ActionSpec[];
    invoked?: ActionSpec[];
  }>;
};

function parseKeyWithModifiers(keyString: string): {
  key: string;
  modifiers: string[];
} {
  const parts = keyString.split("+").map((p) => p.trim());
  if (parts.length === 1) {
    return { key: parts[0], modifiers: [] };
  }

  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  const normalizedModifiers = modifiers.flatMap((mod) => {
    const alias = resolveModifierAlias(mod);
    if (alias) return alias;

    const lower = mod.toLowerCase();
    switch (lower) {
      case "cmd": return ["command"];
      case "opt":
      case "alt": return ["option"];
      case "ctrl": return ["control"];
      default: return [lower];
    }
  });

  return { key, modifiers: normalizedModifiers };
}

export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  suppressionVars: string[] = [],
): any[] {

  return Object.entries(tapHoldKeys).map(([keyString, config]) => {
    const { key, modifiers } = parseKeyWithModifiers(keyString);
    const defaultAlone: ActionSpec[] = [
      {
        type: "key",
        key,
        modifiers: modifiers as ActionKeyModifier[],
        options: { halt: true },
      },
    ];
    const resolvedAlone = config.alone ?? defaultAlone;
    const resolvedHold = config.hold ?? defaultAlone;

    const manipulators = tapHold({
      key,
      alone: resolvedAlone.flatMap(resolveActionToEvents),
      hold: resolvedHold.flatMap(resolveActionToEvents),
      timeoutMs: config.timeoutMs,
      thresholdMs: config.thresholdMs,
      appOverrides: config.appOverrides?.map((override) => ({
        ...override,
        alone: override.alone?.flatMap(resolveActionToEvents),
        hold: override.hold?.flatMap(resolveActionToEvents),
        cancel: override.cancel?.flatMap(resolveActionToEvents),
        invoked: override.invoked?.flatMap(resolveActionToEvents),
      })),
    }).build();

    if (modifiers.length > 0) {
      manipulators.forEach((m: any) => {
        m.from.modifiers = m.from.modifiers || {};
        m.from.modifiers.mandatory = modifiers;
      });
    }

    if (suppressionVars.length > 0) {
      manipulators.forEach((m: any) => {
        m.conditions = m.conditions || [];
        suppressionVars.forEach((name) => {
          m.conditions.push({ type: "variable_unless", name, value: 1 });
        });
      });
    }

    return rule(
      formatRuleDescription(keyString, config.description, "hold"),
    ).manipulators(manipulators);
  });
}
