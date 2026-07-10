import { ifApp, map, toKey } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { buildRulesFromMappings } from "./rule-factory-base";

export type SimpleRemapMapping = {
  from: {
    key: string;
    modifiers?: ModKey[];
  };
  description: string;
  to: {
    key: string;
    modifiers?: ModKey[];
  };
};

export type DisabledShortcutMapping = {
  key: string;
  modifiers: ModKey[];
  description: string;
};

export function generateSimpleRemapRules(
  mappings: ReadonlyArray<SimpleRemapMapping>,
) {
  return buildRulesFromMappings({
    mappings,
    toDescription: ({ from, description }) => {
      const chord = [...(from.modifiers ?? []), from.key];
      return formatRuleDescription(chord, description, "tap");
    },
    toManipulators: ({ from, to }) =>
      map(from.key as any, (from.modifiers as any) ?? undefined)
        .to(toKey(to.key as any, (to.modifiers as any) ?? []))
        .build(),
  });
}

export function generateDisabledShortcutRules(
  mappings: ReadonlyArray<DisabledShortcutMapping>,
) {
  return buildRulesFromMappings({
    mappings,
    toDescription: ({ key, modifiers, description }) =>
      formatRuleDescription([...modifiers, key], description, "tap"),
    toManipulators: ({ key, modifiers }) =>
      map(key as any, modifiers as any).build(),
  });
}

export type AppScopedRemapMapping = {
  from: {
    key: string;
    modifiers?: ModKey[];
  };
  description: string;
  to: {
    key: string;
    modifiers?: ModKey[];
  };
  ifApp: string | string[];
};

export function generateAppScopedRemapRules(
  mappings: ReadonlyArray<AppScopedRemapMapping>,
) {
  return buildRulesFromMappings({
    mappings,
    toDescription: ({ from, description }) => {
      const chord = [...(from.modifiers ?? []), from.key];
      return formatRuleDescription(chord, description, "tap");
    },
    toManipulators: ({ from, to, ifApp: appScope }) => {
      const appIds = Array.isArray(appScope) ? appScope : [appScope];
      return map(from.key as any, (from.modifiers as any) ?? undefined)
        .condition(ifApp(appIds))
        .to(toKey(to.key as any, (to.modifiers as any) ?? undefined))
        .build();
    },
  });
}
