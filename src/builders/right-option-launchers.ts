import { buildModifierLauncherRules } from "../generators";
import { rightOptionLaunchers } from "../mappings";

export const buildRightOptionAppsRule = (
  getOpenFolderCommand: (folderPath: string) => string,
) => {
  return buildModifierLauncherRules({
    triggerKey: "right_option",
    launchers: rightOptionLaunchers,
    getOpenFolderCommand,
  });
};
