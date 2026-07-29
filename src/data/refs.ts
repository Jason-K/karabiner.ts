/** Labeled registry entry. `name` is the value(s) consumed by resolvers;
 *  `refDesc` is the human label used to derive descriptions (Phase 2). */
export type RefSpecType =
  | "app"
  | "command"
  | "url"
  | "path";

export type RefSpec = {
  type: RefSpecType;
  // TO DO: consider better name for 'name', which is a link in the case of a URL, a bundle Id in the case of an app, etc. (name is misleading; this is the value consumed by resolvers, not a human label)
  name: string | string[];
  refDesc: string;
};

export type VarSpec = {
  name: string;
  varDesc: string;
};


// TO DO: consider expanding to allow user to assign device-specific rules, including booleans for
export type DeviceSpec = {
  name: string;
  deviceDesc: string;
  product_id: number;
  vendor_id: number;
  // device_type?: "keyboard" | "pointing_device"; used to set the d
  //   is_keyboard?: boolean;
  //   is_pointing_device?: boolean;
  //   modify_events?: boolean;
  //   manipulate_caps_led?: boolean;
  //   mouse_flip_wheel_vertical?: boolean;
  //   mouse_flip_wheel_horizontal?: boolean;
  //   mouse_xy_multiplier?: number;
  //   mouse_wheel_multiplier?: number;
  //   mouse_modify_events?: boolean;
  //   ignore_vendor_events?: boolean;
  //   ignore_device?: boolean;
};

// Category aliases keep action refs type-safe (an app ref can't be a folder).
export type AppRef = RefSpec;
export type CommandRef = RefSpec;
export type UrlRef = RefSpec;
export type PathRef = RefSpec;
export type VarRef = VarSpec;
