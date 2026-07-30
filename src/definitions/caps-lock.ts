import { VMOD } from "../core/mods";
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

export const capsLockBindings: Binding[] = [
  bind(
    from("caps_lock"),
    to(
      press(key("left_command", VMOD._OCS)),
      release(key("f15", VMOD.COCS)),
    ),
    options({
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
    }),
  ),
  bind(from("caps_lock", ["left_shift"]), to(press(key("left_command", VMOD._OC_)))),
  bind(from("caps_lock", ["left_control"]), to(press(key("left_command", VMOD._O_S)))),
  bind(from("caps_lock", ["left_option"]), to(press(key("left_command", VMOD.__CS)))),
  bind(from("caps_lock", ["left_command"]), to(press(key("left_option", VMOD.__CS)))),
  bind(
    from("caps_lock", ["left_control", "left_shift"]),
    to(press(key("left_command", ["left_option"]))),
  ),
  bind(
    from("caps_lock", ["left_control", "left_option"]),
    to(press(key("left_command", ["left_shift"]))),
  ),
  bind(
    from("caps_lock", ["left_control", "left_command"]),
    to(press(key("left_option", ["left_shift"]))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_option"]),
    to(press(key("left_control", ["left_shift"]))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_shift"]),
    to(press(key("left_option", ["left_control"]))),
  ),
  bind(
    from("caps_lock", ["left_option", "left_shift"]),
    to(press(key("left_command", ["left_control"]))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_control", "left_shift"]),
    to(press(key("left_option"))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_option", "left_shift"]),
    to(press(key("left_control"))),
  ),
  bind(
    from("caps_lock", ["left_option", "left_control", "left_shift"]),
    to(press(key("left_command"))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control"]),
    to(press(key("left_shift"))),
  ),
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control", "left_shift"]),
    to(press(key("vk_none"))),
  ),
];
