import type { DeviceSpec } from "./refs";

// Default values for per-device settings
export const MOUSE_FLIP_WHEEL_VERTICAL: boolean = true;
export const MOUSE_FLIP_WHEEL_HORIZONTAL: boolean = true;
export const MOUSE_XY_MULTIPLIER: number = 10.0;
export const MOUSE_WHEEL_MULTIPLIER: number = 5.0;
export const MOUSE_MODIFY_EVENTS: boolean = true;
export const KB_MODIFY_EVENTS: boolean = true;
export const KB_USE_CAPS_LED: boolean = true;

export const DEVICE_IDS = {
  appleNumericKeypad: {
    name: "appleNumericKeypad",
    deviceDesc: "Apple numeric keypad",
    vendor_id: 76,
    product_id: 802,
    is_keyboard: true,
  },
  logitechG502X: {
    name: "logitechG502X",
    deviceDesc: "Logitech G502 X",
    product_id: 49305,
    vendor_id: 1133,
    is_pointing_device: true,
    mouse_flip_wheel_vertical: MOUSE_FLIP_WHEEL_VERTICAL,
    mouse_flip_wheel_horizontal: MOUSE_FLIP_WHEEL_HORIZONTAL,
    mouse_xy_multiplier: MOUSE_XY_MULTIPLIER,
    mouse_wheel_multiplier: MOUSE_WHEEL_MULTIPLIER,
    mouse_modify_events: MOUSE_MODIFY_EVENTS,
  },
} as const satisfies Record<string, DeviceSpec>;

export const NUMPAD_REMAPS = [
  {
    from: { key_code: "keypad_asterisk" },
    to: [{ key_code: "keypad_hyphen" }],
  },
  {
    from: { key_code: "keypad_equal_sign" },
    to: [{ key_code: "keypad_slash" }],
  },
  {
    from: { key_code: "keypad_hyphen" },
    to: [{ key_code: "keypad_plus" }],
  },
  {
    from: { key_code: "keypad_plus" },
    to: [{ key_code: "keypad_equal_sign" }],
  },
  {
    from: { key_code: "keypad_slash" },
    to: [{ key_code: "keypad_asterisk" }],
  },
  { from: { key_code: "left_control" }, to: [{ key_code: "fn" }] },
  { from: { key_code: "fn" }, to: [{ key_code: "left_control" }] },
] as const;
