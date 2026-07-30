import type { DeviceSpec } from "./refs";

// Default values for per-device settings
export const mouse_flip_vertical_wheel: boolean = true;
export const mouse_flip_horizontal_wheel: boolean = true;
export const pointing_motion_xy_multiplier: number = 10.0;
export const pointing_motion_wheels_multiplier: number = 5.0;
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
    mouse_flip_vertical_wheel: true,
    pointing_motion_xy_multiplier: 10,
    pointing_motion_wheels_multiplier: 5,
    mouse_modify_events: true,
    ignore_vendor_events: true,
    ignore: false,
  },
} as const satisfies Record<string, DeviceSpec>;
