// Unified tap-hold primitive for both keyboard and mouse
import type { FromEvent, ToEvent } from "karabiner.ts";
import { tapHoldFrom, varTapTapHoldFrom } from "../lib/tap-hold";

export type UnifiedTapHoldOpts = {
  from: FromEvent;
  alone?: ToEvent[];
  hold?: ToEvent[];
  eventOptions?: {
    halt?: boolean;
    repeat?: boolean;
  };
  timeoutMs?: number;
  thresholdMs?: number;
  description?: string;
  cancel?: ToEvent[];
  invoked?: ToEvent[];
  variable?: string;
  appOverrides?: Array<{
    app: string;
    unless?: boolean;
    alone?: ToEvent[];
    hold?: ToEvent[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ToEvent[];
    invoked?: ToEvent[];
  }>;
};

export function unifiedTapHold(opts: UnifiedTapHoldOpts) {
  return tapHoldFrom(opts);
}

export type UnifiedVarTapTapHoldOpts = {
  from: FromEvent;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  thresholdMs?: number;
  description?: string;
  allowPassThrough?: boolean;
};

export function unifiedVarTapTapHold(opts: UnifiedVarTapTapHoldOpts) {
  return varTapTapHoldFrom(opts);
}
