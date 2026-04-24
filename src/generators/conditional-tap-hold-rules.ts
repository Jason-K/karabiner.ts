import { ifApp, rule, toKey, withCondition } from "karabiner.ts";

import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd } from "../lib/scripts";
import { tapHold } from "../lib/tap-hold";
import type {
    ConditionalTapHoldMapping,
    TapHoldActionSpec,
} from "../mappings/special-key-holds";

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

export function buildConditionalTapHoldRules(
  mappings: ReadonlyArray<ConditionalTapHoldMapping>,
) {
  return mappings.flatMap(({ key, variants }) =>
    variants.map((variant) => {
      const manipulator = tapHold({
        key,
        alone: variant.alone.map(toTapHoldEvent),
        hold: variant.hold.map(toTapHoldEvent),
        timeoutMs: variant.timeoutMs,
        thresholdMs: variant.thresholdMs,
      }).build();

      const conditionedManipulator = variant.when
        ? withCondition(
            variant.when.unless ? ifApp(variant.when.app).unless() : ifApp(variant.when.app),
          )(manipulator).build()
        : manipulator;

      return rule(
        formatRuleDescription(key, variant.description, "hold"),
      ).manipulators(conditionedManipulator);
    }),
  );
}
