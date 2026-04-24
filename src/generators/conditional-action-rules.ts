import { ifApp, map, rule, toKey } from "karabiner.ts";

import { formatRuleDescription } from "../lib/rule-descriptions";
import { applescript, cmd } from "../lib/scripts";
import type {
    ConditionalAction,
    ConditionalActionCondition,
    ConditionalActionMapping,
} from "../mappings/security-actions";

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

export function buildConditionalActionRules(
  mappings: ReadonlyArray<ConditionalActionMapping>,
) {
  return mappings.map(({ key, modifiers, description, variants }) =>
    rule(formatRuleDescription([...modifiers, key], description, "tap")).manipulators(
      variants.flatMap((variant) => {
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
      }),
    ),
  );
}
