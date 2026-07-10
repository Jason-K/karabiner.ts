import type { Modifier } from "karabiner.ts";

// All valid Karabiner-native modifier keys
export type ModKey = Modifier;

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
// Virtual modifiers use fixed slots in vmCOCS order:
// Cmd, Opt, Ctrl, Shift. Missing modifiers are represented by "_".
export const MOD_COMBO = {
  vmCO__: ["left_command", "left_option"],
  vmC_C_: ["left_command", "left_control"],
  vmC__S: ["left_command", "left_shift"],
  vm_OC_: ["left_option", "left_control"],
  vm_O_S: ["left_option", "left_shift"],
  vm__CS: ["left_control", "left_shift"],
  vmCOC_: ["left_command", "left_option", "left_control"],
  vmCO_S: ["left_command", "left_option", "left_shift"],
  vmC_CS: ["left_command", "left_control", "left_shift"],
  vm_OCS: ["left_option", "left_control", "left_shift"],
  vmCOCS: ["left_command", "left_option", "left_control", "left_shift"],
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
