import {
  mapSimultaneous,
  type FromEvent,
  type SimultaneousOptions as KarSimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
import type { Binding, SimOrder } from "../../data";
import { varTapTapHoldFrom } from "./tap-hold";
import { isPointerButton, resolveButton, resolveKeyAlias } from "../utils";
import { resolveActionToEvents } from "../resolve-to-action";

export function resolveSimOrder(order?: SimOrder): KarSimultaneousOptions | undefined {
  if (!order) return undefined;
  const o: Record<string, unknown> = {};
  if (order.down) o.key_down_order = order.down;
  if (order.up) o.key_up_order = order.up;
  if (order.upWhen) o.key_up_when = order.upWhen;
  if (order.detectUninterrupted)
    o.detect_key_down_uninterruptedly = order.detectUninterrupted;
  return Object.keys(o).length ? (o as KarSimultaneousOptions) : undefined;
}

export function resolveSimKarOptions(b: Binding): KarSimultaneousOptions | undefined {
  const order = resolveSimOrder(
    "order" in b.trigger ? b.trigger.order : undefined,
  );
  const afterKeyUp = b.afterKeyUp?.flatMap(resolveActionToEvents);
  if (!order && !afterKeyUp?.length) return undefined;
  return {
    ...(order ?? {}),
    ...(afterKeyUp?.length ? { to_after_key_up: afterKeyUp } : {}),
  };
}


function mapSimKey(k: string): any {
  return isPointerButton(k)
    ? { pointing_button: resolveButton(k).button }
    : resolveKeyAlias(k);
}

// Internal: builds a raw FromEvent with from.simultaneous for the multi-tap path.
// (The tap-hold path uses mapSimultaneous directly, which handles this internally.)
function buildSimultaneousFromEvent(
  keys: string[],
  karOptions?: KarSimultaneousOptions,
): FromEvent {
  return {
    simultaneous: keys.map((k) =>
      isPointerButton(k)
        ? ({ pointing_button: resolveButton(k).button } as any)
        : ({ key_code: resolveKeyAlias(k) } as any),
    ),
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
  const mappedKeys = keys.map(mapSimKey);
  const builder = mapSimultaneous(
    mappedKeys as any[],
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
  const firstTapPendingVar = `sim_tap_${label}`;

  const manipulators = varTapTapHoldFrom({
    from,
    firstTapPendingVar,
    immediateSingleTapEvents: alone,
    holdEvents: hold,
    doubleTapEvents: tapTap,
    doubleTapHoldEvents: tapTapHold,
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
