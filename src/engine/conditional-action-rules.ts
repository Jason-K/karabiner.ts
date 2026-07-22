import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding, type Condition } from "./binding";

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
};

export type ConditionalActionMapping = {
  key: string;
  modifiers: ModKey[];
  description: string;
  variants: ConditionalActionVariant[];
};

function toCondition(c: ConditionalActionCondition): Condition {
  return c.type === "frontmostApp"
    ? { app: c.bundleIds, ...(c.unless ? { unless: true } : {}) }
    : { var: c.name, equals: c.value, ...(c.match === "unless" ? { unless: true } : {}) };
}

export function generateConditionalActionRules(
  mappings: ReadonlyArray<ConditionalActionMapping>,
): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: formatRuleDescription([...m.modifiers, m.key], m.description, "tap"),
      trigger: { keys: [m.key], modifiers: m.modifiers as string[] },
      cases: m.variants.map((v) => ({
        phase: "press" as const,
        conditions: v.when.map(toCondition),
        do: v.actions,
      })),
    })),
  );
}
