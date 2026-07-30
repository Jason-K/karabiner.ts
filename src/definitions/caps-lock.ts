import { VMOD } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import { type ModifierChordConfig } from "../engine/modifier-chord-rules";



export const capsLockChordConfig: ModifierChordConfig = {
  ruleName: formatRuleDescription(
    "caps_lock",
    "VM launcher / COC_ / COCS / CO_S",
    "hold",
  ),
  base: {
    // VMOD = CMD+OPT+CTRL+SHIFT
    // CAPSLOCK = VMOD
    // CAPSLOCK + MOD = VMOD-MODS (e.g., CAPS+SHIFT=CMD+OPT+CTRL; CAPS+CTRL+SHIFT=CMD+OPT)
    key: "caps_lock",
    description: "VM launcher / COCS",
    to: [
      {
        type: "key",
        key: "left_command",
        modifiers: VMOD._OCS,
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: VMOD.COCS,
      },
    ],
    trackVar: "caps_lock_pressed",
  },
  variants: [
    {
      modifiers: ["left_shift"],
      description: "COC_",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: VMOD._OC_,
        },
      ],
    },
    {
      modifiers: ["left_control"],
      description: "CO_S",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: VMOD._O_S,
        },
      ],
    },
    {
      modifiers: ["left_option"],
      description: "C_CS",
      to: [
        {
          type: "key",
          key: "left_command",
          modifiers: VMOD.__CS,
        },
      ],
    },
    {
      modifiers: ["left_command"],
      description: "_OCS",
      to: [
        {
          type: "key",
          key: "left_option",
          modifiers: VMOD.__CS,
        },
      ],
    },
    {
      modifiers: ["left_control", "left_shift"],
      description: "CO__",
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
      description: "C__S",
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
      description: "_O_S",
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
      description: "__CS",
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
      description: "_OC_",
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
      description: "C_C_",
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
      description: "_O__",
      to: [
        {
          type: "key",
          key: "left_option",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_shift"],
      description: "__C_",
      to: [
        {
          type: "key",
          key: "left_control",
        },
      ],
    },
    {
      modifiers: ["left_option", "left_control", "left_shift"],
      description: "C___",
      to: [
        {
          type: "key",
          key: "left_command",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_control"],
      description: "___S",
      to: [
        {
          type: "key",
          key: "left_shift",
        },
      ],
    },
    {
      modifiers: ["left_command", "left_option", "left_control", "left_shift"],
      description: "____",
      to: [
        {
          type: "key",
          key: "vk_none",
        },
      ],
    },
  ],
};



