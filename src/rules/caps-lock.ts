import { map, rule, toKey, toSetVar } from "karabiner.ts";
import { HYPER, L } from "../lib/mods";

export const buildCapsLockRule = () => {
  return rule(
    "CAPS - HSLAUNCHER (alone), HYPER (hold), SUPER (with shift), MEH (with ctrl)",
  ).manipulators([
    ...map("caps_lock")
      .to(toSetVar("caps_lock_pressed", 1))
      .to(toKey(L.cmd, [L.ctrl, L.opt]))
      .toAfterKeyUp(toSetVar("caps_lock_pressed", 0))
      .toIfAlone(toKey("f15", HYPER))
      .description("CAPS - HSLAUNCHER (alone), HYPER (hold)")
      .build(),
    ...map("caps_lock", "left_shift")
      .to(toKey(L.shift, [L.cmd, L.opt, L.ctrl]))
      .description("CAPS + Shift = SUPER")
      .build(),
    ...map("caps_lock", "left_control")
      .to(toKey(L.cmd, [L.opt, L.shift]))
      .description("CAPS + Ctrl = MEH")
      .build(),
  ]);
};
