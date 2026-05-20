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
export { buildMouseDeviceRules, buildMouseRules } from "./mouse";
export { buildHomeEndRule } from "./navigation";
export { buildRightOptionAppsRule } from "./right-option-launchers";
export {
  buildDisableHideMinimizeRule,
  buildPasswordsQuickFillRule,
  buildWordPrivilegesRule,
} from "./security";
export {
  // buildSkimAppleScriptHoldRule,
  buildSkimCommandRemapRule,
} from "./skim";
export {
  buildEnterRules,
  buildEqualsRules,
  buildOnePieceClickEnterRule,
} from "./special-keys";

export * from "./action-resolver";
export * from "./conditional-action-rules";
export * from "./conditional-tap-hold-rules";
export * from "./device-config";
export * from "./escape-rule";
export * from "./launcher-rules";
export * from "./layer-emit";
export * from "./simple-rules";
export * from "./tap-hold-rules";
