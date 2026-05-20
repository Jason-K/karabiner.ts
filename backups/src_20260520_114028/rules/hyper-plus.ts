import { map, rule } from "karabiner.ts";

import { HYPER } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import {
  cmd,
  formatSelectionCommand,
  typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS } from "../data";

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
    shellCommand: formatSelectionCommand(),
  },
  t: {
    mods: HYPER,
    description: "New Typinator rule",
    shellCommand: typinatorNewRuleCommand(),
  },
  semicolon: {
    mods: HYPER,
    description: "Open System Settings",
    shellCommand: "open -a '/System/Applications/System Settings.app'",
  },
  f12: {
    mods: HYPER,
    description: "Edit last Typinator rule",
    shellCommand: `/usr/bin/osascript ${PATHS.typinatorEditLastAppleScript}`,
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
