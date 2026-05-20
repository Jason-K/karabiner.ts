import { map, rule, toSetVar } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";

export type ModifierChordBase = {
  key: string;
  description: string;
  to: ActionSpec[];
  toIfAlone?: ActionSpec[];
  trackVar?: string;
};

export type ModifierChordVariant = {
  modifiers: string[];
  description: string;
  to: ActionSpec[];
};

export type ModifierChordConfig = {
  ruleName: string;
  base: ModifierChordBase;
  variants: ModifierChordVariant[];
};

export function generateModifierChordRules(config: ModifierChordConfig) {
  const { ruleName, base, variants } = config;

  const baseBuilder = map(base.key as any);

  if (base.trackVar) {
    baseBuilder.to(toSetVar(base.trackVar, 1));
    baseBuilder.toAfterKeyUp(toSetVar(base.trackVar, 0));
  }

  base.to.flatMap(resolveActionToEvents).forEach((e) => baseBuilder.to(e));

  if (base.toIfAlone) {
    base.toIfAlone
      .flatMap(resolveActionToEvents)
      .forEach((e) => baseBuilder.toIfAlone(e));
  }

  baseBuilder.description(
    formatRuleDescription(base.key, base.description, "hold"),
  );

  const variantManipulators = variants.flatMap((variant) => {
    const builder = map(base.key as any, variant.modifiers as any);
    variant.to.flatMap(resolveActionToEvents).forEach((e) => builder.to(e));
    builder.description(
      formatRuleDescription(
        [...variant.modifiers, base.key],
        variant.description,
        "hold",
      ),
    );
    return builder.build();
  });

  return rule(ruleName).manipulators([
    ...baseBuilder.build(),
    ...variantManipulators,
  ]) as any;
}
