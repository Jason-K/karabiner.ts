import type { VarSpec } from "../primitives/vars";

/** Built-in variables that Karabiner-Elements exposes via its variable system.
 *
 * Each entry is a {@link VarSpec} that can be used directly
 * in condition blocks (`{ var: KE_VARS.accessibilityType, equals: "AXTextArea" }`)
 * or passed anywhere a `VarSpec` is accepted.
 *
 * Variable names are taken verbatim from the Karabiner EventViewer "variables"
 * namespace (visible in the EventViewer's Variables tab).
 */

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a Karabiner built-in variable.
 *  @param name    - the variable name as reported by Karabiner EventViewer
 *  @param varDesc - human label used in descriptions
 */
const keVar = (name: string, varDesc: string): VarSpec => ({ name, varDesc });

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

export const KE_VARS = {
  // accessibility.focused_ui_element.*
  /** Role of the focused UI element (e.g. "AXTextArea", "AXTextField"). */
  accessibilityType: keVar(
    "accessibility.focused_ui_element.role_string",
    "Focused UI role",
  ),
  /** Subrole of the focused UI element (e.g. "AXSecureTextField"). */
  accessibilitySubtype: keVar(
    "accessibility.focused_ui_element.subrole_string",
    "Focused UI subrole",
  ),
  /** Title / label of the focused UI element. */
  accessibilityVisibleText: keVar(
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
} as const satisfies Record<string, VarSpec>;

// ── Typed values for built-in string constants ────────────────────────────────

export const KE_VAR_VALUES = {
  axTextArea: "AXTextArea",
  axTextField: "AXTextField",
  axSecureTextField: "AXSecureTextField",
  axButton: "AXButton",
  axStaticText: "AXStaticText",
  axWebArea: "AXWebArea",
  axSecureTextFieldSubrole: "AXSecureTextField",
} as const;

export const mouseVars = {
  rightButtonPressed: keVar("right_button_pressed", "Right button held"),
  wheelDown: keVar("wheel_down", "Wheel held down"),
  leftButtonPressed: keVar("left_button_pressed", "Left button held"),
  leftWithRightFirstTap: keVar("left_with_right_first_tap", "Left+right first tap"),
} as const satisfies Record<string, VarSpec>;

export type { VarSpec };
