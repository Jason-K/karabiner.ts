import { APP_BUNDLES } from "../data";
import { defineBindings, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledHotkeys: Binding[] = [
  {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["h"], modifiers: ["left_command", "option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["m"], modifiers: ["left_command", "option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["d"], modifiers: ["left_command"] },
    conditions: [{ app: APP_BUNDLES.antinote }],
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
];

export const buildDisabledHotkeys = () => defineBindings(disabledHotkeys);
