/**
 * Native Karabiner-Elements JSON AST type definitions.
 * Provides full, self-contained types for Karabiner rules, manipulators, events, and conditions.
 */

export type Modifier =
  | 'caps_lock'
  | 'left_control'
  | 'left_shift'
  | 'left_option'
  | 'left_command'
  | 'right_control'
  | 'right_shift'
  | 'right_option'
  | 'right_command'
  | 'fn'
  | 'command'
  | 'control'
  | 'option'
  | 'shift';

export type PointingButton =
  | 'button1'
  | 'button2'
  | 'button3'
  | 'button4'
  | 'button5'
  | 'button6'
  | 'button7'
  | 'button8'
  | 'button9'
  | 'button10'
  | 'button11'
  | 'button12'
  | 'button13'
  | 'button14'
  | 'button15'
  | 'button16'
  | (string & {});

export type FromModifiers = {
  mandatory?: Modifier[] | ['any'];
  optional?: Modifier[] | ['any'];
};

/** Ordering restriction shared by `key_down_order` and `key_up_order`. */
export type SimultaneousKeyOrder = 'insensitive' | 'strict' | 'strict_inverse';

/**
 * `from.simultaneous_options`.
 * @see docs/karabiner_docs/complex-modifications-manipulator-definition/from/simultaneous-options
 */
export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: SimultaneousKeyOrder;
  key_up_order?: SimultaneousKeyOrder;
  key_up_when?: 'any' | 'all';
  to_after_key_up?: ToEvent[];
};

export type FromKeyType =
  | { key_code: string | number }
  | { consumer_key_code: string | number }
  | { pointing_button: PointingButton | number }
  | { any: 'key_code' | 'consumer_key_code' | 'pointing_button' };

export type FromEvent = (
  | FromKeyType
  | {
      simultaneous: FromKeyType[];
      simultaneous_options?: SimultaneousOptions;
    }
) & {
  modifiers?: FromModifiers;
  integer_value?: number;
};

export type ToVariable = {
  name: string;
  value: number | boolean | string;
  key_up_value?: number | boolean | string;
  type?: string;
};

export type ToMouseKey = {
  x?: number;
  y?: number;
  vertical_wheel?: number;
  horizontal_wheel?: number;
  speed_multiplier?: number;
};

export type ToStickyModifier = Partial<
  Record<
    | 'left_control'
    | 'left_shift'
    | 'left_option'
    | 'left_command'
    | 'right_control'
    | 'right_shift'
    | 'right_option'
    | 'right_command'
    | 'fn',
    'on' | 'off' | 'toggle' | boolean
  >
>;

/**
 * `to.select_input_source`. Every field is a regular expression.
 * @see docs/karabiner_docs/complex-modifications-manipulator-definition/to/select-input-source
 */
export type ToSelectInputSource = {
  /** Language regex, e.g. `"^en$"`. */
  language?: string;
  /** Input source id regex, e.g. `"^com\\.apple\\.keylayout\\.US$"`. */
  input_source_id?: string;
  /** Input mode id regex. */
  input_mode_id?: string;
};

/**
 * `software_function.open_application`. At least one target must be given;
 * Karabiner resolves them in the order listed here.
 */
export type SoftwareFunctionOpenApplication =
  | { bundle_identifier: string }
  | { file_path: string }
  | { frontmost_application_history_index: number };

/**
 * `to.software_function` — functions implemented in software rather than by
 * emitting HID events. Exactly one member is set per event.
 * @see docs/karabiner_docs/complex-modifications-manipulator-definition/to/software_function
 */
export type ToSoftwareFunction =
  | {
      /** Software-synthesized double click at a fixed location. */
      cg_event_double_click: {
        /** CGMouseButton: 0 left, 1 right, 2 middle, 3+ other. */
        button: number;
      };
    }
  | { iokit_power_management_sleep_system: { delay_milliseconds?: number } }
  | { open_application: SoftwareFunctionOpenApplication }
  | {
      set_mouse_cursor_position: {
        x: number | string;
        y: number | string;
        /** Screen index for the position origin. */
        screen?: number;
      };
    };

/**
 * `to.send_user_command` — datagram to a user-provided UNIX socket server.
 * Lower latency than `shell_command` because no process is spawned.
 * @see docs/karabiner_docs/complex-modifications-manipulator-definition/to/send-user-command
 */
export type ToSendUserCommand = {
  /** Arbitrary JSON payload handed to the receiver. */
  payload: unknown;
  /**
   * Socket path. Defaults to
   * `/Library/Application Support/org.pqrs/tmp/user/{UID}/user_command_receiver.sock`.
   */
  endpoint?: string;
};

