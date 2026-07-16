import { type PointingButton, type ToEvent } from "karabiner.ts";

export const ACTIVATE_WINDOW_UNDER_CURSOR_EVENT: ToEvent = {
  pointing_button: "button1",
  hold_down_milliseconds: 80,
};
export type MouseIdentifiers = {
  product_id: number;
  vendor_id: number;
};

export type MouseCondition =
  | { app: string; unless?: boolean }
  | { variable: string; match: "if" | "unless"; value: string | number };

export type MouseOverride = {
  /** Conditions that must all hold (AND) for the override to fire. */
  when: MouseCondition[];
  /** Events emitted immediately while the `when` conditions hold. */
  to: ToEvent[];
};

export type MouseTapHoldMapping = {
  type: "tapHold";
  button: string;
  description: string;
  variable?: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  eventOptions?: {
    halt?: boolean;
    repeat?: boolean;
  };
  thresholdMs?: number;
  timeoutMs?: number;
  /**
   * App/variable-conditional overrides. Each becomes a standalone manipulator
   * (prepended before the base) that emits `to` immediately when all its
   * `when` conditions hold. Declared here so per-app behavior lives next to the
   * button definition instead of being hardcoded in the engine.
   */
  overrides?: MouseOverride[];
};

export type MouseSimultaneousMapping = {
  type: "simultaneous";
  buttons: string[];
  description: string;
  to: ToEvent[];
  thresholdMs?: number;
};

export type MouseDoubleTapMapping = {
  type: "doubleTap";
  button: string;
  description: string;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  allowPassThrough?: boolean;
  thresholdMs?: number;
};

export type mouseRemap = {
  type: "mouseRemap";
  description: string;
  from: string;
  to: ToEvent[];
  eventOptions?: {
    halt?: boolean;
    repeat?: boolean;
  };
};

export type MouseMapping =
  | MouseTapHoldMapping
  | MouseDoubleTapMapping
  | MouseSimultaneousMapping;

export type MouseDeviceConfig = {
  buttonMap: Record<string, PointingButton>;
  identifiers: MouseIdentifiers;
  key: string;
  mappings: MouseMapping[];
  name: string;
};
