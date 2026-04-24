import { buildModifierLauncherRules } from "../generators";
import { rightOptionLaunchers } from "../mappings";

export const buildRightOptionAppsRule = (
  getOpenFolderCommand: (folderPath: string) => string,
) => {
  return buildModifierLauncherRules(
    "right_option",
    rightOptionLaunchers,
    getOpenFolderCommand,
  );
};
