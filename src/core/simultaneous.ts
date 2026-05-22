import {
  mapSimultaneous,
  type SimultaneousOptions as KarSimultaneousOptions,
  type ToEvent,
  type FromEvent,
} from "karabiner.ts";
import { varTapTapHoldFrom } from "./tap-hold";

// Internal: builds a raw FromEvent with from.simultaneous for the multi-tap path.
// (The tap-hold path uses mapSimultaneous directly, which handles this internally.)
function buildSimultaneousFromEvent(
  keys: string[],
  karOptions?: KarSimultaneousOptions,
): FromEvent {
  return {
    simultaneous: keys.map((k) => ({ key_code: k as any })),
    simultaneous_options: karOptions,
    modifiers: { optional: ["any"] },
  } as any;
}

export type SimultaneousTapHoldCoreOpts = {
  keys: string[];
  alone?: ToEvent[];
  hold?: ToEvent[];
  thresholdMs?: number;
  karOptions?: KarSimultaneousOptions;
  simultaneousThresholdMs?: number;
};

/** Tap-hold path: uses mapSimultaneous builder from karabiner.ts. */
export function simultaneousTapHold({
  keys,
  alone,
  hold,
  thresholdMs = 300,
  karOptions,
  simultaneousThresholdMs,
}: SimultaneousTapHoldCoreOpts): any[] {
  const builder = mapSimultaneous(
    keys as any[],
    karOptions,
    simultaneousThresholdMs,
  )
    .parameters({
      "basic.to_if_alone_timeout_milliseconds": thresholdMs,
      "basic.to_if_held_down_threshold_milliseconds": thresholdMs,
    })
    .modifiers("optionalAny");

  if (alone) alone.forEach((e) => builder.toIfAlone(e));
  if (hold) hold.forEach((e) => builder.toIfHeldDown(e));
  builder.toDelayedAction([], alone ?? []);

  return builder.build();
}

export type SimultaneousMultiTapCoreOpts = {
  keys: string[];
  label: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  tapTap?: ToEvent[];
  tapTapHold?: ToEvent[];
  thresholdMs?: number;
  karOptions?: KarSimultaneousOptions;
  simultaneousThresholdMs?: number;
};

/** Multi-tap path: uses varTapTapHoldFrom with a simultaneous from event. */
export function simultaneousMultiTap({
  keys,
  label,
  alone,
  hold,
  tapTap,
  tapTapHold,
  thresholdMs = 300,
  karOptions,
  simultaneousThresholdMs,
}: SimultaneousMultiTapCoreOpts): any[] {
  const from = buildSimultaneousFromEvent(keys, karOptions);
  const firstVar = `sim_tap_${label}`;

  const manipulators = varTapTapHoldFrom({
    from,
    firstVar,
    aloneEvents: alone,
    holdEvents: hold,
    tapTapEvents: tapTap,
    tapTapHoldEvents: tapTapHold,
    thresholdMs,
  });

  if (simultaneousThresholdMs !== undefined) {
    manipulators.forEach((m: any) => {
      m.parameters = {
        ...m.parameters,
        "basic.simultaneous_threshold_milliseconds": simultaneousThresholdMs,
      };
    });
  }

  return manipulators;
}
