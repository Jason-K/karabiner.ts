import type { Modifier } from "karabiner.ts";
import type { Binding, ModKey, VarSpec } from "../data";
import { bind, options } from "./binding-wrappers";
import { from } from "./from-action-wrappers";
import { key, press, release, to } from "./to-action-wrappers";
import { resolveKeyAlias } from "./utils";

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
