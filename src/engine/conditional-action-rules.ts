import { ifApp, map } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import type { ModifierKey } from "../data/key-aliases";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesWithVariantManipulators } from "./rule-factory-base";

export type ConditionalActionCondition =
  | {
      type: "frontmostApp";
      bundleIds: string[];
      unless?: boolean;
    }
  | {
      type: "variable";
      name: string;
      match: "if" | "unless";
      value: string | number;
    };

export type ConditionalActionVariant = {
  when: ConditionalActionCondition[];
  actions: ActionSpec[];
  delayedAction?: {
    invoked: ActionSpec[];
    canceled: ActionSpec[];
  };
  parameters?: {
    delayedActionDelayMs?: number;
  };
};

export type ConditionalActionMapping = {
  key: string;
  modifiers: ModifierKey[];
  description: string;
  variants: ConditionalActionVariant[];
};

function toCondition(condition: ConditionalActionCondition) {
  if (condition.type === "frontmostApp") {
    const appCondition = ifApp({ bundle_identifiers: condition.bundleIds });
    return condition.unless ? appCondition.unless() : appCondition;
  }

  return {
    type: condition.match === "if" ? "variable_if" : "variable_unless",
    name: condition.name,
    value: condition.value,
  } as const;
}

export function generateConditionalActionRules(
  mappings: ReadonlyArray<ConditionalActionMapping>,
) {
  return buildRulesWithVariantManipulators({
    mappings,
    getVariants: ({ variants }) => variants,
    toDescription: ({ key, modifiers, description }) =>
      formatRuleDescription([...modifiers, key], description, "tap"),
    toManipulators: ({ key, modifiers }, variant) => {
      const builder = map(key as any, modifiers as any);

      if (variant.parameters?.delayedActionDelayMs !== undefined) {
        builder.parameters({
          "basic.to_delayed_action_delay_milliseconds":
            variant.parameters.delayedActionDelayMs,
        });
      }

      variant.when.forEach((condition) => {
        builder.condition(toCondition(condition));
      });

      variant.actions.forEach((action) => {
        resolveActionToEvents(action).forEach((e) => builder.to(e));
      });

      if (variant.delayedAction) {
        builder.toDelayedAction(
          variant.delayedAction.invoked.flatMap(resolveActionToEvents),
          variant.delayedAction.canceled.flatMap(resolveActionToEvents),
        );
      }

      return builder.build();
    },
  });
}
