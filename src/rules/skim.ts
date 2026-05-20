import { ifApp, map, rule, toKey } from "karabiner.ts";
import { appRegistry } from "../constants";
import { L } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";
// import { applescript, cmd } from "../lib/scripts";

type SkimCommandRemap = {
  key: "h" | "u";
  description: string;
};

export const buildSkimCommandRemapRule = () => {
  const remaps: SkimCommandRemap[] = [
    {
      key: "h",
      description: "Skim command H remap",
    },
    {
      key: "u",
      description: "Skim command U remap",
    },
  ];

  return remaps.map(({ key, description }) =>
    rule(
      formatRuleDescription(["left_command", key], description, "tap"),
    ).manipulators([
      ...map(key, "left_command")
        .condition(ifApp(appRegistry.skim))
        .to(toKey(key as any, [L.cmd, L.ctrl]))
        .build(),
    ]),
  );
};
