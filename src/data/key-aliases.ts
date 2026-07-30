import type { Modifier } from "karabiner.ts";

// All valid Karabiner-native modifier keys
export type ModKey = Modifier;

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
// Virtual modifiers use fixed slots in COCS order:
// Cmd, Opt, Ctrl, Shift. Missing modifiers are represented by "_".
export const VMOD = {
  CO__: ["command", "option"],
  C_C_: ["command", "control"],
  C__S: ["command", "shift"],
  _OC_: ["option", "control"],
  _O_S: ["option", "shift"],
  __CS: ["control", "shift"],
  COC_: ["command", "option", "control"],
  CO_S: ["command", "option", "shift"],
  C_CS: ["command", "control", "shift"],
  _OCS: ["option", "control", "shift"],
  COCS: ["command", "option", "control", "shift"],
} as const satisfies Record<string, Modifier[]>;

export type ModComboAlias = keyof typeof VMOD;

export const MODIFIER_KEY_CODES = new Set<string>([
  "left_shift",
  "right_shift",
  "left_command",
  "right_command",
  "left_control",
  "right_control",
  "left_option",
  "right_option",
  "fn",
  "caps_lock",
  "shift",
  "command",
  "control",
  "option",
]);

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEY_CODES.has(key);
}


