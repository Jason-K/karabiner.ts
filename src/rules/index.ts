/**
 * Barrel export for rules module
 *
 * Re-exports all rule factory functions from this directory for easy
 * centralized imports in src/index.ts. Keeps main orchestration file clean.
 */

export { buildAntinoteDeleteRule } from "./antinote";
export {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule
} from "./escape-monitor";
export { buildCapsLockRule } from "./hyper-chords";
export { buildHyperPlusRules } from "./hyper-plus";
export { buildCmdQRule, buildLeftCommandRule } from "./left-command-chords";
export { buildRightOptionAppsRule } from "./right-option-launchers";
export {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    buildWordPrivilegesRule
} from "./security";
export {
  // buildSkimAppleScriptHoldRule,
  buildSkimCommandRemapRule,
} from "./skim";
export {
    buildEnterRules,
    buildEqualsRules,
    buildGraveAccentHoldRule,
    buildHomeEndRule
} from "./special-keys";
