import type { VarSpec } from "../data";
import { vmod, type Binding } from "../engine";

// CAPS LOCK — modifier-chord key.
// - Tapped/released alone: emits f15 + left_command/option/control/shift
//   (calls a Hammerspoon function via combo). Fires on release-if-uninterrupted.
// - Held with no other modifiers down: emits left_command + option/control/shift
//   (COCS modifier set) for the duration of the press.
// - Held with optional modifiers physically down: emits the COCS set MINUS the
//   physically-down modifiers.

/**
 * Caps-lock signaling variables. `pressed` is set to 1 while caps is held
 * (`whileHoldVar`) so other bindings can avoid intercepting the modifier events
 * caps emits — e.g. the `left_command` multi-tap rule must NOT fire while caps
 * is held, or its `lazy` transform drops `cmd` from the caps hyper modifier.
 */
export const capsVars = {
  pressed: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
} as const satisfies Record<string, VarSpec>;

export const capsLockBindings: Binding[] = [
  ...vmod("caps_lock", [], capsVars.pressed),
  ...vmod("caps_lock", ["left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_control"], capsVars.pressed),
  ...vmod("caps_lock", ["left_option"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command"], capsVars.pressed),
  ...vmod("caps_lock", ["left_control", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_control", "left_option"], capsVars.pressed),
  ...vmod("caps_lock", ["left_control", "left_command"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_option"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_option", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_control", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_option", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_option", "left_control", "left_shift"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_option", "left_control"], capsVars.pressed),
  ...vmod("caps_lock", ["left_command", "left_option", "left_control", "left_shift"], capsVars.pressed),
];

export const capsLockBaseBindings: Binding[] = capsLockBindings.filter(
  (b) => "keys" in b.trigger && b.trigger.keys.length === 1,
);
