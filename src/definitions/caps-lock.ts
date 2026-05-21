import { HYPER, L } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import {
    generateModifierChordRules,
    type ModifierChordConfig,
} from "../engine/modifier-chord-rules";

export const capsLockChordConfig: ModifierChordConfig = {
  ruleName: formatRuleDescription(
    "caps_lock",
    "HSLauncher / Hyper / Super / Meh",
    "hold",
  ),
  base: {
    key: "caps_lock",
    description: "HSLauncher / Hyper",
    to: [
      {
        type: "key",
        key: L.cmd,
        modifiers: [L.ctrl, L.opt],
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: HYPER,
      },
    ],
    trackVar: "caps_lock_pressed",
  },
  variants: [
    {
      modifiers: [L.shift],
      description: "Super",
      to: [
        {
          type: "key",
          key: L.shift,
          modifiers: [L.cmd, L.opt, L.ctrl],
        },
      ],
    },
    {
      modifiers: [L.ctrl],
      description: "Meh",
      to: [
        {
          type: "key",
          key: L.cmd,
          modifiers: [L.opt, L.shift],
        },
      ],
    },
  ],
};

export const buildCapsLockRule = () =>
  generateModifierChordRules(capsLockChordConfig);
