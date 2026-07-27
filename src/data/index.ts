/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export {
  WIN_VALS,
  WIN_VARS,
  type AccessibilityVariable,
} from "./accessibility";
export { DEVICE_IDS, karabinerDeviceId, NUMPAD_REMAPS } from "./devices";
export { HOME_DIR } from "./environment";
export { FOCUS_APP_BEHAVIORS, type FocusAppBehavior } from "./focus-app";

export { APPS, PW_BUNDLES, type AppRef } from "./apps";
export { CMDS, type CommandRef } from "./commands";
export { DIRS, type FolderRef } from "./folders";
export { PATHS, type PathRef } from "./paths";
export { DEFAULT_PROFILE_NAME, PREFERRED_PROFILE_NAME } from "./profiles";
export type { DeviceSpec, RefSpec, RefSpecType, VarSpec } from "./refs";
export { TIMINGS } from "./timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";
export { URLS, type UrlRef } from "./urls";
