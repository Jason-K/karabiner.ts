import type { VarSpec, VarValueSpec } from "../primitives/vars";

/** Factory to create a registry entry for a Karabiner variable specification.
 *  @param name    - variable identifier (built-in or user-assigned)
 *  @param varDesc - human label used in descriptions
 */
const keVar = (name: string, varDesc: string): VarSpec => ({ name, varDesc });

/** Factory to create a registry entry for a value comparison against a variable.
 *  @param ref     - reference to the VarSpec variable
 *  @param value   - value to compare in condition blocks
 *  @param varDesc - human label used in descriptions
 */
export const keVarValue = (
  ref: VarSpec,
  value: string | number | boolean,
  varDesc: string,
): VarValueSpec => ({ ref, value, varDesc });

// ---------------------------------------------------------
// VARS Registry
// ---------------------------------------------------------

/**
 * Unified registry of Karabiner variables (both built-in system variables and user-assigned signaling variables).
 */
export const VARS = {
  // ── Built-in System Variables ─────────────────────────────────────────────

  // accessibility.focused_ui_element.*
  /** Role of the focused UI element (e.g. "AXTextArea", "AXTextField"). */
  elementType: keVar(
    "accessibility.focused_ui_element.role_string",
    "Focused UI role",
  ),
  /** Subrole of the focused UI element (e.g. "AXSecureTextField"). */
  elementSubtype: keVar(
    "accessibility.focused_ui_element.subrole_string",
    "Focused UI subrole",
  ),
  /** Title / label of the focused UI element. */
  elementTitle: keVar(
    "accessibility.focused_ui_element.title_string",
    "Focused UI visible text",
  ),
  /** X position of the focused element's window. */
  winPosX: keVar(
    "accessibility.focused_ui_element.window_position_x",
    "Window X position",
  ),
  /** Y position of the focused element's window. */
  winPosY: keVar(
    "accessibility.focused_ui_element.window_position_y",
    "Window Y position",
  ),
  /** Height of the focused element's window. */
  winHeight: keVar(
    "accessibility.focused_ui_element.window_size_height",
    "Window height",
  ),
  /** Width of the focused element's window. */
  winWidth: keVar(
    "accessibility.focused_ui_element.window_size_width",
    "Window width",
  ),

  // ── Frontmost application ──────────────────────────────────────────────────

  /** Bundle identifier of the frontmost application. */
  foremostAppID: keVar(
    "frontmost_application.bundle_identifier",
    "Frontmost app bundle ID",
  ),
  /** Bundle path of the frontmost application. */
  foremostAppPath: keVar(
    "frontmost_application.bundle_path",
    "Frontmost app bundle path",
  ),
  /** Detection source used to identify the frontmost application. */
  foremostAppDetectionSource: keVar(
    "frontmost_application.detection_source",
    "Frontmost app detection source",
  ),
  /** Executable file path of the frontmost application. */
  foremostAppFilePath: keVar(
    "frontmost_application.file_path",
    "Frontmost app file path",
  ),
  /** Process ID (PID) of the frontmost application. */
  foremostAppPID: keVar(
    "frontmost_application.pid",
    "Frontmost app PID",
  ),

  // ── Input source ──────────────────────────────────────────────────────────

  /** Input source identifier (e.g. "com.apple.keylayout.US"). */
  inputSource: keVar(
    "input_source.input_source_id",
    "Input source ID",
  ),
  /** BCP-47 language tag of the active input source (e.g. "en"). */
  inputLanguage: keVar(
    "input_source.language",
    "Input source language",
  ),

  // ── System ────────────────────────────────────────────────────────────────

  /** Current time in milliseconds since the Unix epoch. */
  systemTime: keVar(
    "system.now.milliseconds",
    "System time (ms)",
  ),
  /** Whether natural (macOS) scroll direction is active. */
  naturalScroll: keVar(
    "system.scroll_direction_is_natural",
    "Natural scroll direction",
  ),
  /** Whether all devices are temporarily ignored by Karabiner. */
  tempIgnoreDevices: keVar(
    "system.temporarily_ignore_all_devices",
    "Temporarily ignore all devices",
  ),
  /** Whether the F-keys are configured as standard function keys. */
  fnKeysForFunctions: keVar(
    "system.use_fkeys_as_standard_function_keys",
    "F-keys as function keys",
  ),

  // ── Virtual HID device state ───────────────────────────────────────────────

  /** Whether the virtual HID keyboard is ready. */
  vhidKeyboardReady: keVar(
    "virtual_hid_devices_state.virtual_hid_keyboard_ready",
    "Virtual HID keyboard ready",
  ),
  /** Whether the virtual HID pointing device is ready. */
  vhidPointingReady: keVar(
    "virtual_hid_devices_state.virtual_hid_pointing_ready",
    "Virtual HID pointing ready",
  ),

  // ── User-Assigned / Signal Variables ───────────────────────────────────────

  /** Right mouse button held down state variable. */
  rButtonDown: keVar("right_button_pressed", "Right button held"),
  /** Scroll wheel held down state variable. */
  wheelDown: keVar("wheel_down", "Wheel held down"),
  /** Left mouse button held down state variable. */
  lButtonDown: keVar("left_button_pressed", "Left button held"),
  /** Left+right mouse chord tap count state variable. */
  lButtonTapCount: keVar("left_with_right_first_tap", "Left+right first tap"),
} as const satisfies Record<string, VarSpec>;

// ---------------------------------------------------------
// STATES Registry
// ---------------------------------------------------------

/**
 * Unified registry of variable states (variable + value specs for both built-in system values and user variable states).
 */
export const STATES = {
  // ── Built-in System UI Element States ──────────────────────────────────────

  isTextArea: keVarValue(
    VARS.elementType,
    "AXTextArea",
    "Focused UI element role is text area",
  ),
  isTextField: keVarValue(
    VARS.elementType,
    "AXTextField",
    "Focused UI element role is text field",
  ),
  isSecureInput: keVarValue(
    VARS.elementType,
    "AXSecureTextField",
    "Focused UI element role is secure text field",
  ),
  isSecureInputSubrole: keVarValue(
    VARS.elementSubtype,
    "AXSecureTextField",
    "Focused UI element subrole is secure text field",
  ),
  isButton: keVarValue(
    VARS.elementType,
    "AXButton",
    "Focused UI element role is button",
  ),
  isStaticText: keVarValue(
    VARS.elementType,
    "AXStaticText",
    "Focused UI element role is static text",
  ),
  isWebArea: keVarValue(
    VARS.elementType,
    "AXWebArea",
    "Focused UI element role is web area",
  ),

  // ── User / Mouse States ──────────────────────────────────────────────────

  rButtonDown: keVarValue(VARS.rButtonDown, 1, "Button 2 is pressed"),
  rButtonUp: keVarValue(VARS.rButtonDown, 0, "Button 2 is not pressed"),
  wheelDown: keVarValue(VARS.wheelDown, 1, "Wheel is held down"),
  wheelUp: keVarValue(VARS.wheelDown, 0, "Wheel is not held down"),
  lButtonDown: keVarValue(VARS.lButtonDown, 1, "Left button is pressed"),
  lButtonUp: keVarValue(VARS.lButtonDown, 0, "Left button is not pressed"),
  lButtonFirstTap: keVarValue(
    VARS.lButtonTapCount,
    1,
    "Left+right first tap",
  ),
} as const satisfies Record<string, VarValueSpec>;

export type { VarSpec, VarValueSpec };
