import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding } from "./binding";

export type TapHoldVariantMapping = {
  description: string;
  when?: { app: string; unless?: boolean };
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
  thresholdMs: number;
};

export type ConditionalTapHoldMapping = {
  key: string;
  variants: TapHoldVariantMapping[];
};

export function generateConditionalTapHoldRules(
  mappings: ReadonlyArray<ConditionalTapHoldMapping>,
): Rule[] {
  const bindings: Binding[] = mappings.flatMap(({ key, variants }) =>
    variants.map<Binding>((v) => ({
      description: formatRuleDescription(key, v.description, "hold"),
      trigger: { keys: [key] },
      timing: { aloneMs: v.timeoutMs, heldThresholdMs: v.thresholdMs },
      ...(v.when
        ? { conditions: [{ app: v.when.app, ...(v.when.unless ? { unless: true } : {}) }] }
        : {}),
      cases: [
        { phase: "release", do: v.alone },
        { phase: "hold", do: v.hold },
      ],
    })),
  );
  return defineBindings(bindings);
}
