import { map, rule } from "karabiner.ts";

import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd, focusApp } from "../lib/scripts";
import type {
    LauncherAction,
    ModifierLauncherMapping,
} from "../mappings/right-option-launchers";

function toLauncherEvent(
  action: LauncherAction,
  getOpenFolderCommand: (folderPath: string) => string,
) {
  if (action.type === "focusApp") {
    return focusApp(action.bundleId);
  }

  return cmd(getOpenFolderCommand(action.path));
}

export function buildModifierLauncherRules<TKey extends string>(
  triggerKey: string,
  launchers: ReadonlyArray<ModifierLauncherMapping<TKey>>,
  getOpenFolderCommand: (folderPath: string) => string,
) {
  return launchers.map(({ key, description, action }) =>
    rule(
      formatRuleDescription([triggerKey, key], description, "tap"),
    ).manipulators([
      ...map(key as any, triggerKey as any)
        .to(toLauncherEvent(action, getOpenFolderCommand))
        .build(),
    ]),
  );
}
