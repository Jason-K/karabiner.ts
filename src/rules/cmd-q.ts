import { ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";
import { formatRuleDescription } from "../lib/rule-descriptions";

export const buildCmdQRule = () => {
  return rule(
    formatRuleDescription(["command", "q"], "Quit app", "multi-tap"),
  ).manipulators([
    ...map("q", "command")
      .condition(ifVar("command_q_pressed", 1))
      .to(toKey("q", ["command"]))
      .to(toSetVar("command_q_pressed", 0))
      .build(),
    ...map("q", "command")
      .parameters({ "basic.to_delayed_action_delay_milliseconds": 300 })
      .to(toSetVar("command_q_pressed", 1))
      .toDelayedAction(
        [toSetVar("command_q_pressed", 0)],
        [toSetVar("command_q_pressed", 0)],
      )
      .build(),
  ]);
};
