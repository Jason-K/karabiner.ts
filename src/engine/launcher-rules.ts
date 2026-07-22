import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding } from "./binding";

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
): Rule[] {
  const { triggerKey, triggerLabel, launchers } = config;
  const descriptionTrigger = triggerLabel ?? triggerKey;
  const modifiers = Array.isArray(triggerKey) ? triggerKey : [triggerKey];

  return defineBindings(
    launchers.map<Binding>((l) => ({
      description: formatRuleDescription(
        Array.isArray(descriptionTrigger)
          ? [...descriptionTrigger, l.key]
          : [descriptionTrigger, l.key],
        l.description,
        "tap",
      ),
      trigger: { keys: [l.key], modifiers },
      cases: [{ phase: "press", do: [l.action] }],
    })),
  );
}
