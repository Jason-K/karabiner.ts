import { ifApp, toKey, withCondition } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import { cmd } from "../core/scripts";
import { tapHold } from "../core/tap-hold";
import { buildRulesWithVariantRules } from "./rule-factory-base";
import type { AppCondition } from "./variant-types";

export type KeyActionSpec = {
  type: "key";
  key: string;
  modifiers?: string[];
  options?: {
    halt?: boolean;
    repeat?: boolean;
  };
};

export type ShellActionSpec = {
  type: "shell";
  command: string;
};

export type TapHoldActionSpec = KeyActionSpec | ShellActionSpec;

export type TapHoldVariantMapping = {
  description: string;
  when?: AppCondition;
  alone: TapHoldActionSpec[];
  hold: TapHoldActionSpec[];
  timeoutMs: number;
  thresholdMs: number;
};

export type ConditionalTapHoldMapping = {
  key: string;
  variants: TapHoldVariantMapping[];
};

function toTapHoldEvent(action: TapHoldActionSpec) {
  if (action.type === "shell") {
    return cmd(action.command);
  }

  return toKey(
    action.key as any,
    (action.modifiers as any) ?? [],
    action.options ?? {},
  );
}

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
        alone: variant.alone.map(toTapHoldEvent),
        hold: variant.hold.map(toTapHoldEvent),
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
