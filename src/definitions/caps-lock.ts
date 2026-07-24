import { MOD_COMBO } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import {
  generateModifierChordRules,
  type ModifierChordConfig,
} from "../engine/modifier-chord-rules";

// !! WIP !!
// Can we use a single binding to replace all of the logic below?
// Won't this do the same thing, so long as we allow any of the modifier keys as OPTIONAL modifiers?
/*

see: https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/from/modifiers/

```MD

```JSON
{
    "description": "Change escape to tab (from.modifiers.optional)",
    "manipulators": [
        {
            "type": "basic",
            "from": {
                "key_code": "escape",
                "modifiers": {
                    "optional": ["left_shift", "left_control"]
                }
            },
            "to": [
                { "key_code": "tab" }
            ]
        }
    ]
}
```
*   The optional modifiers (`left_shift` and `left_control`) are kept in output events.
*   The event is not changed if modifiers are not included in `optional` such as `left_option`.

| Input | Output | Output Manipulated |
| --- | --- | --- |
| escape | tab | escape → tab |
| left_shift + escape | left_shift + tab | left_shift + escape → left_shift + tab |
| left_control + escape | left_control + tab | left_control + escape → left_control + tab |
| left_option + escape | left_option + escape | Not manipulated |
| left_shift + left_option + escape | left_shift + left_option + escape | Not manipulated |
```
 */

// export const capsBinding: Binding = {
//   trigger: { keys: ["caps_lock"], modifiers: [] },
//   whileHoldVar: { name: "caps_lock_pressed", varDesc: "caps lock pressed" },
//   cases: [
//     {
//       phase: "release",
//       do: [{ type: "key", key: "f15", modifiers: ["vmCOCS"] }],
//       description: "call hsLauncher",
//     },
//     {
//       phase: "press",
//       do: [{ type: "key", key: "left_command", modifiers: ["vm_OCS"] }],
//     },
//   ],
// };

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
