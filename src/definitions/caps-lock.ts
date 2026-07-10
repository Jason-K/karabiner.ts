import { MOD_COMBO } from "../core/mods";
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
        key: "left_command",
        modifiers: MOD_COMBO.vm_OC_,
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: MOD_COMBO.vmCOC_,
      },
    ],
    trackVar: "caps_lock_pressed",
  },
  variants: [
    {
      modifiers: ["left_shift"],
      description: "vmCOCS",
      to: [
        {
          type: "key",
          key: "left_shift",
          modifiers: MOD_COMBO.vmCOC_,
        },
      ],
    },
    {
      modifiers: ["left_control"],
      description: "vmCO_S",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: MOD_COMBO.vm_O_S,
        },
      ],
    },
  ],
};

export const buildCapsLockRule = () =>
  generateModifierChordRules(capsLockChordConfig);
