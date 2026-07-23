/** Labeled registry entry. `name` is the value(s) consumed by resolvers;
 *  `refDesc` is the human label used to derive descriptions (Phase 2). */
export type RefSpecType =
  | "app"
  | "folder"
  | "raycast"
  | "cleanShot"
  | "command"
  | "url";

export type RefSpec = {
  type: RefSpecType;
  name: string | string[];
  refDesc: string;
};

export type VarSpec = {
  name: string;
  varDesc: string;
};

export type DeviceSpec = {
  name: string;
  deviceDesc: string;
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
};

// Category aliases keep action refs type-safe (an app ref can't be a folder).
export type AppRef = RefSpec;
export type FolderRef = RefSpec;
export type RaycastRef = RefSpec;
export type CleanShotRef = RefSpec;
export type CommandRef = RefSpec;
export type UrlRef = RefSpec;
