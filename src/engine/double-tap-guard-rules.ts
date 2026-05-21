import { ifApp, ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModifierKey } from "../data/key-aliases";

export type DoubleTapGuardConfig = {
  key: string;
  modifiers: ModifierKey[];
  description: string;
  ifApp?: string | string[];
  timeoutMs?: number;
};

function normalizeModifier(mod: ModifierKey): string {
  const base = mod.replace(/^(left|right)_/, "");
  const aliases: Record<string, string> = {
    command: "cmd",
    control: "ctrl",
    option: "opt",
  };
  return aliases[base] ?? base;
}

function deriveGuardVar(key: string, modifiers: ModifierKey[]): string {
  const primaryMod = modifiers[0] ? normalizeModifier(modifiers[0]) : "none";
  return `guard_${primaryMod}_${key}`;
}

export function generateDoubleTapGuardRule(config: DoubleTapGuardConfig) {
  const { key, modifiers, description, ifApp: appScope, timeoutMs } = config;
  const varName = deriveGuardVar(key, modifiers);

  const appCondition = appScope
    ? ifApp(Array.isArray(appScope) ? appScope : [appScope])
    : null;

  // Second press: fire real key combo, reset var
  const secondPressBuilder = map(key as any, modifiers as any).condition(
    ifVar(varName, 1),
  );
  if (appCondition) secondPressBuilder.condition(appCondition);
  secondPressBuilder
    .to(toKey(key as any, modifiers as any))
    .to(toSetVar(varName, 0));

  // First press: set var, delayed action resets var
  const firstPressBuilder = map(key as any, modifiers as any);
  if (timeoutMs !== undefined) {
    firstPressBuilder.parameters({
      "basic.to_delayed_action_delay_milliseconds": timeoutMs,
    });
  }
  if (appCondition) firstPressBuilder.condition(appCondition);
  firstPressBuilder
    .condition(ifVar(varName, 0))
    .to(toSetVar(varName, 1))
    .toDelayedAction([toSetVar(varName, 0)], [toSetVar(varName, 0)]);

  const ruleDescription = formatRuleDescription(
    [...modifiers, key],
    description,
    "multi-tap",
  );

  return rule(ruleDescription).manipulators([
    ...secondPressBuilder.build(),
    ...firstPressBuilder.build(),
  ]) as any;
}
