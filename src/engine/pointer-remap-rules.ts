import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";

export type PointerRemapConfig = {
  button: string;
  modifiers?: ModKey[];
  description: string;
  to: ActionSpec[];
  ifApp?: string | string[];
};

export function generatePointerRemapRule(config: PointerRemapConfig): Rule {
  const { button, modifiers, description, to, ifApp: appScope } = config;

  const binding: Binding = {
    description: formatRuleDescription(button, description, "tap"),
    trigger: {
      pointer: button,
      ...(modifiers?.length ? { modifiers: modifiers as string[] } : {}),
    },
    ...(appScope ? { conditions: [{ app: appScope }] } : {}),
    cases: [{ phase: "press", do: to }],
  };
  return defineBindings([binding])[0]!;
}
