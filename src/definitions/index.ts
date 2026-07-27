// User edit surface: modify files in this directory to customize your Karabiner config.

import { assertUniqueTriggers, type Binding } from "../engine";
import { hyperTapHoldBindings } from "./hyper";
import { modifiedSingleKeyTapHoldBindings } from "./modified-single-key";
import { singleKeyTapHoldBindings } from "./single-key";
export { buildCapsLockRule } from "./caps-lock";
export { buildDisabledHotkeys, disabledHotkeys } from "./disable-hotkeys";
export {
  buildEnterRules,
  buildEqualsRules,
  enterKeyHoldMappings,
  equalsKeyHoldMappings,
} from "./enter-equals";
export { buildGuardRules } from "./guards";
export { buildHomeEndRule, homeEndBindings } from "./home-end";
export { buildHyperLauncherRules, hyperLauncherBindings } from "./hyper";
export { mouseBindings } from "./mouse";
export {
  buildPasswordsQuickFillRule,
  passwordsQuickFillBinding,
} from "./system";

/** All tap-hold bindings, merged with cross-file duplicate-trigger detection. */
export const tapHoldBindings: Binding[] = assertUniqueTriggers([
  ...singleKeyTapHoldBindings,
  ...hyperTapHoldBindings,
  ...modifiedSingleKeyTapHoldBindings,
]);

export { simultaneousMappings } from "./simultaneous";
