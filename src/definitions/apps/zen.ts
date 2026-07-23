import { appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

export const zenRemapBindings: Binding[] = [
  {
    trigger: { keys: ["right_arrow"], modifiers: ["left_command", "left_shift"] },
    conditions: [{ app: appRegistry.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "close_bracket",
            modifiers: ["left_command", "left_shift"],
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["left_arrow"], modifiers: ["left_command", "left_shift"] },
    conditions: [{ app: appRegistry.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "open_bracket",
            modifiers: ["left_command", "left_shift"],
          },
        ],
      },
    ],
  },
];

export const buildZenCommandRemapRule = () => defineBindings(zenRemapBindings);
