import { VM_MODIFIER_ALIASES } from "../core/mods";
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
        modifiers: VM_MODIFIER_ALIASES.vm_OC_,
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: VM_MODIFIER_ALIASES.vmCOC_,
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
          modifiers: VM_MODIFIER_ALIASES.vmCOC_,
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
          modifiers: VM_MODIFIER_ALIASES.vm_O_S,
        },
      ],
    },
  ],
};

export const buildCapsLockRule = () =>
  generateModifierChordRules(capsLockChordConfig);
