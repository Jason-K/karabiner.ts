// User edit surface: modify files in this directory to customize your Karabiner config.

import type { TapHoldConfig } from "../engine";
import { hyperTapHoldMappings } from "./hyper";
import { leftCommandTapHoldMappings } from "./left-command";
import { rightOptionTapHoldMappings } from "./right-option";
import {
    leftShiftATapHoldMappings,
    tapHoldMappings as singleKeyTapHoldMappings,
} from "./tap-hold";

export { buildAntinoteRules } from "./apps/antinote";
export { buildSkimCommandRemapRule } from "./apps/skim";
export { buildOnePieceClickEnterRule } from "./apps/onepiece";
export { buildWordPrivilegesRule } from "./apps/word";
export {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule,
} from "./escape";
export { buildCapsLockRule } from "./caps-lock";
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
export { buildHomeEndRule, homeEndNavigationMappings } from "./home-end";
export {
    buildRightOptionLauncherRules,
    rightOptionLaunchers,
    rightOptionTapHoldMappings,
} from "./right-option";
export {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    disabledShortcuts,
    passwordsQuickFillMapping,
} from "./system";
export { spaceLayerDefinitions } from "./space";
export {
    buildEnterRules,
    buildEqualsRules,
    enterKeyHoldMappings,
    equalsKeyHoldMappings,
} from "./enter-equals";

export const tapHoldMappings: Record<string, TapHoldConfig> = {
  ...singleKeyTapHoldMappings,
  ...hyperTapHoldMappings,
  ...leftCommandTapHoldMappings,
  ...leftShiftATapHoldMappings,
  ...rightOptionTapHoldMappings,
};
