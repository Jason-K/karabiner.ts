import { ifApp, ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";
import { formatRuleDescription } from "../lib/rule-descriptions";

export const buildAntinoteDeleteRule = () => {
  return rule(
    formatRuleDescription(["command", "d"], "Delete note", "multi-tap"),
  ).manipulators([
    ...map("d", "command")
      .condition(
        ifApp(["com.chabomakers.Antinote-setapp", "com.chabomakers.Antinote"]),
      )
      .condition(ifVar("cmd_d_ready", 1))
      .to(toKey("d", ["command"]))
      .to(toSetVar("cmd_d_ready", 0))
      .build(),
    ...map("d", "command")
      .condition(
        ifApp(["com.chabomakers.Antinote-setapp", "com.chabomakers.Antinote"]),
      )
      .condition(ifVar("cmd_d_ready", 0))
      .to(toSetVar("cmd_d_ready", 1))
      .toDelayedAction(
        [toSetVar("cmd_d_ready", 0)],
        [toSetVar("cmd_d_ready", 0)],
      )
      .build(),
  ]);
};