export type ToEventOptions = {
  modifiers?: Modifier[];
  lazy?: boolean;
  repeat?: boolean;
  halt?: boolean;
  hold_down_milliseconds?: number;
  /**
   * Gate this single event on a condition (Karabiner-Elements 15.3.7+).
   *
   * Distinct from the manipulator's own `conditions`: those decide whether the
   * manipulator matches at all, at key-down. These are evaluated when the first
   * event of the surrounding channel is *emitted*, which is the only way to make
   * a `to_after_key_up` event depend on what happened during the hold.
   */
  conditions?: Condition[];
};

export type ToEvent = (
  | { key_code: string | number }
  | { consumer_key_code: string | number }
  | { pointing_button: PointingButton | number }
  | { shell_command: string }
  | { select_input_source: ToSelectInputSource }
  | { set_variable: ToVariable }
  | { set_notification_message: { id: string; text: string } }
  | { mouse_key: ToMouseKey }
  | { sticky_modifier: ToStickyModifier }
  | { software_function: ToSoftwareFunction }
  | { generic_desktop: number }
  | { send_user_command: ToSendUserCommand }
  | { from_event: boolean }
) &
  ToEventOptions;

export type ToDelayedAction = {
  to_if_invoked?: ToEvent[];
  to_if_canceled?: ToEvent[];
};

export type ToIfOtherKeyPressed = ToEvent;

export type FrontmostApplicationCondition = {
  type: 'frontmost_application_if' | 'frontmost_application_unless';
  description?: string;
  bundle_identifiers?: string[];
  file_paths?: string[];
};

export type DeviceIdentifier = {
  vendor_id?: number;
  product_id?: number;
  location_id?: number;
  is_keyboard?: boolean;
  is_pointing_device?: boolean;
  description?: string;
};

export type DeviceCondition = {
  type: 'device_if' | 'device_unless' | 'device_exists_if' | 'device_exists_unless';
  identifiers: DeviceIdentifier[];
  description?: string;
};

export type KeyboardTypeCondition = {
  type: 'keyboard_type_if' | 'keyboard_type_unless';
  keyboard_types: string[];
  description?: string;
};

export type InputSourceCondition = {
  type: 'input_source_if' | 'input_source_unless';
  input_sources: any[];
  description?: string;
};

export type VariableCondition = {
  type: 'variable_if' | 'variable_unless';
  name: string;
  value: number | boolean | string;
  description?: string;
};

export type ExpressionCondition = {
  type: 'expression_if' | 'expression_unless';
  expression: string;
  description?: string;
};

export type EventChangedCondition = {
  type: 'event_changed_if' | 'event_changed_unless';
  value: boolean;
  description?: string;
};

export type Condition =
  | FrontmostApplicationCondition
  | DeviceCondition
  | KeyboardTypeCondition
  | InputSourceCondition
  | VariableCondition
  | ExpressionCondition
  | EventChangedCondition;

export type BasicParameters = {
  'basic.to_if_alone_timeout_milliseconds'?: number;
  'basic.to_if_held_down_threshold_milliseconds'?: number;
  'basic.to_delayed_action_delay_milliseconds'?: number;
  'basic.simultaneous_threshold_milliseconds'?: number;
};

export type BasicManipulator = {
  type: 'basic';
  from: FromEvent;
  to?: ToEvent[];
  to_if_alone?: ToEvent[];
  to_if_held_down?: ToEvent[];
  to_after_key_up?: ToEvent[];
  to_delayed_action?: ToDelayedAction;
  to_if_other_key_pressed?: ToIfOtherKeyPressed[];
  parameters?: BasicParameters;
  conditions?: Condition[];
  description?: string;
};

export type MouseMotionManipulator = {
  type: 'mouse_motion_to_scroll';
  from?: { modifiers?: FromModifiers };
  options?: any;
  conditions?: Condition[];
  description?: string;
};

export type Manipulator = BasicManipulator | MouseMotionManipulator;

export type Rule = {
  description?: string;
  manipulators: Manipulator[];
};

export type ComplexModificationsParameters = {
  'basic.to_if_alone_timeout_milliseconds'?: number;
  'basic.to_if_held_down_threshold_milliseconds'?: number;
  'basic.to_delayed_action_delay_milliseconds'?: number;
  'basic.simultaneous_threshold_milliseconds'?: number;
  'mouse_motion_to_scroll.speed'?: number;
};

export type ComplexModifications = {
  parameters?: ComplexModificationsParameters;
  rules: Rule[];
};

export type Profile = {
  name: string;
  selected?: boolean;
  complex_modifications?: ComplexModifications;
  [key: string]: any;
};

export type KarabinerConfig = {
  profiles: Profile[];
  [key: string]: any;
};
