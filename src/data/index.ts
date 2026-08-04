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
  ProfileSpec,
  SimpleModificationPair,
  UrlSpec,
  VarSpec,
  VarValueSpec,
  Action,
  ActionKeyModifier,
  ActionSpec,
  AppTarget,
  Binding,
  Case,
  Condition,
  Phase,
  SimOrder,
  Trigger,
  TriggerModifiers,
} from "./primitives";

// SETTINGS
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./constants/descriptions";
export { DEFAULT_ENV_VARS, DEFAULT_GLOBAL_SETTINGS, FINDER_REPLACEMENT, HOME, HOMEBREW_PREFIX, SHARED_VENV, TP_CLI, TMPDIR, USER } from "./constants/global";
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
export {
  VM,
  MODKEY_CODES,
  type KeyCode,
  type ModComboAlias,
  type ModKey,
  type StandardKeyCode,
} from "./constants/keys";
export {
  BUTTONS,
  BUTTON_DESCS,
  type ButtonSpec,
  type DeviceName,
  type KnownPointerButton,
  type PointerButtonAlias,
} from "./constants/mouse";

// REGISTRIES
export { DEVICES } from "./registries/devices";
export { VARS } from "./registries/vars";
export {
  ACCESSIBILITY_ROLES,
  INPUT_SOURCES,
  STATES,
  VAR_STATE,
  varState,
  type AccessibilityRole,
  type InputSourceId,
} from "./registries/var-states";
export { APPS, PW_IDS } from "./registries/apps";
export { CMDS } from "./registries/commands";
export { COMBOS, mapSpec, type ComboOpts, type HkInput } from "./registries/combos";
export { PROFILES, getProfileSpec } from "./registries/profiles";
export { PATHS } from "./registries/paths";
export { URLS } from "./registries/urls";
