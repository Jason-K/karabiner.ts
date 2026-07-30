/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export {
  DEVICE_IDS,
  KB_MODIFY_EVENTS,
  KB_USE_CAPS_LED,
  mouse_flip_horizontal_wheel,
  mouse_flip_vertical_wheel,
  MOUSE_MODIFY_EVENTS,
  pointing_motion_wheels_multiplier,
  pointing_motion_xy_multiplier,
} from "./devices";
export { KE_VAR_VALUES, KE_VARS, type VarRef } from "./registry-vars";
export { VMOD, MODIFIER_KEY_CODES, isModifierKey } from "./key-aliases";
export { APP_ID, PW_IDS, type AppRef } from "./registry-app-ids";
export { CMDS, type CommandRef } from "./registry-cmds";
export { COMBOS, type ExternalHkRef, type HkRef } from "./registry-combos";
export { HOME_DIR, PATHS, type PathRef } from "./registry-paths";
export { DEFAULT_GLOBAL_SETTINGS } from "./settings-global";
export { DEFAULT_PROFILE, PREFERRED_PROFILE, DEFAULT_PROFILE_TIMINGS } from "./settings-profiles";
export type { DeviceSpec, RefSpec, RefSpecType, VarSpec } from "./refs";
export {
  TIMINGS,
  DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS,
  DEFAULT_MOUSE_MANIPULATOR_TIMINGS,
} from "./settings-timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";
export { URLS, type UrlRef } from "./registry-urls";
