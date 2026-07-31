export interface DeviceSpec {
  /** Registry metadata name */
  name: string;
  /** Human description label */
  deviceDesc: string;
  refDesc?: string;
  // Hardware identifiers
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
  is_pointing_device?: boolean;
  // Per-device Karabiner settings (mouse)
  mouse_flip_vertical_wheel?: boolean;
  mouse_flip_horizontal_wheel?: boolean;
  pointing_motion_xy_multiplier?: number;
  pointing_motion_wheels_multiplier?: number;
  mouse_modify_events?: boolean;
  // Per-device Karabiner settings (shared)
  modify_events?: boolean;
  manipulate_caps_lock_led?: boolean;
  ignore_vendor_events?: boolean;
  ignore?: boolean;
}
