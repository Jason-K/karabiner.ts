import type { ActionKeyModifier, ActionSpec } from "../core/action-dsl";
import {
  ifApp,
  ifDevice,
  map,
  rule,
  type FromEvent,
  type Manipulator,
  type Rule,
  type SimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
import { resolveActionToEvents } from "./action-resolver";
import { synthesizeManipulatorLabel, synthesizeRuleDescription } from "./description-synthesizer";
import { tapHold } from "../core/tap-hold";
import { varTapTapHold } from "../core/tap-hold";
import { simultaneousMultiTap, simultaneousTapHold } from "../core/simultaneous";
import { resolveModComboAlias } from "../data/key-aliases";
import { karabinerDeviceId } from "../data/devices";
import { DEVICE_IDENTIFIERS } from "../data";
import { resolveButton } from "../data/mouse";
import type { AppRef, DeviceSpec, VarSpec } from "../data";

/** When in the key lifecycle the case's action fires. Maps to a Karabiner output channel. */
export type Phase = "press" | "release" | "hold";
// press      -> to
// release    -> to_if_alone   (tap: release within aloneMs, uninterrupted)
// hold       -> to_if_held_down

/** External state condition. Realized as a Karabiner `conditions[]` entry. */
export type Condition =
  | { app: AppRef | AppRef[]; unless?: boolean; description?: string }
  | { var: VarSpec; equals: string | number; unless?: boolean; description?: string }
  | { device: DeviceSpec; unless?: boolean; description?: string };

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
  description?: string; // optional fragment; when set, used as this case's action line verbatim
  suppress?: boolean; // emit only `do`, no trigger fallback (this case's channel)
};

/** One binding = one description = one Karabiner rule. */
export type Binding = {
  description?: string; // absent -> auto-derived by the synthesizer (Phase 2)
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
  whileHoldVar?: VarSpec; // tap-hold: set 1 on key-down, 0 on key-up (chord-modifier signaling)
  suppress?: boolean; // emit only `do`, no trigger fallback (e.g. tap-hold default-alone)
  suppressCancelFallback?: boolean; // clear to_if_canceled (chord-modifier buttons)
};

export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const refs = Array.isArray(c.app) ? c.app : [c.app];
    const ids = refs.flatMap((r) => (Array.isArray(r.name) ? r.name : [r.name]));
    return c.unless ? ifApp(ids).unless().build() : ifApp(ids).build();
  }
  if ("var" in c) {
    return {
      type: c.unless ? "variable_unless" : "variable_if",
      name: c.var.name,
      value: c.equals,
    };
  }
  // device
  return c.unless
    ? ifDevice(karabinerDeviceId(c.device)).unless().build()
    : ifDevice(karabinerDeviceId(c.device)).build();
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
    const { button } = resolveButton(trigger.pointer);
    const from: Record<string, unknown> = { pointing_button: button };
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
  rawConditions: Condition[]; // original Condition[] — for slice-labels (Phase 2)
  do: ToEvent[];
};

function resolveCases(cases: Case[], shared: Condition[] | undefined): ResolvedCase[] {
  return cases.map((c) => {
    const rawConditions = [...(shared ?? []), ...(c.conditions ?? [])];
    return {
      tapCount: c.tapCount ?? 1,
      phase: c.phase ?? "press",
      conditions: rawConditions.map(resolveCondition),
      rawConditions,
      do: (c.do ?? []).flatMap(resolveActionToEvents),
    };
  });
}

type CaseGroup = {
  conditions: unknown[];
  rawConditions: Condition[];
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
        rawConditions: c.rawConditions,
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
  return bindings.map((b) =>
    rule(b.description ?? synthesizeRuleDescription(b))
      .manipulators(buildManipulators(b)) as unknown as Rule,
  );
}

