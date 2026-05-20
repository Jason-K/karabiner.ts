import { map, rule, toKey, toSetVar } from "karabiner.ts";
import { HYPER, L } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";

export const buildCapsLockRule = () => {
  return rule(
    formatRuleDescription(
      "caps_lock",
      "HSLauncher / Hyper / Super / Meh",
      "hold",
    ),
  ).manipulators([
    ...map("caps_lock")
      .to(toSetVar("caps_lock_pressed", 1))
      .to(toKey(L.cmd, [L.ctrl, L.opt]))
      .toAfterKeyUp(toSetVar("caps_lock_pressed", 0))
      .toIfAlone(toKey("f15", HYPER))
      .description(
        formatRuleDescription("caps_lock", "HSLauncher / Hyper", "hold"),
      )
      .build(),
    ...map("caps_lock", "left_shift")
      .to(toKey(L.shift, [L.cmd, L.opt, L.ctrl]))
      .description(
        formatRuleDescription(["left_shift", "caps_lock"], "Super", "hold"),
      )
      .build(),
    ...map("caps_lock", "left_control")
      .to(toKey(L.cmd, [L.opt, L.shift]))
      .description(
        formatRuleDescription(["left_control", "caps_lock"], "Meh", "hold"),
      )
      .build(),
  ]);
};
