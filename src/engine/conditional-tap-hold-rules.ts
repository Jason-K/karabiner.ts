import { ifApp, withCondition } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { tapHold } from "../core/tap-hold";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesWithVariantRules } from "./rule-factory-base";
import type { AppCondition } from "./variant-types";

export type TapHoldVariantMapping = {
  description: string;
  when?: AppCondition;
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
) {
  return buildRulesWithVariantRules({
    mappings,
    getVariants: ({ variants }) => variants,
    toDescription: ({ key }, variant) =>
      formatRuleDescription(key, variant.description, "hold"),
    toManipulators: ({ key }, variant) => {
      const manipulator = tapHold({
        key,
        alone: variant.alone.flatMap(resolveActionToEvents),
        hold: variant.hold.flatMap(resolveActionToEvents),
        timeoutMs: variant.timeoutMs,
        thresholdMs: variant.thresholdMs,
      }).build();

      if (variant.when) {
        const conditionedManipulator = withCondition(
          variant.when.unless
            ? ifApp(variant.when.app).unless()
            : ifApp(variant.when.app),
        )(manipulator).build();
        return conditionedManipulator;
      }

      return manipulator;
    },
  });
}
