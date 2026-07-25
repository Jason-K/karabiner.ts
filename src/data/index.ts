/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export { AccessibilityValues, AccessibilityVariables, type AccessibilityVariable } from "./accessibility";
export {
  APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS,
  DEVICE_IDENTIFIERS,
  karabinerDeviceId,
} from "./devices";
export { HOME_DIR } from "./environment";
export {
  FOCUS_APP_BEHAVIORS,
  type FocusAppBehavior
} from "./focus-app";

export type { DeviceSpec, RefSpec, RefSpecType, VarSpec } from "./refs";
export { Apps, type AppRef } from "./apps";
export { Commands, type CommandRef } from "./commands";
export { Folders, type FolderRef } from "./folders";
export { Paths, type PathRef } from "./paths";
export { Urls, type UrlRef } from "./urls";
export { DEFAULT_PROFILE_NAME, PREFERRED_PROFILE_NAME } from "./profiles";
export { TIMINGS } from "./timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";



