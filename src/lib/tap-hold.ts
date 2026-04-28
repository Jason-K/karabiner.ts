import type {
  BasicManipulator,
  FromEvent,
  Modifier,
  ToEvent,
} from "karabiner.ts";
import { ifApp, map, toKey, toSetVar } from "karabiner.ts";

/**
 * Configuration for basic tap-hold behavior
 */
interface TapHoldOpts {
  key: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
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
}

interface TapHoldFromOpts extends Omit<TapHoldOpts, "key"> {
  from: FromEvent;
}

interface VarTapTapHoldFromOpts extends Omit<VarTapTapHoldOpts, "key"> {
  from: FromEvent;
  passThrough?: ToEvent;
}

function cloneFromEvent(from: FromEvent): FromEvent {
  return JSON.parse(JSON.stringify(from)) as FromEvent;
}

export function tapHoldFrom({
  from,
  alone,
  hold,
  timeoutMs = 300,
  thresholdMs = 300,
  description,
  cancel,
  invoked,
  appOverrides,
}: TapHoldFromOpts) {
  const builders: any[] = [];

  const makeBuilder = (opts: {
    alone?: ToEvent[];
    hold?: ToEvent[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ToEvent[];
    invoked?: ToEvent[];
    cond?: any;
  }) => {
    const m = map(cloneFromEvent(from)).parameters({
      "basic.to_if_alone_timeout_milliseconds": opts.timeoutMs ?? timeoutMs,
      "basic.to_if_held_down_threshold_milliseconds":
        opts.thresholdMs ?? thresholdMs,
    });
    if (opts.cond) m.condition(opts.cond);
    if (opts.alone) opts.alone.forEach((e: ToEvent) => m.toIfAlone(e));
    if (opts.hold) opts.hold.forEach((e: ToEvent) => m.toIfHeldDown(e));

    const cancelEvents = opts.cancel ?? cancel ?? alone ?? [];
    const invokedEvents = opts.invoked ?? invoked ?? [];
    m.toDelayedAction(invokedEvents, cancelEvents);
    return m;
  };

  if (appOverrides && Array.isArray(appOverrides)) {
    appOverrides.forEach((ov) => {
      const matcher = ov.app;
      let cond = ifApp(matcher);
      if (ov.unless) cond = cond.unless();
      builders.push(
        makeBuilder({
          alone: ov.alone,
          hold: ov.hold,
          timeoutMs: ov.timeoutMs,
          thresholdMs: ov.thresholdMs,
          cancel: ov.cancel,
          invoked: ov.invoked,
          cond,
        }),
      );
    });
  }

  builders.push(makeBuilder({ alone, hold }));

  return {
    build: () => builders.flatMap((b) => b.build()),
  };
}

/**
 * Creates a tap-hold manipulator with proper to_delayed_action support.
 */
export function tapHold({
  key,
  alone,
  hold,
  timeoutMs = 300,
  thresholdMs = 300,
  description,
  cancel,
  invoked,
  appOverrides,
}: TapHoldOpts) {
  return tapHoldFrom({
    from: { key_code: key as any },
    alone,
    hold,
    timeoutMs,
    thresholdMs,
    description,
    cancel,
    invoked,
    appOverrides,
  });
}

/**
 * Configuration for double-tap-hold patterns with variables
 */
interface VarTapTapHoldOpts extends Omit<TapHoldOpts, "alone" | "hold"> {
  key: string;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  holdMods?: Modifier[];
  allowPassThrough?: boolean;
  mods?: Modifier[];
}

export function varTapTapHoldFrom({
  from,
  firstVar,
  aloneEvents,
  holdEvents,
  tapTapEvents,
  tapTapHoldEvents,
  holdMods,
  thresholdMs = 300,
  description,
  allowPassThrough,
  mods,
  passThrough,
}: VarTapTapHoldFromOpts) {
  const fromEvent = cloneFromEvent(from) as any;
  const modifiers =
    mods !== undefined
      ? mods.length === 0
        ? {}
        : { mandatory: mods }
      : (fromEvent.modifiers ?? { optional: ["any"] });
  const secondTap: BasicManipulator = {
    type: "basic",
    from: {
      ...cloneFromEvent(from),
      modifiers,
    },
    conditions: [{ type: "variable_if", name: firstVar, value: 1 }],
    parameters: {
      "basic.to_if_alone_timeout_milliseconds": thresholdMs,
      "basic.to_if_held_down_threshold_milliseconds": thresholdMs,
    },
    description:
      description || `${firstVar} second tap (tap-tap / tap-tap-hold)`,
    to_if_alone: [toSetVar(firstVar, 0), ...(tapTapEvents ?? [])],
    to_if_held_down: [toSetVar(firstVar, 0), ...(tapTapHoldEvents ?? [])],
    to_delayed_action: {
      to_if_invoked: [toSetVar(firstVar, 0)],
      to_if_canceled: [toSetVar(firstVar, 0)],
    },
  } as any;

  let firstTap: BasicManipulator;

  if (allowPassThrough) {
    firstTap = {
      type: "basic",
      from: {
        ...cloneFromEvent(from),
        modifiers,
      },
      parameters: {
        "basic.to_delayed_action_delay_milliseconds": thresholdMs,
        "basic.to_if_held_down_threshold_milliseconds": thresholdMs,
      },
      description: description || `${firstVar} first tap (pass-through)`,
      to: [toSetVar(firstVar, 1), ...(passThrough ? [passThrough] : [])],
      to_if_held_down: [toSetVar(firstVar, 0), ...(holdEvents ?? [])],
      to_delayed_action: {
        to_if_invoked: [toSetVar(firstVar, 0)],
        to_if_canceled: [toSetVar(firstVar, 0)],
      },
    } as any;
  } else {
    firstTap = {
      type: "basic",
      from: {
        ...cloneFromEvent(from),
        modifiers,
      },
      parameters: {
        "basic.to_delayed_action_delay_milliseconds": thresholdMs,
        "basic.to_if_held_down_threshold_milliseconds": thresholdMs,
        "basic.to_if_alone_timeout_milliseconds": thresholdMs,
      },
      description: description || `${firstVar} first tap (tap / tap-hold)`,
      to: [toSetVar(firstVar, 1)],
      to_if_alone: [toSetVar(firstVar, 1), ...(aloneEvents ?? [])],
      to_if_held_down: [toSetVar(firstVar, 0), ...(holdEvents ?? [])],
      to_delayed_action: {
        to_if_invoked: [toSetVar(firstVar, 0)],
        to_if_canceled: [toSetVar(firstVar, 0)],
      },
    } as any;
  }

  return [secondTap, firstTap];
}

/**
 * Creates a complex double-tap-hold pattern using variable tracking.
 */
export function varTapTapHold({
  key,
  firstVar,
  aloneEvents,
  holdEvents,
  tapTapEvents,
  tapTapHoldEvents,
  holdMods,
  thresholdMs = 300,
  description,
  allowPassThrough,
  mods,
}: VarTapTapHoldOpts) {
  return varTapTapHoldFrom({
    from: { key_code: key as any },
    passThrough: allowPassThrough
      ? toKey(key as any, [], { lazy: true })
      : undefined,
    firstVar,
    aloneEvents,
    holdEvents,
    tapTapEvents,
    tapTapHoldEvents,
    holdMods,
    thresholdMs,
    description,
    allowPassThrough,
    mods,
  });
}
