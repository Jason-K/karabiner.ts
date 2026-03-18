import { rule, toKey, toSetVar } from "karabiner.ts";
import { toKeyCond } from "../lib/conditions";
import { openApp } from "../lib/software";

export const buildLeftCommandRule = () => {
  return rule("LCMD - left ⌘ (tap/double-tap/hold)").manipulators([
    {
      type: "basic" as const,
      from: {
        key_code: "left_command" as any,
        modifiers: { optional: ["any"] },
      },
      conditions: [
        { type: "variable_if", name: "lcmd_pressed", value: 1 },
        { type: "variable_unless", name: "space_mod", value: 1 },
      ],
      to: [
        { set_variable: { name: "lcmd_pressed", value: 0 } },
        openApp({ historyIndex: 1 }),
      ],
      description: "Left CMD second tap -> last app",
    } as any,
    {
      type: "basic" as const,
      from: {
        key_code: "left_command" as any,
        modifiers: { optional: ["any"] },
      },
      conditions: [{ type: "variable_unless", name: "space_mod", value: 1 }],
      parameters: {
        "basic.to_delayed_action_delay_milliseconds": 650,
      },
      to: [
        { set_variable: { name: "lcmd_pressed", value: 1 } },
        toKey("left_command", [], { lazy: true }),
      ],
      to_delayed_action: {
        to_if_invoked: [
          toKeyCond("left_command", [], {}, [
            { type: "variable_if", name: "lcmd_pressed", value: 1 },
          ]),
          toSetVar("lcmd_pressed", 0),
        ],
        to_if_canceled: [
          toKeyCond("left_command", [], {}, [
            { type: "variable_if", name: "lcmd_pressed", value: 1 },
          ]),
          toSetVar("lcmd_pressed", 0),
        ],
      },
      description: "Left CMD first tap (pass-through)",
    } as any,
  ]);
};
