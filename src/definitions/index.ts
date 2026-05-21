// User edit surface: modify files in this directory to customize your Karabiner config.

export { buildAntinoteDeleteRule } from "./apps/antinote";
export { buildSkimCommandRemapRule } from "./apps/skim";
export { buildOnePieceClickEnterRule } from "./apps/onepiece";
export { buildWordPrivilegesRule } from "./apps/word";
export {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule
} from "./escape";
export { buildCapsLockRule } from "./caps-lock";
export { buildHyperPlusRules } from "./hyper-plus";
export { buildCmdQRule, buildLeftCommandRule } from "./left-command-chords";
export { buildMouseRules, mouseDeviceMappings } from "./mouse";
export { buildHomeEndRule, homeEndNavigationMappings } from "./home-end";
export {
    buildRightOptionAppsRule,
    rightOptionLaunchers
} from "./right-option-launchers";
export {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    disabledShortcuts,
    securitySlashActionMappings
} from "./security";
export { spaceLayerDefinitions } from "./space";
export {
    buildEnterRules,
    buildEqualsRules,
    enterKeyHoldMappings,
    equalsKeyHoldMappings
} from "./special-keys";
export { tapHoldMappings } from "./tap-hold";
