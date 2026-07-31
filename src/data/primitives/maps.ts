import type { BaseSpec } from "./base";
import type { AppSpec } from "./apps";
import type { PathSpec } from "./paths";

export type Map = {
  key: string;
  modifiers: string[];
};

export interface MapSpec extends BaseSpec {
  type: "map";
  /** key_code to emit (e.g. "f", "space", "return"). If sequence, key_code of first combo. */
  keyCode: string;
  /** Modifiers to hold while emitting `keyCode`. */
  modifiers: string[];
  /** Sequence of key combos if this hotkey triggers multiple key presses in order. */
  combos?: Map[];
  /** Optional app that "owns" this hotkey — accepts AppSpec, PathSpec, or bundle-id/path string */
  app?: AppSpec | PathSpec | string;
  /** When true, hotkey is only expected to work while `app` is frontmost */
  activeAppOnly?: boolean;
  options?: {
    repeat?: boolean;
    halt?: boolean;
    lazy?: boolean;
  };
}
