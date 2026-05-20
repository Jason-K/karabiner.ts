import { map } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import { cmd, focusApp } from "../core/scripts";
import { buildRulesFromMappings } from "./rule-factory-base";

export type LauncherAction =
  | {
      type: "focusApp";
      bundleId: string;
    }
  | {
      type: "openFolder";
      path: string;
    };

export type ModifierLauncherMapping<TKey extends string = string> = {
  key: TKey;
  description: string;
  action: LauncherAction;
};

type LauncherRuleConfig<TKey extends string> = {
  triggerKey: string;
  launchers: ReadonlyArray<ModifierLauncherMapping<TKey>>;
  getOpenFolderCommand: (folderPath: string) => string;
};

function toLauncherEvent(
  action: LauncherAction,
  getOpenFolderCommand: (folderPath: string) => string,
) {
  if (action.type === "focusApp") {
    return focusApp(action.bundleId);
  }

  return cmd(getOpenFolderCommand(action.path));
}

export function generateModifierLauncherRules<TKey extends string>(
  config: LauncherRuleConfig<TKey>,
) {
  const { triggerKey, launchers, getOpenFolderCommand } = config;

  return buildRulesFromMappings({
    mappings: launchers,
    toDescription: ({ key, description }) =>
      formatRuleDescription([triggerKey, key], description, "tap"),
    toManipulators: ({ key, action }) =>
      map(key as any, triggerKey as any)
        .to(toLauncherEvent(action, getOpenFolderCommand))
        .build(),
  });
}
