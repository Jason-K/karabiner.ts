import { Map } from "./registry-combos";

/** Labeled registry entry. `name` is the value(s) consumed by resolvers;
 *  `refDesc` is the human label used to derive descriptions (Phase 2). */
export type RefSpecType =
  | "app"
  | "command"
  | "url"
  | "path"
  | "map";

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

export type DeviceSpec = {
  // Registry metadata (stripped before writing to karabiner.json)
  name: string;
  deviceDesc: string;
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
};

/** Labeled registry entry for a key + modifier combo (or sequence of combos), with optional app ownership. */
export type MapRef = {
  type: "map";
  /** key_code to emit (e.g. "f", "space", "return"). If a sequence, this is the key_code of the first combo. */
  name: string;
  /** Modifier keys to hold while emitting `name`. If a sequence, this is the modifiers of the first combo. */
  modifiers: string[];
  /** Sequence of key combos if this hotkey triggers multiple key presses in order. */
  combos?: Map[];
  /** Human label used to derive descriptions. */
  refDesc: string;
  /** Optional app that "owns" this hotkey — accepts an AppRef, PathRef, or
   *  a raw bundle-id / file-path string (same as `AppTarget` in action-dsl). */
  app?: RefSpec | string;
  /** When true, the hotkey is only expected to work while `app` is frontmost.
   *  Purely informational metadata; defaults to false. */
  activeAppOnly?: boolean;
  /** Default key-event options baked into the registry entry.
   *  Individual `do` blocks may override any of these. */
  options?: {
    repeat?: boolean;
    halt?: boolean;
    lazy?: boolean;
  };
};


// Category aliases keep action refs type-safe (an app ref can't be a folder).
export type AppRef = RefSpec;
export type CommandRef = RefSpec;
export type UrlRef = RefSpec;
export type PathRef = RefSpec;
export type VarRef = VarSpec;
