// User edit surface: modify files in this directory to customize your Karabiner config.

import type { TapHoldConfig } from "../engine";
import { antinoteTapHoldMappings } from "./apps/antinote";
import { hyperTapHoldMappings } from "./hyper";
import { leftCommandTapHoldMappings } from "./left-command";
import { rightOptionTapHoldMappings } from "./right-option";
import { singleKeyTapHoldMappings } from "./single-key";

export { buildAntinoteRules } from "./apps/antinote";
export { buildOnePieceClickEnterRule } from "./apps/onepiece";
export { buildSkimCommandRemapRule } from "./apps/skim";
export { buildWordPrivilegesRule } from "./apps/word";
export { buildZenCommandRemapRule } from "./apps/zen";
export { buildCapsLockRule } from "./caps-lock";
export {
  buildEnterRules,
  buildEqualsRules,
  enterKeyHoldMappings,
  equalsKeyHoldMappings,
} from "./enter-equals";
export {
  buildCtrlEscapeMonitorRule,
  buildEscapeTapTapHoldRule,
} from "./escape";
export { buildHomeEndRule, homeEndBindings } from "./home-end";
export {
  buildHyperLauncherRules,
  hyperLauncherMappings,
  hyperTapHoldMappings,
} from "./hyper";
export {
  buildCmdQRule,
  buildLeftCommandRule,
  leftCommandTapHoldMappings,
} from "./left-command";
export { buildMouseRules, mouseDeviceMappings } from "./mouse";
export {
  buildRightOptionLauncherRules,
  rightOptionLaunchers,
  rightOptionTapHoldMappings,
} from "./right-option";
export { buildShiftRules } from "./shift";
export {
  buildDisableHideMinimizeRule,
  buildPasswordsQuickFillRule,
  disabledShortcuts,
  passwordsQuickFillMapping,
} from "./system";

function mergeTapHoldRecords(
  ...records: Array<Record<string, TapHoldConfig>>
): Record<string, TapHoldConfig> {
  const merged: Record<string, TapHoldConfig> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (key in merged) {
        throw new Error(
          `Duplicate tapHold key across definition files: ${key}`,
        );
      }
      merged[key] = value;
    }
  }
  return merged;
}

export const tapHoldMappings = mergeTapHoldRecords(
  singleKeyTapHoldMappings,
  hyperTapHoldMappings,
  leftCommandTapHoldMappings,
  antinoteTapHoldMappings,
  rightOptionTapHoldMappings,
);

export { simultaneousMappings } from "./simultaneous";
