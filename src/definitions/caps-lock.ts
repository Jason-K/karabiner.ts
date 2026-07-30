import type { Modifier } from "karabiner.ts";
import {
  bind,
  from,
  key,
  options,
  press,
  release,
  to,
  type Binding,
} from "../engine";

// CAPS LOCK — modifier-chord key.
// - Tapped/released alone: emits f15 + left_command/option/control/shift
//   (calls a Hammerspoon function via combo). Fires on release-if-uninterrupted.
// - Held with no other modifiers down: emits left_command + option/control/shift
//   (COCS modifier set) for the duration of the press.
// - Held with optional modifiers physically down: emits the COCS set MINUS the
//   physically-down modifiers.
//
// `modWhileDown` makes the engine emit a plain map().to().toIfAlone()
// manipulator (no to_delayed_action), matching the bespoke modifier-chord
// behavior. Modifier tokens are left_-prefixed for byte-parity with the
// known-good output.

const LEFT_COCS: Modifier[] = ["left_command", "left_option", "left_control", "left_shift"];

export const capsLockBindings: Binding[] = [
  // (no modifiers) — COCS modifier set, minus nothing
  bind(
    from("caps_lock"),
    to(
      press(key("left_command", ["left_option", "left_control", "left_shift"])),
      release(key("f15", LEFT_COCS)),
    ),
    options({
      modWhileDown: true,
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
    }),
  ),
  // +shift
  bind(
    from("caps_lock", ["left_shift"]),
    to(press(key("left_command", ["left_option", "left_control"]))),
  ),
  // +control
  bind(
    from("caps_lock", ["left_control"]),
    to(press(key("left_command", ["left_option", "left_shift"]))),
  ),
  // +option
  bind(
    from("caps_lock", ["left_option"]),
    to(press(key("left_command", ["left_control", "left_shift"]))),
  ),
  // +command
  bind(
    from("caps_lock", ["left_command"]),
    to(press(key("left_option", ["left_control", "left_shift"]))),
  ),
  // +control, shift
  bind(
    from("caps_lock", ["left_control", "left_shift"]),
    to(press(key("left_command", ["left_option"]))),
  ),
  // +control, option
  bind(
    from("caps_lock", ["left_control", "left_option"]),
    to(press(key("left_command", ["left_shift"]))),
  ),
  // +control, command
  bind(
    from("caps_lock", ["left_control", "left_command"]),
    to(press(key("left_option", ["left_shift"]))),
  ),
  // +command, option
  bind(
    from("caps_lock", ["left_command", "left_option"]),
    to(press(key("left_control", ["left_shift"]))),
  ),
  // +command, shift
  bind(
    from("caps_lock", ["left_command", "left_shift"]),
    to(press(key("left_option", ["left_control"]))),
  ),
  // +option, shift
  bind(
    from("caps_lock", ["left_option", "left_shift"]),
    to(press(key("left_command", ["left_control"]))),
  ),
  // +command, control, shift
  bind(
    from("caps_lock", ["left_command", "left_control", "left_shift"]),
    to(press(key("left_option"))),
  ),
  // +command, option, shift
  bind(
    from("caps_lock", ["left_command", "left_option", "left_shift"]),
    to(press(key("left_control"))),
  ),
  // +option, control, shift
  bind(
    from("caps_lock", ["left_option", "left_control", "left_shift"]),
    to(press(key("left_command"))),
  ),
  // +command, option, control
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control"]),
    to(press(key("left_shift"))),
  ),
  // +command, option, control, shift (all four held → emit nothing)
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control", "left_shift"]),
    to(press(key("vk_none"))),
  ),
];
