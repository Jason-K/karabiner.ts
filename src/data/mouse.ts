import { type PointingButton, type ToEvent } from "karabiner.ts";

export const WIN_ACTIVATE_UNDER_CURSOR: ToEvent = {
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
  /**
   * Optional conditions applied to this tapHold mapping.
   */
  when?: MouseCondition[];
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
  firstTapPendingVar: string;
  /**
   * Optional conditions applied to both first/second-tap manipulators.
   */
  when?: MouseCondition[];
  immediateSingleTapEvents?: ToEvent[];
  /**
   * Emit single-click behavior only after the double-tap window expires.
   * This prevents single-click actions from firing when a true double-click occurs.
   */
  delayedSingleTapEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  doubleTapEvents?: ToEvent[];
  doubleTapHoldEvents?: ToEvent[];
  allowPassThrough?: boolean;
  thresholdMs?: number;
  /**
   * Conditional branches for per-app/per-variable behavior while keeping one
   * declarative doubleTap mapping entry.
   */
  overrides?: Array<{
    when: MouseCondition[];
    immediateSingleTapEvents?: ToEvent[];
    delayedSingleTapEvents?: ToEvent[];
    holdEvents?: ToEvent[];
    doubleTapEvents?: ToEvent[];
    doubleTapHoldEvents?: ToEvent[];
    allowPassThrough?: boolean;
    thresholdMs?: number;
  }>;
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
  | MouseSimultaneousMapping
  | mouseRemap;

export type MouseDeviceConfig = {
  buttonMap: Record<string, PointingButton>;
  identifiers: MouseIdentifiers;
  key: string;
  mappings: MouseMapping[];
  name: string;
};
