import type { Modifier } from "karabiner.ts";

// All valid Karabiner-native modifier keys
export type ModifierKey = Modifier;

// Virtual modifiers use fixed slots in vmCOCS order:
// Cmd, Opt, Ctrl, Shift. Missing modifiers are represented by "_".
export const VM_MODIFIER_ALIASES = {
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

export type VirtualModifierAlias = keyof typeof VM_MODIFIER_ALIASES;

// Backward-compatible aliases retained during migration.
export const HYPER: Modifier[] = [
  "left_command",
  "left_option",
  "left_control",
];
export const SUPER: Modifier[] = [
  "left_command",
  "left_option",
  "left_control",
  "left_shift",
];
export const MEH: Modifier[] = ["left_command", "left_option", "left_shift"];

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
export const MODIFIER_ALIASES = {
  ...VM_MODIFIER_ALIASES,
  hyper: VM_MODIFIER_ALIASES.vmCOC_,
  super: VM_MODIFIER_ALIASES.vmCOCS,
  meh: VM_MODIFIER_ALIASES.vmCO_S,
  // Short aliases mirroring the L/R objects, usable as quoted strings
  lcmd: ["left_command"],
  lshift: ["left_shift"],
  lopt: ["left_option"],
  lctrl: ["left_control"],
  rcmd: ["right_command"],
  rshift: ["right_shift"],
  ropt: ["right_option"],
  rctrl: ["right_control"],
} as const satisfies Record<string, Modifier[]>;

export type ModifierAlias = keyof typeof MODIFIER_ALIASES;

const MODIFIER_ALIAS_CANONICAL_BY_LOWER = new Map<string, ModifierAlias>(
  Object.keys(MODIFIER_ALIASES).map((key) => [
    key.toLowerCase(),
    key as ModifierAlias,
  ]),
);

export function getModifierAliasCanonicalKey(
  alias: string,
): ModifierAlias | undefined {
  return MODIFIER_ALIAS_CANONICAL_BY_LOWER.get(alias.toLowerCase());
}

export function resolveModifierAlias(alias: string): Modifier[] | undefined {
  const canonical = getModifierAliasCanonicalKey(alias);
  return canonical ? [...MODIFIER_ALIASES[canonical]] : undefined;
}

export function isModifierAlias(alias: string): boolean {
  return Boolean(getModifierAliasCanonicalKey(alias));
}

// Shorthand for left-side modifier keys
export const L = {
  cmd: "left_command" as const,
  opt: "left_option" as const,
  ctrl: "left_control" as const,
  shift: "left_shift" as const,
};

// Shorthand for right-side modifier keys
export const R = {
  cmd: "right_command" as const,
  opt: "right_option" as const,
  ctrl: "right_control" as const,
  shift: "right_shift" as const,
};
