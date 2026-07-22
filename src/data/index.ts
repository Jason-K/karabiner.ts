/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export {
    ACCESSIBILITY_VALUES,
    ACCESSIBILITY_VARIABLES
} from "./accessibility";
export { appRegistry, type AppRef } from "./apps";
export { cleanShotRegistry } from "./cleanshot";
export { commandRegistry, type CommandRef } from "./commands";
// export { urlRegistry, type UrlRef } from "./urls";
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
export { TIMINGS } from "./timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";
