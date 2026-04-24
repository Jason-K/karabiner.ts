import { map, rule, toKey } from "karabiner.ts";

import { formatRuleDescription } from "../lib/rule-descriptions";
import type {
    DisabledShortcutMapping,
} from "../mappings/disabled-shortcuts";
import type { SimpleRemapMapping } from "../mappings/navigation";

export function buildSimpleRemapRules(
  mappings: ReadonlyArray<SimpleRemapMapping>,
) {
  return mappings.map(({ from, description, to }) => {
    const chord = [...(from.modifiers ?? []), from.key];

    return rule(formatRuleDescription(chord, description, "tap")).manipulators([
      ...map(from.key as any, (from.modifiers as any) ?? undefined)
        .to(toKey(to.key as any, (to.modifiers as any) ?? []))
        .build(),
    ]);
  });
}

export function buildDisabledShortcutRules(
  mappings: ReadonlyArray<DisabledShortcutMapping>,
) {
  return mappings.map(({ key, modifiers, description }) =>
    rule(
      formatRuleDescription([...modifiers, key], description, "tap"),
    ).manipulators([...map(key as any, modifiers as any).build()]),
  );
}
