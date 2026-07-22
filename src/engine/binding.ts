import type { ActionKeyModifier, ActionSpec } from "../core/action-dsl";
import {
  ifApp,
  map,
  rule,
  type FromEvent,
  type Manipulator,
  type Rule,
  type SimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
import { resolveActionToEvents } from "./action-resolver";
import { tapHold } from "../core/tap-hold";
import { varTapTapHold } from "../core/tap-hold";
import { simultaneousMultiTap, simultaneousTapHold } from "../core/simultaneous";
import { resolveModComboAlias } from "../data/key-aliases";

/** When in the key lifecycle the case's action fires. Maps to a Karabiner output channel. */
export type Phase = "press" | "release" | "hold";
// press      -> to
// release    -> to_if_alone   (tap: release within aloneMs, uninterrupted)
// hold       -> to_if_held_down

/** External state condition. Realized as a Karabiner `conditions[]` entry. */
export type Condition =
  | { app: string | string[]; unless?: boolean }
  | { var: string; equals: string | number; unless?: boolean }
  | { device: string; unless?: boolean }; // reserved for the later mouse round

export type SimOrder = {
  down?: "insensitive" | "strict" | "strict_inverse";
  up?: "insensitive" | "strict" | "strict_inverse";
  upWhen?: "any" | "all";
  detectUninterrupted?: boolean;
};

/** What was pressed. 1 key = single; 2+ keys = simultaneous chord. */
export type Trigger =
  | { keys: string[]; modifiers?: string[]; order?: SimOrder }
  | { pointer: string; modifiers?: string[] };

/** One (state + timing) -> action pairing. */
export type Case = {
  tapCount?: number; // default 1; 2 = double-tap, etc. (framework-managed state)
  phase?: Phase; // default "press"
  conditions?: Condition[];
  do: ActionSpec[]; // { type: "noop" } = swallow (omits `to`)
};

/** One binding = one description = one Karabiner rule. */
export type Binding = {
  description: string;
  trigger: Trigger;
  timing?: {
    aloneMs?: number;
    heldThresholdMs?: number;
    delayedMs?: number;
    simultaneousMs?: number;
  };
  conditions?: Condition[]; // hoisted — applied to every case
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: { allowPassThrough?: boolean; mods?: string[] };
  afterKeyUp?: ActionSpec[];
};

export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const ids = Array.isArray(c.app) ? c.app : [c.app];
    return c.unless ? ifApp(ids).unless().build() : ifApp(ids).build();
  }
  if ("var" in c) {
    return {
      type: c.unless ? "variable_unless" : "variable_if",
      name: c.var,
      value: c.equals,
    };
  }
  // device — reserved for the mouse round
  throw new Error("device conditions are not supported yet (mouse is out of scope)");
}

function resolveSimOrder(order?: SimOrder): SimultaneousOptions | undefined {
  if (!order) return undefined;
  const o: Record<string, unknown> = {};
  if (order.down) o.key_down_order = order.down;
  if (order.up) o.key_up_order = order.up;
  if (order.upWhen) o.key_up_when = order.upWhen;
  if (order.detectUninterrupted) o.detect_key_down_uninterruptedly = order.detectUninterrupted;
  return Object.keys(o).length ? (o as SimultaneousOptions) : undefined;
}

/**
 * Combine `trigger.order` (SimOrder) and `binding.afterKeyUp` (ActionSpec[])
 * back into the single `SimultaneousOptions` blob the core simultaneous
 * primitives expect. The adapter splits these when building a Binding; this
 * merges them on the way out so `from.simultaneous_options` ends up with both
 * `key_down_order`/etc. AND `to_after_key_up` exactly like the legacy generator.
 */
function resolveSimKarOptions(b: Binding): SimultaneousOptions | undefined {
  const order = resolveSimOrder("order" in b.trigger ? b.trigger.order : undefined);
  const afterKeyUp = b.afterKeyUp?.flatMap(resolveActionToEvents);
  if (!order && !afterKeyUp?.length) return undefined;
  return {
    ...(order ?? {}),
    ...(afterKeyUp?.length ? { to_after_key_up: afterKeyUp } : {}),
  };
}

