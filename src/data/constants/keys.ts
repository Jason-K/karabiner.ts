import type { Modifier } from "../../types/karabiner";

// All valid Karabiner-native modifier keys and aliases (e.g. cmd, opt, ctrl, L.cmd, R.cmd)
export type ModKey = Modifier | "cmd" | "opt" | "ctrl" | "L.cmd" | "R.cmd" | "L.opt" | "R.opt" | "L.ctrl" | "R.ctrl" | "L.shift" | "R.shift" | (string & {});

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

export const MODKEY_CODES = new Set<string>([
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

/** Known standard Karabiner key codes for auto-completion. */
export type StandardKeyCode =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"
  | "f13" | "f14" | "f15" | "f16" | "f17" | "f18" | "f19" | "f20" | "f21" | "f22" | "f23" | "f24"
  | "return_or_enter" | "escape" | "delete_or_backspace" | "delete_forward" | "tab" | "spacebar"
  | "hyphen" | "equal_sign" | "open_bracket" | "close_bracket" | "backslash" | "non_us_pound"
  | "semicolon" | "quote" | "grave_accent_and_tilde" | "comma" | "period" | "slash"
  | "caps_lock" | "print_screen" | "scroll_lock" | "pause" | "insert" | "home" | "page_up"
  | "end" | "page_down" | "right_arrow" | "left_arrow" | "down_arrow" | "up_arrow"
  | "keypad_num_lock" | "keypad_slash" | "keypad_asterisk" | "keypad_hyphen" | "keypad_plus"
  | "keypad_enter" | "keypad_1" | "keypad_2" | "keypad_3" | "keypad_4" | "keypad_5"
  | "keypad_6" | "keypad_7" | "keypad_8" | "keypad_9" | "keypad_0" | "keypad_period"
  | "keypad_equal_sign" | "left_control" | "left_shift" | "left_option" | "left_command"
  | "right_control" | "right_shift" | "right_option" | "right_command" | "fn";

/** Key code string type with IntelliSense auto-completion for standard keys. */
export type KeyCode = StandardKeyCode | (string & {});
