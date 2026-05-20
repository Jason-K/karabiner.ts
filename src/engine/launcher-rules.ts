import { map } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesFromMappings } from "./rule-factory-base";

export type ModifierLauncherMapping<TKey extends string = string> = {
  key: TKey;
  description: string;
  action: ActionSpec;
};

type LauncherRuleConfig<TKey extends string> = {
  triggerKey: string | string[];
  triggerLabel?: string;
  launchers: ReadonlyArray<ModifierLauncherMapping<TKey>>;
};

export function generateModifierLauncherRules<TKey extends string>(
  config: LauncherRuleConfig<TKey>,
) {
  const { triggerKey, triggerLabel, launchers } = config;
  const descriptionTrigger = triggerLabel ?? triggerKey;

  return buildRulesFromMappings({
    mappings: launchers,
    toDescription: ({ key, description }) =>
      formatRuleDescription(
        Array.isArray(descriptionTrigger)
          ? [...descriptionTrigger, key]
          : [descriptionTrigger, key],
        description,
        "tap",
      ),
    toManipulators: ({ key, action }) => {
      const builder = map(key as any, triggerKey as any);
      resolveActionToEvents(action).forEach((e) => builder.to(e));
      return builder.build();
    },
  });
}
