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

export type SimultaneousOptions = {
  detect_key_down_unbroken_sequence?: boolean;
  key_down_order?: 'insensitive' | 'strict' | 'strict_inverse';
  key_up_order?: 'insensitive' | 'strict' | 'loose';
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

export type ToEventOptions = {
  modifiers?: Modifier[];
  lazy?: boolean;
  repeat?: boolean;
  halt?: boolean;
  hold_down_milliseconds?: number;
};

export type ToEvent = (
  | { key_code: string | number }
  | { consumer_key_code: string | number }
  | { pointing_button: PointingButton | number }
  | { shell_command: string }
  | { select_input_source: any }
  | { set_variable: ToVariable }
  | { set_notification_message: { id: string; text: string } }
  | { mouse_key: ToMouseKey }
  | { sticky_modifier: ToStickyModifier }
  | { software_function: any }
  | { generic_desktop: number }
  | { send_user_command: any }
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
  'basic.simultaneous_threshold_milliseconds?'?: number;
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
