/**
 * Barrel export for split data/config modules.
 *
 * Re-exports all declarative configuration consumed by core/rules/index.
 */

export {
    SPACE_LAYER_DEBUG,
    SPACE_LAYER_DEBUG_LOG_PATH,
    SPACE_LAYER_INDICATOR_ROOT,
    SPACE_LAYER_LABEL,
    SPACE_LAYER_LEADER_KEY,
    SPACE_LAYER_PREFIX
} from "./space-layer";

export {
    ACCESSIBILITY_VALUES,
    ACCESSIBILITY_VARIABLES
} from "./accessibility";
export { appRegistry, type AppRef } from "./apps";
export { cleanShotRegistry } from "./cleanshot";
export {
    APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS,
    DEVICE_IDENTIFIERS
} from "./devices";
export { HOME_DIR } from "./environment";
export {
    FOCUS_APP_BEHAVIORS,
    type FocusAppBehavior
} from "./focus-app";
export { folderRegistry, type FolderRef } from "./folders";
export { PATHS } from "./paths";
export { DEFAULT_PROFILE_NAME, PREFERRED_PROFILE_NAME } from "./profiles";
export { raycastRegistry } from "./raycast";
export { spaceLayerDefinitions } from "./space-layers";
export { tapHoldMappings } from "./tap-hold";
export { TIMINGS } from "./timings";
export {
    DESCRIPTION_SEPARATOR,
    KEY_LABEL_OVERRIDES,
    MODIFIER_SYMBOLS
} from "./ui-labels";
