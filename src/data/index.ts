/**
 * Barrel export for data modules (primitives, registries, and settings).
 */

// PRIMITIVES
export type {
  AppSpec,
  BaseSpec,
  CommandSpec,
  DeviceSpec,
  Map,
  MapSpec,
  PathSpec,
  UrlSpec,
  VarSpec,
  Action,
  ActionKeyModifier,
  ActionSpec,
  AppTarget,
} from "./primitives";

// SETTINGS
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./constants/descriptions";
export { DEFAULT_GLOBAL_SETTINGS, FINDER_REPLACEMENT } from "./constants/global";
export { DEFAULT_PROFILE, DEFAULT_TIMINGS, PREFERRED_PROFILE } from "./constants/profiles";
export {
  KB_MODIFY_EVENTS,
  KB_USE_CAPS_LED,
  MOUSE_MODIFY_EVENTS,
  mouse_flip_horizontal_wheel,
  mouse_flip_vertical_wheel,
  pointing_motion_wheels_multiplier,
  pointing_motion_xy_multiplier,
} from "./constants/devices";
export {
  DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS,
  DEFAULT_MOUSE_MANIPULATOR_TIMINGS,
  TIMINGS,
} from "./constants/timings";
export { VMOD, MODIFIER_KEY_CODES, type ModComboAlias, type ModKey } from "./constants/keys";
export { buttons, defaultButtonNames, mouseVars, type ButtonSpec, type DeviceName } from "./constants/mouse";

// REGISTRIES
export { DEVICES } from "./registries/devices";
export { KE_VAR_VALUES, KE_VARS } from "./registries/vars";
export {
  ACCESSIBILITY_ROLES,
  INPUT_SOURCES,
  VAR_STATE,
  type AccessibilityRole,
  type InputSourceId,
} from "./registries/var-states";
export { APP_ID, PW_IDS } from "./registries/apps";
export { CMDS } from "./registries/commands";
export { COMBOS, map, type ComboOpts, type HkInput } from "./registries/combos";
export { HOME_DIR, PATHS } from "./registries/paths";
export { URLS } from "./registries/urls";
