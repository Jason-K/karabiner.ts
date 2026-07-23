import type { DeviceSpec } from "./refs";

/**
 * Strip a `DeviceSpec` to the shape Karabiner accepts as a device identifier
 * (`product_id` / `vendor_id` / `is_keyboard?`). Prevents the `name`/`deviceDesc`
 * metadata from leaking into Karabiner's `identifiers[]`.
 */
export function karabinerDeviceId(spec: DeviceSpec): {
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
} {
  const id: { product_id: number; vendor_id: number; is_keyboard?: boolean } = {
    product_id: spec.product_id,
    vendor_id: spec.vendor_id,
  };
  if (spec.is_keyboard) id.is_keyboard = true;
  return id;
}

export const DEVICE_IDENTIFIERS = {
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
  },
} as const satisfies Record<string, DeviceSpec>;

export const APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS = [
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
