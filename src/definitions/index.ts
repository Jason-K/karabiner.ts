// User edit surface: modify files in this directory to customize your Karabiner config.

import type { Binding } from "../engine";
import { modifiedSingleKeyTapHoldBindings } from "./modified-single-key";
import { singleKeyTapHoldBindings } from "./single-key";

export { capsLockBaseBindings, capsLockBindings } from "./caps-lock";
export { disabledHotkeys } from "./disable-hotkeys";
export { antinoteGuardBinding, globalGuardBinding, guardBindings } from "./guards";
export { mouseBindings } from "./mouse";

/** All tap-hold bindings. */
export const tapHoldBindings: Binding[] = [
  ...singleKeyTapHoldBindings,
  ...modifiedSingleKeyTapHoldBindings,
];

export { simultaneousMappings } from "./simultaneous";
export { NUMPAD_REMAPS } from "./simple-modifications";
