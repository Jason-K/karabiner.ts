// User edit surface: modify files in this directory to customize your Karabiner config.

import { assertUniqueTriggers, type Binding } from "../engine";
import { antinoteTapHoldBindings } from "./apps/antinote";
import { hyperTapHoldBindings } from "./hyper";
import { leftCommandTapHoldBindings } from "./left-command";
import { rightOptionTapHoldBindings } from "./right-option";
import { singleKeyTapHoldBindings } from "./single-key";

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
} from "./hyper";
export {
  buildCmdQRule,
  buildLeftCommandRule,
} from "./left-command";
export { buildMouseRules, mouseDeviceMappings } from "./mouse";
export { buildShiftRules } from "./shift";
export {
  buildDisableHideMinimizeRule,
  buildPasswordsQuickFillRule,
  disabledShortcutBindings,
  passwordsQuickFillBinding,
} from "./system";

/** All tap-hold bindings, merged with cross-file duplicate-trigger detection. */
export const tapHoldBindings: Binding[] = assertUniqueTriggers([
  ...singleKeyTapHoldBindings,
  ...hyperTapHoldBindings,
  ...leftCommandTapHoldBindings,
  ...antinoteTapHoldBindings,
  ...rightOptionTapHoldBindings,
]);

export { simultaneousMappings } from "./simultaneous";
