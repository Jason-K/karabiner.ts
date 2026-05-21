import { ifApp, rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import type { ModifierKey } from "../data/key-aliases";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";

export type PointerRemapConfig = {
  button: string;
  modifiers?: ModifierKey[];
  description: string;
  to: ActionSpec[];
  ifApp?: string | string[];
};

export function generatePointerRemapRule(config: PointerRemapConfig) {
  const { button, modifiers, description, to, ifApp: appScope } = config;

  const toEvents = to.flatMap(resolveActionToEvents);

  const from: Record<string, unknown> = { pointing_button: button };
  if (modifiers?.length) {
    from.modifiers = { mandatory: modifiers };
  }

  const conditions: unknown[] = [];
  if (appScope) {
    const appIds = Array.isArray(appScope) ? appScope : [appScope];
    conditions.push(ifApp(appIds).build());
  }

  const ruleDescription = formatRuleDescription(button, description, "tap");

  const manipulator: Record<string, unknown> = {
    type: "basic",
    from,
    to: toEvents,
    description: ruleDescription,
  };
  if (conditions.length) {
    manipulator.conditions = conditions;
  }

  return rule(ruleDescription).manipulators([manipulator as any]) as any;
}
