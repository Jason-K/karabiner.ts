import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    description: formatRuleDescription(["home"], "Move to line start", "tap"),
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
    description: formatRuleDescription(
      ["left_shift", "home"],
      "Select to line start",
      "tap",
    ),
    trigger: { keys: ["home"], modifiers: ["left_shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["left_command", "left_shift"],
          },
        ],
      },
    ],
  },
  {
    description: formatRuleDescription(["end"], "Move to line end", "tap"),
    trigger: { keys: ["end"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "right_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
    description: formatRuleDescription(
      ["left_shift", "end"],
      "Select to line end",
      "tap",
    ),
    trigger: { keys: ["end"], modifiers: ["left_shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "right_arrow",
            modifiers: ["left_command", "left_shift"],
          },
        ],
      },
    ],
  },
];

export const buildHomeEndRule = () => defineBindings(homeEndBindings);
