export const DEVICE_IDENTIFIERS = {
  appleNumericKeypad: {
    vendor_id: 76,
    product_id: 802,
    is_keyboard: true,
  },
  logitechG502X: {
    product_id: 49305,
    vendor_id: 1133,
  },
} as const;

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