export function triggerToFrom(trigger: Trigger): FromEvent {
  if ("pointer" in trigger) {
    const from: Record<string, unknown> = { pointing_button: trigger.pointer };
    if (trigger.modifiers?.length) from.modifiers = { mandatory: trigger.modifiers };
    return from as FromEvent;
  }
  if (trigger.keys.length > 1) {
    return {
      simultaneous: trigger.keys.map((k) => ({ key_code: k })),
      simultaneous_options: resolveSimOrder(trigger.order),
      modifiers: { optional: ["any"] },
    } as unknown as FromEvent;
  }
  const from: Record<string, unknown> = { key_code: trigger.keys[0] };
  if (trigger.modifiers?.length) from.modifiers = { mandatory: trigger.modifiers };
  return from as FromEvent;
}

type ResolvedCase = {
  tapCount: number;
  phase: Phase;
  conditions: unknown[];
  do: ToEvent[];
};

function resolveCases(cases: Case[], shared: Condition[] | undefined): ResolvedCase[] {
  return cases.map((c) => ({
    tapCount: c.tapCount ?? 1,
    phase: c.phase ?? "press",
    conditions: [...(shared ?? []), ...(c.conditions ?? [])].map(resolveCondition),
    do: (c.do ?? []).flatMap(resolveActionToEvents),
  }));
}

type CaseGroup = {
  conditions: unknown[];
  pressDo: ToEvent[];
  releaseDo: ToEvent[];
  holdDo: ToEvent[];
  // Phase presence is tracked separately from event count so an explicit
  // `{phase:"hold", do:[]}` (swallow hold) is distinguished from "no hold case"
  // (fall back to the default-alone pass-through, matching tap-hold-rules).
  hasRelease: boolean;
  hasHold: boolean;
};

/** Group cases that share the same condition signature into one manipulator. */
function groupByConditions(cases: ResolvedCase[]): CaseGroup[] {
  const groups = new Map<string, CaseGroup>();
  for (const c of cases) {
    const key = JSON.stringify(c.conditions);
    if (!groups.has(key)) {
      groups.set(key, {
        conditions: c.conditions,
        pressDo: [],
        releaseDo: [],
        holdDo: [],
        hasRelease: false,
        hasHold: false,
      });
    }
    const g = groups.get(key)!;
    if (c.phase === "press") g.pressDo.push(...c.do);
    if (c.phase === "release") {
      g.releaseDo.push(...c.do);
      g.hasRelease = true;
    }
    if (c.phase === "hold") {
      g.holdDo.push(...c.do);
      g.hasHold = true;
    }
  }
  return [...groups.values()];
}

export function defineBindings(bindings: Binding[]): Rule[] {
  return bindings.map((b) => rule(b.description).manipulators(buildManipulators(b)) as unknown as Rule);
}

function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  // A binding routes to the multiTap arm if any case has tapCount >= 2 OR the
  // binding declares `multiTap` config (e.g. generateMultiTapRule always sets
  // `multiTap: {allowPassThrough, mods}` even when no tap/hold cases are
  // provided — varTapTapHold still emits two manipulators in that case).
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2) || b.multiTap !== undefined;
  const isSim = "keys" in b.trigger && b.trigger.keys.length > 1;
  if (hasMultiTap) return buildMultiTap(b, resolved, isSim);
  if (isSim) return buildSimultaneousTapHold(b, resolved);
  return groupByConditions(resolved).flatMap((g) =>
    g.hasRelease || g.hasHold ? buildTapHold(b, g) : buildRemap(b, g, false),
  );
}

function buildMultiTap(b: Binding, cases: ResolvedCase[], isSim: boolean): Manipulator[] {
  const key = isSim ? "" : (b.trigger as { keys: string[] }).keys[0]!;
  const byPhase = (p: Phase, tapCount = 1) =>
    cases.filter((c) => c.tapCount === tapCount && c.phase === p).flatMap((c) => c.do);
  const threshold = b.timing?.aloneMs ?? b.timing?.heldThresholdMs;
  if (isSim) {
    const keys = (b.trigger as { keys: string[] }).keys;
    const label = keys.join("");
    const manipulators = simultaneousMultiTap({
      keys,
      label,
      alone: byPhase("release"),
      hold: byPhase("hold"),
      tapTap: cases.filter((c) => c.tapCount === 2 && c.phase === "release").flatMap((c) => c.do),
      tapTapHold: cases.filter((c) => c.tapCount === 2 && c.phase === "hold").flatMap((c) => c.do),
      thresholdMs: threshold,
      karOptions: resolveSimKarOptions(b),
      simultaneousThresholdMs: b.timing?.simultaneousMs,
    });
    attachConditions(manipulators, cases);
    return manipulators;
  }
  const manipulators = varTapTapHold({
    key,
    firstTapPendingVar: `multi_tap_${key}`,
    immediateSingleTapEvents: byPhase("release"),
    holdEvents: byPhase("hold"),
    doubleTapEvents: cases.filter((c) => c.tapCount === 2 && c.phase === "release").flatMap((c) => c.do),
    doubleTapHoldEvents: cases.filter((c) => c.tapCount === 2 && c.phase === "hold").flatMap((c) => c.do),
    thresholdMs: threshold,
    allowPassThrough: b.multiTap?.allowPassThrough,
    mods: b.multiTap?.mods as any,
  });
  attachConditions(manipulators, cases);
  return manipulators;
}