function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  // A binding routes to the multiTap arm if any case has tapCount >= 2 OR the
  // binding declares `multiTap` config (e.g. a left-command multi-tap binding
  // sets `multiTap: {allowPassThrough, mods}` even when no tap/hold cases are
  // provided — varTapTapHold still emits two manipulators in that case).
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2) || b.multiTap !== undefined;
  const isPointer = "pointer" in b.trigger;
  const isSim = !isPointer && "keys" in b.trigger && b.trigger.keys.length > 1;
  let manipulators: Manipulator[];
  if (hasMultiTap) manipulators = buildMultiTap(b, resolved, isSim);
  else if (isSim) manipulators = buildSimultaneousTapHold(b, resolved);
  else
    manipulators = groupByConditions(resolved).flatMap((g) =>
      g.hasRelease || g.hasHold ? buildTapHold(b, g) : buildRemap(b, g, isPointer),
    );
  stampDeviceScope(manipulators, b.trigger);
  return manipulators;
}

/** For a device-specific button alias, add a `device_if` condition to every manipulator. */
function stampDeviceScope(manipulators: Manipulator[], trigger: Trigger): void {
  if (!("pointer" in trigger)) return;
  const { nameScope } = resolveButton(trigger.pointer);
  if (!nameScope || nameScope === "global") return;
  const ids = nameScope.map((n) => karabinerDeviceId(DEVICE_IDENTIFIERS[n]));
  const cond = ifDevice(ids).build();
  manipulators.forEach((m: any) => {
    m.conditions = [...(m.conditions ?? []), cond];
  });
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
    stampLabel(manipulators, unionRawConditions(cases));
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
  stampLabel(manipulators, unionRawConditions(cases));
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
  stampLabel(manipulators, unionRawConditions(cases));
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

/** Unique union of raw conditions across cases (for multiTap/simultaneous slice-labels). */
function unionRawConditions(cases: ResolvedCase[]): Condition[] {
  const seen = new Set<string>();
  const out: Condition[] = [];
  for (const c of cases) {
    for (const cond of c.rawConditions) {
      const key = JSON.stringify(cond);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cond);
      }
    }
  }
  return out;
}

/** Stamp the condition-group slice-label onto every manipulator (no-op when unconditional). */
function stampLabel(manipulators: Manipulator[], conditions: Condition[] | undefined): void {
  const label = synthesizeManipulatorLabel(conditions);
  if (!label) return;
  manipulators.forEach((m: any) => {
    m.description = label;
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
    ...(b.whileHoldVar ? { variable: b.whileHoldVar.name } : {}),
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
  // Chord-modifier levers: clear the cancel fallback (no stray click on canceled
  // hold) and/or drop the default-alone pass-through (emit only `do`).
  if (b.suppressCancelFallback) {
    manipulators.forEach((m: any) => {
      if (m.to_delayed_action?.to_if_canceled) m.to_delayed_action.to_if_canceled = [];
    });
  }
  if (b.suppress) {
    manipulators.forEach((m: any) => {
      m.to_if_alone = [];
    });
  }
  stampLabel(manipulators, g.rawConditions);
  return manipulators;
}

function buildRemap(
  b: Binding,
  g: { conditions: unknown[]; rawConditions: Condition[]; pressDo: ToEvent[] },
  isPointer: boolean,
): Manipulator | Manipulator[] {
  const label = synthesizeManipulatorLabel(g.rawConditions);
  if (isPointer) {
    // Pointer manipulators are emitted as raw objects to match the legacy
    // pointer-remap-rules shape exactly: {type, from, to, description?, conditions?}.
    const pointer = b.trigger as { pointer: string; modifiers?: string[] };
    const from: Record<string, unknown> = { pointing_button: pointer.pointer };
    if (pointer.modifiers?.length) {
      from.modifiers = { mandatory: pointer.modifiers };
    }
    const m: Record<string, unknown> = { type: "basic", from, to: g.pressDo };
    if (label) m.description = label;
    if (g.conditions.length) m.conditions = g.conditions;
    return m as unknown as Manipulator;
  }
  const builder = map(triggerToFrom(b.trigger));
  if (label) builder.description(label);
  for (const cond of g.conditions) builder.condition(cond as any);
  // pressDo may be empty (noop) -> omit `to` (swallow). map().build() already omits empty `to`.
  for (const e of g.pressDo) builder.to(e);
  return builder.build();
}
