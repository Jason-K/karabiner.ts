import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    description: "[HOME]        →    Move to line start (on tap)",
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
    description: "[←⇧HOME]        →    Select to line start (on tap)",
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
    description: "[END]        →    Move to line end (on tap)",
    trigger: { keys: ["end"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "right_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
    description: "[←⇧END]        →    Select to line end (on tap)",
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
