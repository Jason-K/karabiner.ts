/** Labeled registry entry. `name` is the value(s) consumed by resolvers;
 *  `refDesc` is the human label used to derive descriptions (Phase 2). */
export type RefSpecType =
  | "app"
  | "folder"
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
export type CommandRef = RefSpec;
export type UrlRef = RefSpec;
export type PathRef = RefSpec;

