/**
 * Barrel export for rules module
 *
 * Re-exports all rule factory functions from this directory for easy
 * centralized imports in src/index.ts. Keeps main orchestration file clean.
 */

export { buildAntinoteDeleteRule } from "./antinote";
export { buildCapsLockRule } from "./caps-lock";
export { buildCmdQRule } from "./cmd-q";
export {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule
} from "./escape-monitor";
export { buildLeftCommandRule } from "./left-command";
export { buildRightOptionAppsRule } from "./right-option-apps";
export {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    buildWordPrivilegesRule
} from "./security";
export {
    buildSkimAppleScriptHoldRule,
    buildSkimCommandRemapRule
} from "./skim";
export {
    buildEnterRules,
    buildEqualsRules,
    buildGraveAccentHoldRule,
    buildHomeEndRule,
    buildHyperF12Rule
} from "./special-keys";
