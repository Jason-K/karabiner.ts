import { rule, toKey, toSetVar } from "karabiner.ts";
import { withConditions } from "../lib/conditions";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { openApp } from "../lib/software";

const LEFT_COMMAND_TAP_DELAY_MS = 500;
const LEFT_COMMAND_MAX_HISTORY_INDEX = 9;

const leftCommandAwaitingTapConditions = (tapCount: number) => [
  { type: "variable_if" as const, name: "lcmd_pressed", value: 1 },
  { type: "variable_if" as const, name: "lcmd_tap_count", value: tapCount },
  { type: "variable_unless" as const, name: "space_mod", value: 1 },
];

const resetLeftCommandTapState = (tapCount: number) => {
  const conditions = leftCommandAwaitingTapConditions(tapCount);

  return [
    withConditions(toSetVar("lcmd_pressed", 0), conditions),
    withConditions(toSetVar("lcmd_tap_count", 0), conditions),
  ];
};

export const buildLeftCommandRule = () => {
  const multiTapManipulators = Array.from(
    { length: LEFT_COMMAND_MAX_HISTORY_INDEX },
    (_, index) => {
      const tapCount = index + 2;
      const previousTapCount = tapCount - 1;

      return {
        type: "basic" as const,
        from: {
          key_code: "left_command" as any,
          modifiers: { optional: ["any"] },
        },
        conditions: leftCommandAwaitingTapConditions(previousTapCount),
        parameters: {
          "basic.to_delayed_action_delay_milliseconds":
            LEFT_COMMAND_TAP_DELAY_MS,
        },
        to: [
          { set_variable: { name: "lcmd_pressed", value: 1 } },
          { set_variable: { name: "lcmd_tap_count", value: tapCount } },
        ],
        to_delayed_action: {
          to_if_invoked: [
            withConditions(openApp({ historyIndex: tapCount - 1 }), [
              ...leftCommandAwaitingTapConditions(tapCount),
            ]),
            ...resetLeftCommandTapState(tapCount),
          ],
          to_if_canceled: [],
        },
        description: formatRuleDescription(
          "left_command",
          `App history ${tapCount - 1}`,
          "multi-tap",
        ),
      } as any;
    },
  );

  return rule(
    formatRuleDescription("left_command", "App history switcher", "multi-tap"),
  ).manipulators([
    ...multiTapManipulators,
    {
      type: "basic" as const,
      from: {
        key_code: "left_command" as any,
        modifiers: { optional: ["any"] },
      },
      conditions: [{ type: "variable_unless", name: "space_mod", value: 1 }],
      parameters: {
        "basic.to_delayed_action_delay_milliseconds": LEFT_COMMAND_TAP_DELAY_MS,
      },
      to: [
        { set_variable: { name: "lcmd_pressed", value: 1 } },
        { set_variable: { name: "lcmd_tap_count", value: 1 } },
        toKey("left_command"),
      ],
      to_delayed_action: {
        to_if_invoked: resetLeftCommandTapState(1),
        to_if_canceled: resetLeftCommandTapState(1),
      },
      description: formatRuleDescription(
        "left_command",
        "Command passthrough",
        "tap",
      ),
    } as any,
  ]);
};
