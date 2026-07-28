// User edit surface: modify files in this directory to customize your Karabiner config.

// IMPORTS
import { assertUniqueTriggers, type Binding } from "../engine";
import { hyperTapHoldBindings } from "./hyper";
import { modifiedSingleKeyTapHoldBindings } from "./modified-single-key";
import { singleKeyTapHoldBindings } from "./single-key";

// RULES
export { buildCapsLockRule } from "./caps-lock";
export { buildDisabledHotkeys, disabledHotkeys } from "./disable-hotkeys";
export { buildHotkeyGuards } from "./guards";
export { buildHyperLauncherRules, hyperLauncherBindings } from "./hyper";
export { mouseBindings } from "./mouse";

/** All tap-hold bindings, merged with cross-file duplicate-trigger detection. */
export const tapHoldBindings: Binding[] = assertUniqueTriggers([
  ...singleKeyTapHoldBindings,
  ...hyperTapHoldBindings,
  ...modifiedSingleKeyTapHoldBindings,
]);

export { simultaneousMappings } from "./simultaneous";
