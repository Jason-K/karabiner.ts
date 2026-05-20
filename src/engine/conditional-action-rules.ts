import { ifApp, map, toKey } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import { applescript, cmd } from "../core/scripts";
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

export type ConditionalAction =
  | {
      type: "key";
      key: string;
      modifiers?: string[];
      options?: {
        repeat?: boolean;
        halt?: boolean;
      };
    }
  | {
      type: "shell";
      command: string;
    }
  | {
      type: "applescript";
      scriptPath: string;
      args?: string[];
    };

export type ConditionalActionVariant = {
  when: ConditionalActionCondition[];
  actions: ConditionalAction[];
  delayedAction?: {
    invoked: ConditionalAction[];
    canceled: ConditionalAction[];
  };
  parameters?: {
    delayedActionDelayMs?: number;
  };
};

export type ConditionalActionMapping = {
  key: string;
  modifiers: string[];
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

function toAction(action: ConditionalAction) {
  if (action.type === "shell") {
    return cmd(action.command);
  }

  if (action.type === "applescript") {
    return applescript(action.scriptPath, ...(action.args ?? []));
  }

  return toKey(
    action.key as any,
    (action.modifiers as any) ?? [],
    action.options ?? {},
  );
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
        builder.to(toAction(action));
      });

      if (variant.delayedAction) {
        builder.toDelayedAction(
          variant.delayedAction.invoked.map(toAction),
          variant.delayedAction.canceled.map(toAction),
        );
      }

      return builder.build();
    },
  });
}
