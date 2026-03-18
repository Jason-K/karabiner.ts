import { ifApp, ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";

export const buildAntinoteDeleteRule = () => {
  return rule("ANTINOTE - CMD+D+D to delete note").manipulators([
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
