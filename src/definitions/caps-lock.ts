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
    // VMOD = CMD+OPT+CTRL+SHIFT
    // CAPSLOCK = VMOD
    // CAPSLOCK + MOD = VMOD-MODS (e.g., CAPS+SHIFT=CMD+OPT+CTRL; CAPS+CTRL+SHIFT=CMD+OPT)
    key: "caps_lock",
    description: "VM launcher / vmCOCS",
    to: [
      {
        type: "key",
        key: "left_command",
        modifiers: MOD_COMBO.vm_OCS,
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: MOD_COMBO.vmCOCS,
      },
    ],
    trackVar: "caps_lock_pressed",
  },
  variants: [
    {
      modifiers: ["left_shift"],
      description: "vmCOC_",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: MOD_COMBO.vm_OC_,
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
    {
      modifiers: ["left_option"],
      description: "vmC_CS",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: MOD_COMBO.vm__CS,
        },
      ],
    },
    {
      modifiers: ["left_command"],
      description: "vm_OCS",
      to: [
        {
          type: "key",
          key: "left_option",
          modifiers: MOD_COMBO.vm__CS,
        },
      ],
    },
    {
      modifiers: ["left_control", "left_shift"],
      description: "vmCO__",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: ["left_option"],
        },
      ],
    },
    {
      modifiers: ["left_control", "left_option"],
      description: "vmC__S",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: ["left_shift"],
        },
      ],
    },
    {
      modifiers: ["left_control", "left_command"],
      description: "vm_O_S",
      to: [
        {
          type: "key",
          key: "left_option",
          modifiers: ["left_shift"],
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option"],
      description: "vm__CS",
      to: [
        {
          type: "key",
          key: "left_control",
          modifiers: ["left_shift"],
        },
      ],
    },
    {
      modifiers: ["left_command", "left_shift"],
      description: "vm_OC_",
      to: [
        {
          type: "key",
          key: "left_option",
          modifiers: ["left_control"],
        },
      ],
    },
    {
      modifiers: ["left_option", "left_shift"],
      description: "vmC_C_",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: ["left_control"],
        },
      ],
    },
    {
      modifiers: ["left_command", "left_control", "left_shift"],
      description: "vm_O__",
      to: [
        {
          type: "key",
          key: "left_option",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_shift"],
      description: "vm__C_",
      to: [
        {
          type: "key",
          key: "left_control",
        },
      ],
    },
    {
      modifiers: ["left_option", "left_control", "left_shift"],
      description: "vmC___",
      to: [
        {
          type: "key",
          key: "left_command",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_control"],
      description: "vm___S",
      to: [
        {
          type: "key",
          key: "left_shift",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_control", "left_shift"],
      description: "vm____",
      to: [
        {
          type: "key",
          key: "vk_none",
        },
      ],
    },
  ],
};

export const buildCapsLockRule = () =>
  generateModifierChordRules(capsLockChordConfig);
