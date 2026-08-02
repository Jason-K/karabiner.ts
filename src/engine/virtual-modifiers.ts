import type { Modifier } from "../types/karabiner";
import type { Binding, ModKey, VarSpec } from "../data";
import { bind, options } from "./binding-wrappers";
import { from } from "./from-action-wrappers";
import { key, press, release, to } from "./to-action-wrappers";
import { keyTokenToLabel } from "./resolve-description/rule-descriptions";
import { resolveKeyAlias } from "./utils";

/**
 * One rule for the whole modifier-chord key.
 *
 * Every `vmod()` call on the same trigger key emits another
 * modifiers-already-held variant of a single feature. Left to the default
 * one-rule-per-trigger grouping, caps lock alone produced 31 GUI rows whose
 * descriptions differed only in which modifiers had been subtracted — enough
 * noise to bury every other rule in the list. They are one row instead, and one
 * description that says what the key does rather than enumerating the
 * arithmetic.
 */
function vmodRuleGroup(triggerKey: string): { id: string; description: string } {
  const label = keyTokenToLabel(triggerKey);
  return {
    id: `vmod:${resolveKeyAlias(triggerKey)}`,
    description: [
      `[${label}]:`,
      "---",
      "\tOn Tap:",
      "\t\tAlways:\tEmit ⌘⌥⌃⇧ + 'F15'",
      "\tOn Hold:",
      "\t\tAlways:\tHold ⌘⌥⌃⇧, minus any of those modifiers already held",
    ].join("\n"),
  };
}

export function vmod(
  triggerKey: string,
  subtractiveModifiers: ModKey[] = [],
  whileHoldVar?: VarSpec,
): Binding[] {
  const resolvedSubtractive = subtractiveModifiers.map(
    (m) => resolveKeyAlias(m) as Modifier,
  );
  const cocs: Modifier[] = [
    "left_command",
    "left_option",
    "left_control",
    "left_shift",
  ];
  const remaining = cocs.filter((m) => !resolvedSubtractive.includes(m));

  let primaryKey = "vk_none";
  let otherMods: Modifier[] = [];
  if (remaining.length > 0) {
    primaryKey = remaining[0]!;
    otherMods = remaining.slice(1);
  }

  const keyAction = press(
    key(primaryKey as any, otherMods as any, { repeat: true }),
  );
  const opts = options({
    modWhileDown: true,
    ruleGroup: vmodRuleGroup(triggerKey),
    ...(whileHoldVar ? { whileHoldVar } : {}),
  });

  if (resolvedSubtractive.length === 0) {
    return [
      bind(
        from(triggerKey as any),
        to(keyAction, release(key("f15", cocs, { repeat: true }))),
        opts,
      ),
    ];
  }

  return [
    bind(from(triggerKey as any, resolvedSubtractive), to(keyAction), opts),
    bind(
      from([triggerKey as any, ...resolvedSubtractive]),
      to(keyAction),
      opts,
    ),
  ];
}
