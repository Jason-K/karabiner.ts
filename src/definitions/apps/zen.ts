import { Apps } from "../../data";
import { MOD_COMBO } from "../../data/key-aliases";
import { defineBindings, type Binding } from "../../engine";

export const zenRemapBindings: Binding[] = [
  {
    trigger: { keys: ["right_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: Apps.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "close_bracket",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["left_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: Apps.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "open_bracket",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
];

export const buildZenCommandRemapRule = () => defineBindings(zenRemapBindings);
