import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";

export type TapAloneHoldConfig = {
  key: string;
  modifiers?: ModKey[];
  description: string;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
};

export function generateTapAloneHoldRule(config: TapAloneHoldConfig): Rule {
  const binding: Binding = {
    description: formatRuleDescription(
      config.modifiers ? [...config.modifiers, config.key] : config.key,
      config.description,
      "hold",
    ),
    trigger: { keys: [config.key], modifiers: config.modifiers as string[] | undefined },
    timing: { aloneMs: config.timeoutMs, heldThresholdMs: config.timeoutMs },
    cases: [
      { phase: "release", do: config.alone },
      { phase: "hold", do: config.hold },
    ],
  };
  return defineBindings([binding])[0]!;
}
