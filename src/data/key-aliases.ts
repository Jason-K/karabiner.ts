import type { Modifier } from "karabiner.ts";

// NOTE: naming intentionally diverges from upstream karabiner.ts conventions:
//   upstream "Meh"        = option+control+shift        (3-key)
//   upstream "Hyper"      = cmd+option+control+shift    (4-key)
//
//   This project uses:
//   MEH   = cmd+option+shift         (no ctrl — easier modifier combo)
//   HYPER = cmd+option+control       (3-key, no shift)
//   SUPER = cmd+option+control+shift (4-key, equiv to upstream Hyper)
export const HYPER: Modifier[] = ["command", "option", "control"];
export const SUPER: Modifier[] = ["command", "option", "control", "shift"];
export const MEH: Modifier[] = ["command", "option", "shift"];

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
export const MODIFIER_ALIASES: Record<string, string[]> = {
  hyper: HYPER,
  super: SUPER,
  meh: MEH,
};

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
