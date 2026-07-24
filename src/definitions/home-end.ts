import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["command"] }],
      },
    ],
  },
  {
    trigger: { keys: ["home"], modifiers: ["shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["command", "shift"],
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
        do: [{ type: "key", key: "right_arrow", modifiers: ["command"] }],
      },
    ],
  },
  {
    trigger: { keys: ["end"], modifiers: ["shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "right_arrow",
            modifiers: ["command", "shift"],
          },
        ],
      },
    ],
  },
];

export const buildHomeEndRule = () => defineBindings(homeEndBindings);
