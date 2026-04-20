import { map, rule } from "karabiner.ts";

import { HYPER } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd } from "../lib/scripts";

type HyperShellRuleKey = Parameters<typeof map>[0];

type HyperShellRuleDefinition = {
  mods: typeof HYPER;
  description: string;
  shellCommand: string;
};

const buildHyperShellRule = (
  key: HyperShellRuleKey,
  config: HyperShellRuleDefinition,
) => {
  return rule(
    formatRuleDescription(["hyper", String(key)], config.description, "tap"),
  ).manipulators([
    ...map(key, config.mods).to(cmd(config.shellCommand)).build(),
  ]);
};

const hyperShellRules = {
  s: {
    mods: HYPER,
    description: "Format selection",
    shellCommand: "/opt/homebrew/bin/hs -c 'FormatSelection()'",
  },
  t: {
    mods: HYPER,
    description: "New Typinator rule",
    shellCommand:
      "~/.venv/typinator/bin/python ~/Scripts/apps/Typinator/new_rule.py",
  },
  semicolon: {
    mods: HYPER,
    description: "Open System Settings",
    shellCommand: "open -a '/System/Applications/System Settings.app'",
  },
  f12: {
    mods: HYPER,
    description: "Edit last Typinator rule",
    shellCommand:
      "/usr/bin/osascript /Users/jason/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.applescript",
  },
  escape: {
    mods: HYPER,
    description: "Open Activity Monitor",
    shellCommand: "open -a 'Activity Monitor'",
  },
} as const satisfies Record<string, HyperShellRuleDefinition>;

export const buildHyperPlusRules = () =>
  (Object.entries(hyperShellRules) as Array<[HyperShellRuleKey, HyperShellRuleDefinition]>).map(
    ([key, config]) => buildHyperShellRule(key, config),
  );
