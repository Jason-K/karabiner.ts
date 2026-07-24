import type { Modifier } from "karabiner.ts";

// All valid Karabiner-native modifier keys
export type ModKey = Modifier;

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
// Virtual modifiers use fixed slots in vmCOCS order:
// Cmd, Opt, Ctrl, Shift. Missing modifiers are represented by "_".
export const MOD_COMBO = {
  vmCO__: ["command", "option"],
  vmC_C_: ["command", "control"],
  vmC__S: ["command", "shift"],
  vm_OC_: ["option", "control"],
  vm_O_S: ["option", "shift"],
  vm__CS: ["control", "shift"],
  vmCOC_: ["command", "option", "control"],
  vmCO_S: ["command", "option", "shift"],
  vmC_CS: ["command", "control", "shift"],
  vm_OCS: ["option", "control", "shift"],
  vmCOCS: ["command", "option", "control", "shift"],
} as const satisfies Record<string, Modifier[]>;

export type ModComboAlias = keyof typeof MOD_COMBO;

const MOD_COMBO_ALIAS_LOWER = new Map<string, ModComboAlias>(
  Object.keys(MOD_COMBO).map((key) => [
    key.toLowerCase(),
    key as ModComboAlias,
  ]),
);

export function getModComboAliasCanonicalKey(
  alias: string,
): ModComboAlias | undefined {
  return MOD_COMBO_ALIAS_LOWER.get(alias.toLowerCase());
}

export function resolveModComboAlias(alias: string): Modifier[] | undefined {
  const canonical = getModComboAliasCanonicalKey(alias);
  return canonical ? [...MOD_COMBO[canonical]] : undefined;
}

export function isModComboAlias(alias: string): boolean {
  return Boolean(getModComboAliasCanonicalKey(alias));
}
