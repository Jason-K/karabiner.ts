/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export {
  DEVICE_IDS,
  KB_MODIFY_EVENTS,
  KB_USE_CAPS_LED,
  MOUSE_FLIP_WHEEL_HORIZONTAL,
  MOUSE_FLIP_WHEEL_VERTICAL,
  MOUSE_MODIFY_EVENTS,
  MOUSE_WHEEL_MULTIPLIER,
  MOUSE_XY_MULTIPLIER,
  NUMPAD_REMAPS,
} from "./devices";
export { KE_VAR_VALUES, KE_VARS, type VarRef } from "./ke-vars";

export { APP_BUNDLES, PW_BUNDLES, type AppRef } from "./app_bundles";
export { CMDS, type CommandRef } from "./commands";
export { EXTERNAL_HKS, type ExternalHkRef, type HkRef } from "./external-hotkeys";
export { HOME_DIR, PATHS, type PathRef } from "./paths";
export { DEFAULT_PROFILE_NAME, PREFERRED_PROFILE_NAME } from "./user-prefs";
export type { DeviceSpec, RefSpec, RefSpecType, VarSpec } from "./refs";
export { TIMINGS } from "./timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";
export { URLS, type UrlRef } from "./urls";