function buildSimultaneousTapHold(b: Binding, cases: ResolvedCase[]): Manipulator[] {
  const keys = (b.trigger as { keys: string[] }).keys;
  const byPhase = (p: Phase) => cases.filter((c) => c.phase === p).flatMap((c) => c.do);
  const manipulators = simultaneousTapHold({
    keys,
    alone: byPhase("release"),
    hold: byPhase("hold"),
    thresholdMs: b.timing?.aloneMs,
    karOptions: resolveSimKarOptions(b),
    simultaneousThresholdMs: b.timing?.simultaneousMs,
  });
  attachConditions(manipulators, cases);
  return manipulators;
}

/** Push resolved case conditions onto every manipulator (hoisted + per-case). */
function attachConditions(manipulators: Manipulator[], cases: ResolvedCase[]): void {
  const conds = cases.flatMap((c) => c.conditions);
  if (!conds.length) return;
  manipulators.forEach((m: any) => {
    m.conditions = m.conditions || [];
    m.conditions.push(...conds);
  });
}

function buildTapHold(b: Binding, g: CaseGroup): Manipulator | Manipulator[] {
  if ("pointer" in b.trigger) {
    throw new Error("tapHold pointer triggers are not supported (mouse is out of scope)");
  }
  const keys = (b.trigger as { keys: string[] }).keys;
  const key = keys[0]!;
  const mods = (b.trigger as { modifiers?: string[] }).modifiers ?? [];
  const defaultAlone: ActionSpec[] = [
    { type: "key", key, modifiers: mods as ActionKeyModifier[], options: { halt: true } },
  ];
  // Match tap-hold-rules: `resolvedAlone = config.alone ?? defaultAlone` and
  // `resolvedHold = config.hold ?? defaultAlone`. An explicit phase with empty
  // `do` (e.g. `hold: []`) is *not* a missing phase — it means "emit nothing"
  // and must not trigger the default-alone fallback. Phase presence is tracked
  // in the CaseGroup (`hasRelease` / `hasHold`), not inferred from event count.
  const alone = g.hasRelease ? g.releaseDo : defaultAlone.flatMap((a) => resolveActionToEvents(a));
  const hold = g.hasHold ? g.holdDo : defaultAlone.flatMap((a) => resolveActionToEvents(a));
  const manipulators = tapHold({
    key,
    alone,
    hold,
    timeoutMs: b.timing?.aloneMs,
    thresholdMs: b.timing?.heldThresholdMs,
  }).build();
  // Inject mandatory from-modifiers exactly like tap-hold-rules (vm alias -> resolved mods)
  if (mods.length) {
    const mandatory = mods.flatMap((m) => resolveModComboAlias(m) ?? [m]);
    manipulators.forEach((m: any) => {
      m.from.modifiers = m.from.modifiers || {};
      m.from.modifiers.mandatory = mandatory;
    });
  }
  g.conditions.forEach((cond) =>
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];
      m.conditions.push(cond);
    }),
  );
  return manipulators;
}

function buildRemap(
  b: Binding,
  g: { conditions: unknown[]; pressDo: ToEvent[] },
  isPointer: boolean,
): Manipulator | Manipulator[] {
  const builder = isPointer
    ? map({ pointing_button: (b.trigger as { pointer: string }).pointer } as any)
    : map(triggerToFrom(b.trigger));
  for (const cond of g.conditions) builder.condition(cond as any);
  // pressDo may be empty (noop) -> omit `to` (swallow). map().build() already omits empty `to`.
  for (const e of g.pressDo) builder.to(e);
  return builder.build();
}
