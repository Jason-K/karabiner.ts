import { HYPER, L } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import {
    generateModifierChordRules,
    type ModifierChordConfig,
} from "../engine/modifier-chord-rules";

export const capsLockChordConfig: ModifierChordConfig = {
  ruleName: formatRuleDescription(
    "caps_lock",
    "VM launcher / vmCOC_ / vmCOCS / vmCO_S",
    "hold",
  ),
  base: {
    key: "caps_lock",
    description: "VM launcher / vmCOC_",
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
      description: "vmCOCS",
      to: [
        {
          type: "key",
          key: L.shift,
          modifiers: ["vmCOC_"],
        },
      ],
    },
    {
      modifiers: [L.ctrl],
      description: "vmCO_S",
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
