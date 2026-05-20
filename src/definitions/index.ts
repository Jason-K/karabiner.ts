// User edit surface: modify files in this directory to customize your Karabiner config.

export { buildAntinoteDeleteRule } from "./antinote";
export {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule
} from "./escape-monitor";
export { buildCapsLockRule } from "./hyper-chords";
export { buildHyperPlusRules } from "./hyper-plus";
export { buildCmdQRule, buildLeftCommandRule } from "./left-command-chords";
export { buildMouseRules, mouseDeviceMappings } from "./mouse";
export { buildHomeEndRule, homeEndNavigationMappings } from "./navigation";
export {
    buildRightOptionAppsRule,
    rightOptionLaunchers
} from "./right-option-launchers";
export {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    buildWordPrivilegesRule,
    disabledShortcuts,
    securitySlashActionMappings
} from "./security";
export { buildSkimCommandRemapRule } from "./skim";
export { spaceLayerDefinitions } from "./space-layers";
export {
    buildEnterRules,
    buildEqualsRules,
    buildOnePieceClickEnterRule,
    enterKeyHoldMappings,
    equalsKeyHoldMappings
} from "./special-keys";
export { tapHoldMappings } from "./tap-hold";
