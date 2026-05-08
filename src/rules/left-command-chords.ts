import { ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { openApp } from "../lib/software";
import { varTapTapHold } from "../lib/tap-hold";

const LEFT_COMMAND_TAP_DELAY_MS = 500;

export const buildLeftCommandRule = () => {
  return rule(
    formatRuleDescription(
      "left_command",
      "Tap/double-tap/hold handler",
      "multi-tap",
    ),
  ).manipulators(
    varTapTapHold({
      key: "left_command",
      firstVar: "left_command_detect",
      aloneEvents: [toKey("left_command")],
      holdEvents: [
        toKey("f5", ["left_command", "left_option", "left_control"]),
      ],
      tapTapEvents: [openApp({ historyIndex: 1 })],
      thresholdMs: LEFT_COMMAND_TAP_DELAY_MS,
      allowPassThrough: true,
      description: formatRuleDescription(
        "left_command",
        "Tap/double-tap/hold handler",
        "multi-tap",
      ),
      mods: [],
    }),
  );
};

export const buildCmdQRule = () => {
  return rule(
    formatRuleDescription(["left_command", "q"], "Quit app", "multi-tap"),
  ).manipulators([
    ...map("q", "left_command")
      .condition(ifVar("command_q_pressed", 1))
      .to(toKey("q", ["left_command"]))
      .to(toSetVar("command_q_pressed", 0))
      .build(),
    ...map("q", "left_command")
      .parameters({ "basic.to_delayed_action_delay_milliseconds": 300 })
      .to(toSetVar("command_q_pressed", 1))
      .toDelayedAction(
        [toSetVar("command_q_pressed", 0)],
        [toSetVar("command_q_pressed", 0)],
      )
      .build(),
  ]);
};
