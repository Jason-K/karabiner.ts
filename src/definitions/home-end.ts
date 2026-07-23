import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
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
    trigger: { keys: ["end"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "right_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
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
