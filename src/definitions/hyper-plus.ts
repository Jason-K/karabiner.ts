import { HYPER } from "../core/mods";
import {
    formatSelectionCommand,
    typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS } from "../data";
import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";

export const hyperPlusMappings: ModifierLauncherMapping[] = [
  {
    key: "s",
    description: "Format selection",
    action: { type: "shell", command: formatSelectionCommand() },
  },
  {
    key: "t",
    description: "New Typinator rule",
    action: { type: "shell", command: typinatorNewRuleCommand() },
  },
  {
    key: "semicolon",
    description: "Open System Settings",
    action: { type: "shell", command: "open -a '/System/Applications/System Settings.app'" },
  },
  {
    key: "f12",
    description: "Edit last Typinator rule",
    action: { type: "shell", command: `/usr/bin/osascript ${PATHS.typinatorEditLastAppleScript}` },
  },
  {
    key: "escape",
    description: "Open Activity Monitor",
    action: { type: "shell", command: "open -a 'Activity Monitor'" },
  },
];

export const buildHyperPlusRules = () =>
  generateModifierLauncherRules({
    triggerKey: HYPER,
    triggerLabel: "hyper",
    launchers: hyperPlusMappings,
  });
