import { formatRuleDescription } from "../../core/rule-descriptions";
import { appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

export const zenRemapBindings: Binding[] = [
  {
    description: formatRuleDescription(
      ["left_command", "left_shift", "right_arrow"],
      "Zen command H remap",
      "tap",
    ),
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
    description: formatRuleDescription(
      ["left_command", "left_shift", "left_arrow"],
      "Zen command U remap",
      "tap",
    ),
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
