import { getOpenFolderCommand } from "../core/folder-opener";
import { HOME_DIR, appRegistry } from "../data";
import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";

export const rightOptionLaunchers: ModifierLauncherMapping<
  "a" | "b" | "c" | "e" | "f" | "m" | "o" | "t" | "w" | "8"
>[] = [
  {
    key: "a",
    description: "Antinote",
    action: { type: "focusApp", bundleId: appRegistry.antinote },
  },
  {
    key: "b",
    description: "Helium",
    action: { type: "focusApp", bundleId: appRegistry.helium },
  },
  {
    key: "c",
    description: "VS Code",
    action: { type: "focusApp", bundleId: appRegistry.code },
  },
  {
    key: "e",
    description: "Proton Mail",
    action: { type: "focusApp", bundleId: appRegistry.protonMail },
  },
  {
    key: "f",
    description: "Home folder",
    action: { type: "openFolder", path: HOME_DIR },
  },
  {
    key: "m",
    description: "Messages",
    action: { type: "focusApp", bundleId: appRegistry.messages },
  },
  {
    key: "o",
    description: "Outlook",
    action: { type: "focusApp", bundleId: appRegistry.outlook },
  },
  {
    key: "t",
    description: "Teams",
    action: { type: "focusApp", bundleId: appRegistry.teams },
  },
  {
    key: "w",
    description: "Word",
    action: { type: "focusApp", bundleId: appRegistry.word },
  },
  {
    key: "8",
    description: "RingCentral",
    action: { type: "focusApp", bundleId: appRegistry.ringCentral },
  },
];

export const buildRightOptionAppsRule = () =>
  generateModifierLauncherRules({
    triggerKey: "right_option",
    launchers: rightOptionLaunchers,
    getOpenFolderCommand,
  });
