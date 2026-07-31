import {
  ifApp,
  ifDevice,
  map,
  rule,
  toPointingButton,
  toSetVar,
  type FromEvent,
  type Manipulator,
  type PointingButton,
  type Rule,
  type SimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
import type { Action, ActionKeyModifier, ActionSpec } from "./action-dsl";
import {
  simultaneousMultiTap,
  simultaneousTapHold,
} from "./simultaneous-core";
import {
  tapHold,
  tapHoldFrom,
  varTapTapHold,
  varTapTapHoldFrom,
} from "./tap-hold";
import type { AppRef, DeviceSpec, PathRef, VarSpec } from "../data";
import { DEFAULT_MOUSE_MANIPULATOR_TIMINGS, DEVICES, isModifierKey, TIMINGS } from "../data";
import { karabinerDeviceId } from "./device-config";
import { resolveActionToEvents, resolveModComboAlias } from "./action-resolver";
import { isPointerButton, resolveButton } from "./binding-helpers";

import {
  synthesizeManipulatorLabel,
  synthesizeRuleDescription,
} from "./description-synthesizer";

/** When in the key lifecycle the case's action fires. Maps to a Karabiner output channel. */
export type Phase = "press" | "release" | "hold";
// press      -> to
// release    -> to_if_alone   (tap: release within aloneMs, uninterrupted)
// hold       -> to_if_held_down

/** External state condition. Realized as a Karabiner `conditions[]` entry. */
export type Condition =
  | {
    app: AppRef | PathRef | (AppRef | PathRef)[];
    unless?: boolean;
    description?: string;
  }
  | {
    var: VarSpec;
    equals: string | number;
    unless?: boolean;
    description?: string;
  }
  | { device: DeviceSpec; unless?: boolean; description?: string };

export type SimOrder = {
  down?: "insensitive" | "strict" | "strict_inverse";
  up?: "insensitive" | "strict" | "strict_inverse";
  upWhen?: "any" | "all";
  detectUninterrupted?: boolean;
};

export type TriggerModifiers =
  | string[]
  | { mandatory?: string[]; optional?: string[] };

/** What was pressed. 1 key = single; 2+ keys = simultaneous chord. */
export type Trigger =
  | { keys: string[]; modifiers?: TriggerModifiers; order?: SimOrder }
  | { pointer: string; modifiers?: TriggerModifiers };

/** One (state + timing) -> action pairing. */
export type Case = {
  tapCount?: number; // default 1; 2 = double-tap, etc. (framework-managed state)
  phase?: Phase; // default "press"
  conditions?: Condition[];
  do: Action[]; // { type: "noop" } = swallow (omits `to`); raw ToEvent = verbatim passthrough
  description?: string; // optional fragment; when set, used as this case's action line verbatim
  suppress?: boolean; // emit only `do`, no trigger fallback (this case's channel)
  delayed?: boolean; // multi-tap: route this tap1 release as a delayed single tap (to_if_invoked after the timer) instead of immediate (to_if_alone)
  guard?: boolean; // double-tap guard: require two presses within a timeout before firing the combo (routes to buildGuard)
};

/** One binding = one description = one Karabiner rule. */
export type Binding = {
  description?: string; // absent -> auto-derived by the synthesizer (Phase 2)
  trigger: Trigger;
  timing?: {
    aloneMs?: number;
    holdMs?: number;
    heldThresholdMs?: number;
    delayedMs?: number;
    simultaneousMs?: number;
  };
  conditions?: Condition[]; // hoisted — applied to every case
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: {
    allowPassThrough?: boolean;
    mods?: string[];
    firstTapPendingVar?: VarSpec;
  };
  afterKeyUp?: ActionSpec[];
  whileHoldVar?: VarSpec; // tap-hold: set 1 on key-down, 0 on key-up (chord-modifier signaling)
  suppress?: boolean; // emit only `do`, no trigger fallback (e.g. tap-hold default-alone)
  suppressCancelFallback?: boolean; // clear to_if_canceled (chord-modifier buttons)
  modWhileDown?: boolean; // modifier asserted while key is down (in `to`), no hold threshold / delayed action
  guardVar?: string; // override the derived guard_<mod>_<key> variable name
  guardMs?: number; // double-tap guard timeout (default TIMINGS.timeoutDoubleTapMs)
};

export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const refs = Array.isArray(c.app) ? c.app : [c.app];
    const bundleIds: string[] = [];
    const filePaths: string[] = [];
    for (const r of refs) {
      const names = Array.isArray(r.name) ? r.name : [r.name];
      if (r.type === "path") {
        filePaths.push(...names);
      } else {
        bundleIds.push(...names);
      }
    }
    const builder =
      filePaths.length > 0 && bundleIds.length > 0
        ? ifApp({ bundle_identifiers: bundleIds, file_paths: filePaths })
        : filePaths.length > 0
          ? ifApp({ file_paths: filePaths })
          : ifApp(bundleIds);
    return c.unless ? builder.unless().build() : builder.build();
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
  if (order.detectUninterrupted)
    o.detect_key_down_uninterruptedly = order.detectUninterrupted;
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

export function resolveModifiers(m?: TriggerModifiers): {
  mandatory: string[];
  optional: string[];
} {
  if (!m) {
    return { mandatory: [], optional: [] };
  }
  const resolveList = (list: string[]) => {
    const expanded: string[] = [];
    const seen = new Set<string>();
    for (const mod of list) {
      for (const resolved of resolveModComboAlias(mod) ?? [mod]) {
        if (!seen.has(resolved)) {
          seen.add(resolved);
          expanded.push(resolved);
        }
      }
    }
    return expanded;
  };

  if (Array.isArray(m)) {
    return {
      mandatory: resolveList(m),
      optional: [],
    };
  }
  return {
    mandatory: resolveList(m.mandatory ?? []),
    optional: resolveList(m.optional ?? []),
  };
}

/**
 * Build the `from.modifiers` object for a manipulator's `from` event from a
 * trigger's resolved modifiers. Mirrors the three-branch convention used across
 * the tap-hold / remap paths: `mandatory` and `optional` only when non-empty,
 * falling back to `{ optional: [] }` when neither is set. Kept as a single
 * shared helper so the three consumers cannot drift.
 */
export function fromModifiersObj(
  trigger: Trigger,
): Record<string, string[]> {
  const { mandatory, optional } = resolveModifiers(trigger.modifiers);
  const modifiersObj: Record<string, string[]> = {};
  if (mandatory.length) modifiersObj.mandatory = mandatory;
  if (optional.length) modifiersObj.optional = optional;
  else if (!mandatory.length) modifiersObj.optional = [];
  return modifiersObj;
}

export function getTriggerKeys(trigger: Trigger): string[] {
  return "keys" in trigger ? trigger.keys : [trigger.pointer];
}

export function triggerToFrom(trigger: Trigger): FromEvent {
  const { mandatory, optional } = resolveModifiers(trigger.modifiers);
  const keys = getTriggerKeys(trigger);
  if (keys.length > 1) {
    return {
      simultaneous: keys.map((k) =>
        isPointerButton(k)
          ? { pointing_button: resolveButton(k).button }
          : { key_code: k },
      ),
      simultaneous_options: resolveSimOrder("order" in trigger ? trigger.order : undefined),
      modifiers: { optional: ["any"] },
    } as unknown as FromEvent;
  }
  const k = keys[0]!;
  const from: Record<string, unknown> = isPointerButton(k)
    ? { pointing_button: resolveButton(k).button }
    : { key_code: k };
  const modifiersObj: Record<string, string[]> = {};
  if (mandatory.length) modifiersObj.mandatory = mandatory;
  if (optional.length) modifiersObj.optional = optional;
  else if (!mandatory.length) modifiersObj.optional = [];
  from.modifiers = modifiersObj;
  return from as FromEvent;
}

type ResolvedCase = {
  tapCount: number;
  phase: Phase;
  delayed: boolean;
  guard: boolean;
  conditions: unknown[];
  rawConditions: Condition[]; // original Condition[] — for slice-labels (Phase 2)
  do: ToEvent[];
};

function resolveCases(
  cases: Case[],
  shared: Condition[] | undefined,
): ResolvedCase[] {
  return cases.map((c) => {
    const rawConditions = [...(shared ?? []), ...(c.conditions ?? [])];
    return {
      tapCount: c.tapCount ?? 1,
      phase: c.phase ?? "press",
      delayed: c.delayed ?? false,
      guard: c.guard ?? false,
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

/**
 * Fold an unconditional release-only (tap) group into the conditional hold
 * groups.
 *
 * When a binding pairs an unconditional tap with conditional holds (e.g.
 * `return_or_enter`: tap passes through; hold runs a shell outside Excel and
 * emits F2 inside Excel), `groupByConditions` would otherwise emit the tap as
 * its own no-conditions manipulator. That manipulator competes for the key in
 * every app and blocks both the normal tap and the conditional holds.
 *
 * A conditional **hold** group lacking its own release already synthesizes a
 * default-alone pass-through (a halted re-emit of the trigger key) for its
 * `to_if_alone` (`buildKeyTapHold`), so a tap is already covered in every
 * condition and the unconditional group is redundant — it is dropped, and its
 * tap action is injected as the `alone` of each hold-only group so a custom
 * (non-trigger) tap is preserved.
 *
 * Conditional **press** (remap) groups are left untouched: they carry no tap
 * pass-through, so the unconditional tap must remain a separate manipulator.
 */
function distributeUnconditionalTap(groups: CaseGroup[]): CaseGroup[] {
  if (groups.length < 2) return groups;
  const defaultIdx = groups.findIndex(
    (g) =>
      g.conditions.length === 0 &&
      g.hasRelease &&
      !g.hasHold &&
      g.pressDo.length === 0,
  );
  if (defaultIdx < 0) return groups;
  const defaultTap = groups[defaultIdx]!.releaseDo;
  const isHoldOnly = (g: CaseGroup) =>
    g.conditions.length > 0 && g.hasHold && !g.hasRelease;
  // Only fold when at least one conditional hold-only group can carry the tap;
  // otherwise keep the standalone group (e.g. an unconditional tap paired with
  // a conditional remap must remain its own manipulator).
  if (!groups.some(isHoldOnly)) return groups;
  return groups
    .filter((_, i) => i !== defaultIdx)
    .map((g) =>
      isHoldOnly(g) ? { ...g, releaseDo: defaultTap, hasRelease: true } : g,
    );
}

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
  return bindings.map(
    (b) =>
      rule(b.description ?? synthesizeRuleDescription(b)).manipulators(
        buildManipulators(b),
      ) as unknown as Rule,
  );
}

/**
 * Normalize a Karabiner modifier token to its short form for use in derived
 * variable names (e.g. `guard_cmd_q`): strip a leading `left_`/`right_` prefix,
 * then alias `command→cmd`, `control→ctrl`, `option→opt`. Anything else (e.g.
 * `shift`, `fn`) passes through unchanged. Single source of truth for the
 * bespoke modifier-shortening convention; `deriveGuardVar` is its only caller
 * today, but extracting it keeps the convention testable in isolation.
 */
export function normalizeModifier(mod: string): string {
  return mod
    .replace(/^(left|right)_/, "")
    .replace("command", "cmd")
    .replace("control", "ctrl")
    .replace("option", "opt");
}

/**
 * Derive the double-tap guard variable name from the trigger, matching the
 * bespoke `deriveGuardVar` convention: `guard_<normalizedMod>_<key>`, where the
 * modifier is the first mandatory trigger modifier normalized via
 * `normalizeModifier`. A trigger with no modifiers uses `<mod> = "none"`.
 */
function deriveGuardVar(trigger: Trigger): string {
  const key = getTriggerKeys(trigger)[0] ?? "none";
  const mods = resolveModifiers(trigger.modifiers).mandatory;
  const firstMod = mods[0];
  const normalized = firstMod ? normalizeModifier(firstMod) : "none";
  return `guard_${normalized}_${key}`;
}

/**
 * Double-tap guard arm: require two presses of the trigger combo within a
 * timeout before firing the real combo. Emits two manipulators —
 *   (1) second press (guard var = 1): fires the combo in `to`, resets the var;
 *   (2) first press  (guard var = 0): arms the var, disarmed by a
 *       `to_delayed_action` whether the delay invokes (timeout) or is canceled
 *       (another key pressed).
 * This bypasses `varTapTapHold`, which routes the combo into `to_if_alone` and
 * cannot reproduce the guard's immediate fire-on-second-press semantics.
 * Hoisted binding conditions attach to BOTH manipulators.
 */
function buildGuard(b: Binding, resolved: ResolvedCase[]): Manipulator[] {
  const key = getTriggerKeys(b.trigger)[0]!;
  const guardCases = resolved.filter((c) => c.guard);
  // A guard binding must be exactly one `guard()` case. Multiple guards or a
  // guard mixed with other cases (tap/hold) would silently drop cases here —
  // fail loudly at generation time instead of emitting wrong output (matches
  // assertUniqueTriggers' throw-on-invalid-authoring convention).
  if (guardCases.length !== 1 || resolved.length !== 1) {
    throw new Error(
      `A double-tap guard binding must have exactly one guard() case, but trigger "${JSON.stringify(b.trigger)}" has ${guardCases.length} guard case(s) among ${resolved.length} total case(s).`,
    );
  }
  const guardCase = guardCases[0]!;
  const varName = b.guardVar ?? deriveGuardVar(b.trigger);
  const timeoutMs = b.guardMs ?? TIMINGS.timeoutDoubleTapMs;
  const combo = guardCase.do;
  const modifiersObj = fromModifiersObj(b.trigger);
  // Hoisted conditions attach to both manipulators, device_if last.
  const conds = deviceLast(resolved.flatMap((c) => c.conditions));

  // Second press: var = 1 → fire combo, reset var.
  const secondPress = map(key as any);
  secondPress.condition({ type: "variable_if", name: varName, value: 1 } as any);
  for (const e of combo) secondPress.to(e);
  secondPress.to(toSetVar(varName, 0));
  for (const c of conds) secondPress.condition(c as any);
  (secondPress as any).from.modifiers = modifiersObj;

  // First press: var = 0 → arm var, delayed-action disarms.
  const firstPress = map(key as any);
  firstPress.condition({ type: "variable_if", name: varName, value: 0 } as any);
  firstPress.parameters({ "basic.to_delayed_action_delay_milliseconds": timeoutMs });
  firstPress.to(toSetVar(varName, 1));
  firstPress.toDelayedAction([toSetVar(varName, 0)], [toSetVar(varName, 0)]);
  for (const c of conds) firstPress.condition(c as any);
  (firstPress as any).from.modifiers = modifiersObj;

  const built = [...secondPress.build(), ...firstPress.build()];
  stampLabel(built, guardCase?.rawConditions);
  return built as Manipulator[];
}

function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  if (resolved.some((c) => c.guard)) {
    const manipulators = buildGuard(b, resolved);
    stampDeviceScope(manipulators, b.trigger);
    return manipulators;
  }
  // A binding routes to the multiTap arm if any case has tapCount >= 2 OR the
  // binding declares `multiTap` config (e.g. a left-command multi-tap binding
  // sets `multiTap: {allowPassThrough, mods}` even when no tap/hold cases are
  // provided — varTapTapHold still emits two manipulators in that case).
  const hasMultiTap =
    resolved.some((c) => c.tapCount >= 2) || b.multiTap !== undefined;
  const keys = getTriggerKeys(b.trigger);
  const isSim = keys.length > 1;
  const isPointer = keys.length === 1 && isPointerButton(keys[0]!);
  let manipulators: Manipulator[];
  if (hasMultiTap) manipulators = buildMultiTap(b, resolved, isSim);
  else if (isSim) manipulators = buildSimultaneousTapHold(b, resolved);
  else {
    manipulators = distributeUnconditionalTap(
      groupByConditions(resolved),
    ).flatMap((g) =>
      g.hasRelease || g.hasHold
        ? buildTapHold(b, g)
        : buildRemap(b, g, isPointer),
    );
  }
  stampDeviceScope(manipulators, b.trigger);
  return manipulators;
}

/** For a device-specific button alias, add a `device_if` condition to every manipulator. */
function stampDeviceScope(manipulators: Manipulator[], trigger: Trigger): void {
  const keys = getTriggerKeys(trigger);
  const nameScopes: string[] = [];
  for (const k of keys) {
    if (isPointerButton(k)) {
      const { nameScope } = resolveButton(k);
      if (nameScope && nameScope !== "global") {
        nameScopes.push(...nameScope);
      }
    }
  }
  if (!nameScopes.length) return;
  const ids = nameScopes.map((n) => karabinerDeviceId(DEVICES[n as keyof typeof DEVICES]));
  const cond = ifDevice(ids).build();
  manipulators.forEach((m: any) => {
    m.conditions = [...(m.conditions ?? []), cond];
  });
}

function buildMultiTap(
  b: Binding,
  cases: ResolvedCase[],
  isSim: boolean,
): Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const key = isSim ? "" : keys[0]!;
  const byPhase = (p: Phase, tapCount = 1) =>
    cases
      .filter((c) => c.tapCount === tapCount && c.phase === p)
      .flatMap((c) => c.do);
  const threshold = b.timing?.aloneMs ?? b.timing?.heldThresholdMs;
  if (isSim) {
    const label = keys.join("");
    const manipulators = simultaneousMultiTap({
      keys,
      label,
      alone: byPhase("release"),
      hold: byPhase("hold"),
      tapTap: cases
        .filter((c) => c.tapCount === 2 && c.phase === "release")
        .flatMap((c) => c.do),
      tapTapHold: cases
        .filter((c) => c.tapCount === 2 && c.phase === "hold")
        .flatMap((c) => c.do),
      thresholdMs: threshold,
      karOptions: resolveSimKarOptions(b),
      simultaneousThresholdMs: b.timing?.simultaneousMs,
    });
    attachConditions(manipulators, cases);
    stampLabel(manipulators, unionRawConditions(cases));
    return manipulators;
  }
  // key/pointer: one varTapTapHold(From) per condition-group, sharing a single
  // firstTapPendingVar so a first tap in one group is detected by every group's
  // second-tap manipulator — mirroring the bespoke double-tap's per-override
  // build (e.g. the G502X left-button double-tap's Zen vs non-Zen variants).
  const isPointer = isPointerButton(key);
  const triggerKey = isPointer ? resolveButton(key).button : key;
  const firstTapPendingVar =
    b.multiTap?.firstTapPendingVar?.name ?? `multi_tap_${triggerKey}`;
  const manipulators: Manipulator[] = [];
  for (const g of groupMultiTapCases(cases)) {
    const delayedEvents = g.cases
      .filter((c) => c.tapCount === 1 && c.phase === "release" && c.delayed)
      .flatMap((c) => c.do);
    const shared = {
      firstTapPendingVar,
      immediateSingleTapEvents: g.cases
        .filter((c) => c.tapCount === 1 && c.phase === "release" && !c.delayed)
        .flatMap((c) => c.do),
      delayedSingleTapEvents: delayedEvents.length ? delayedEvents : undefined,
      holdEvents: g.cases
        .filter((c) => c.tapCount === 1 && c.phase === "hold")
        .flatMap((c) => c.do),
      doubleTapEvents: g.cases
        .filter((c) => c.tapCount === 2 && c.phase === "release")
        .flatMap((c) => c.do),
      doubleTapHoldEvents: g.cases
        .filter((c) => c.tapCount === 2 && c.phase === "hold")
        .flatMap((c) => c.do),
      thresholdMs: threshold,
      allowPassThrough: b.multiTap?.allowPassThrough,
    };
    const groupManips = isPointer
      ? varTapTapHoldFrom({
        from: { pointing_button: triggerKey as PointingButton } as FromEvent,
        passThrough: b.multiTap?.allowPassThrough
          ? toPointingButton(triggerKey as PointingButton, undefined, {
            lazy: true,
          })
          : undefined,
        ...shared,
      })
      : varTapTapHold({ key, mods: b.multiTap?.mods as any, ...shared });
    // Attach the group's shared condition signature once (device_if last).
    const conds = deviceLast(g.conditions);
    if (conds.length) {
      groupManips.forEach((m: any) => {
        m.conditions = m.conditions || [];
        m.conditions.push(...conds);
      });
    }
    stampLabel(groupManips, unionRawConditions(g.cases));
    manipulators.push(...groupManips);
  }
  return manipulators;
}

/** Group multi-tap cases by condition signature (one varTapTapHold per group). */
function groupMultiTapCases(cases: ResolvedCase[]): {
  conditions: unknown[];
  cases: ResolvedCase[];
}[] {
  const groups = new Map<
    string,
    { conditions: unknown[]; cases: ResolvedCase[] }
  >();
  for (const c of cases) {
    const sig = JSON.stringify(c.conditions);
    if (!groups.has(sig))
      groups.set(sig, { conditions: c.conditions, cases: [] });
    groups.get(sig)!.cases.push(c);
  }
  return [...groups.values()];
}

function buildSimultaneousTapHold(
  b: Binding,
  cases: ResolvedCase[],
): Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const byPhase = (p: Phase) =>
    cases.filter((c) => c.phase === p).flatMap((c) => c.do);
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

/** Push resolved case conditions onto every manipulator (hoisted + per-case),
 * with `device_if` ordered last. */
function attachConditions(
  manipulators: Manipulator[],
  cases: ResolvedCase[],
): void {
  const conds = deviceLast(cases.flatMap((c) => c.conditions));
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
function stampLabel(
  manipulators: Manipulator[],
  conditions: Condition[] | undefined,
): void {
  const label = synthesizeManipulatorLabel(conditions);
  if (!label) return;
  manipulators.forEach((m: any) => {
    m.description = label;
  });
}

/** Reorder resolved conditions so `device_if` entries come last, matching the
 * bespoke mouse engine (device scope was appended after every per-manipulator
 * condition via `applyDeviceScope`). No-op when no device_if is present. */
function deviceLast(conds: unknown[]): unknown[] {
  if (!conds.length) return conds;
  const rest: unknown[] = [];
  const device: unknown[] = [];
  for (const c of conds) {
    if (
      c &&
      typeof c === "object" &&
      (c as { type?: string }).type === "device_if"
    )
      device.push(c);
    else rest.push(c);
  }
  return device.length ? [...rest, ...device] : rest;
}

function buildTapHold(b: Binding, g: CaseGroup): Manipulator | Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const isPointer = keys.length === 1 && isPointerButton(keys[0]!);
  const manipulators = isPointer
    ? buildPointerTapHold(b, g)
    : buildKeyTapHold(b, g);
  // device_if conditions last (matches the bespoke mouse engine, which appends
  // device scope after every per-manipulator condition).
  for (const cond of deviceLast(g.conditions)) {
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];
      m.conditions.push(cond);
    });
  }
  // Chord-modifier levers: clear the cancel fallback (no stray click on canceled
  // hold) and/or drop the default-alone pass-through (emit only `do`).
  if (b.suppressCancelFallback) {
    manipulators.forEach((m: any) => {
      if (m.to_delayed_action?.to_if_canceled)
        m.to_delayed_action.to_if_canceled = [];
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

/**
 * `modWhileDown` mode: the binding emits its modifier the entire time the key is
 * physically down (asserted in `to`, no hold threshold). This bypasses
 * `tapHold()` — which always injects a `to_delayed_action` state machine — and
 * instead produces a plain `map().to().toIfAlone()` manipulator matching the
 * bespoke modifier-chord behavior (e.g. caps_lock: held = COCS modifier, tap =
 * f15+COCS combo). `whileHoldVar` is set on key-down and cleared on key-up.
 */
function buildModWhileDown(
  b: Binding,
  g: CaseGroup,
  key: string,
): Manipulator[] {
  const builder = map(key as any);
  if (b.whileHoldVar) {
    builder.to(toSetVar(b.whileHoldVar.name, 1));
    builder.toAfterKeyUp(toSetVar(b.whileHoldVar.name, 0));
  }
  for (const e of g.pressDo) builder.to(e);
  for (const e of g.releaseDo) builder.toIfAlone(e);
  const m = builder.build()[0] as any;
  m.from.modifiers = fromModifiersObj(b.trigger);
  return [m as Manipulator];
}

/** Key tap-hold: `alone`/`hold` default to a halted re-emit of the key when the
 * phase is absent (matches tap-hold-rules); mandatory from-modifiers injected. */
function buildKeyTapHold(b: Binding, g: CaseGroup): Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const key = keys[0]!;
  if (b.modWhileDown) {
    return buildModWhileDown(b, g, key);
  }
  const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
  const defaultAlone: ActionSpec[] = [
    {
      type: "key",
      key,
      modifiers: mandatory as ActionKeyModifier[],
      options: { halt: true },
    },
  ];
  const alone = g.hasRelease
    ? g.releaseDo
    : defaultAlone.flatMap((a) => resolveActionToEvents(a));
  const hold = g.hasHold
    ? g.holdDo
    : isModifierKey(key)
      ? []
      : defaultAlone.flatMap((a) => resolveActionToEvents(a));
  const manipulators = tapHold({
    key,
    alone,
    hold,
    timeoutMs: b.timing?.aloneMs,
    thresholdMs: b.timing?.holdMs ?? b.timing?.heldThresholdMs,
    ...(b.whileHoldVar ? { variable: b.whileHoldVar.name } : {}),
  }).build();
  if (g.pressDo.length) {
    manipulators.forEach((m: any) => {
      m.to = m.to || [];
      m.to.push(...g.pressDo);
    });
  }
  const modifiersObj = fromModifiersObj(b.trigger);
  manipulators.forEach((m: any) => {
    m.from.modifiers = modifiersObj;
  });
  return manipulators;
}

function buildPointerTapHold(b: Binding, g: CaseGroup): Manipulator[] {
  const pointerKey = getTriggerKeys(b.trigger)[0]!;
  const { button } = resolveButton(pointerKey);
  const from: Record<string, unknown> = {
    pointing_button: button,
    modifiers: fromModifiersObj(b.trigger),
  };
  const alone = g.hasRelease ? g.releaseDo : undefined;
  const hold = g.hasHold ? g.holdDo : undefined;
  // Fall back to mouse-specific defaults so pointer manipulators can be tuned
  // independently from keyboard ones via DEFAULT_MOUSE_MANIPULATOR_TIMINGS.
  const timeoutMs = b.timing?.aloneMs ?? DEFAULT_MOUSE_MANIPULATOR_TIMINGS.aloneMs;
  const thresholdMs = b.timing?.holdMs ?? b.timing?.heldThresholdMs ?? DEFAULT_MOUSE_MANIPULATOR_TIMINGS.holdMs;
  return tapHoldFrom({
    from: from as FromEvent,
    alone,
    hold,
    timeoutMs,
    thresholdMs,
    eventOptions: b.eventOptions,
    ...(b.whileHoldVar ? { variable: b.whileHoldVar.name } : {}),
  }).build();
}

function buildRemap(
  b: Binding,
  g: { conditions: unknown[]; rawConditions: Condition[]; pressDo: ToEvent[] },
  isPointer: boolean,
): Manipulator | Manipulator[] {
  const label = synthesizeManipulatorLabel(g.rawConditions);
  if (isPointer) {
    const pointerKey = getTriggerKeys(b.trigger)[0]!;
    const { button } = resolveButton(pointerKey);
    const from: Record<string, unknown> = { pointing_button: button };
    const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
    if (mandatory.length || optional.length) {
      from.modifiers = {
        ...(mandatory.length ? { mandatory } : {}),
        ...(optional.length ? { optional } : {}),
      };
    }
    const m: Record<string, unknown> = { type: "basic", from };
    if (g.pressDo.length) m.to = g.pressDo;
    if (label) m.description = label;
    const conds = deviceLast(g.conditions);
    if (conds.length) m.conditions = conds;
    return m as unknown as Manipulator;
  }
  const builder = map(triggerToFrom(b.trigger));
  if (label) builder.description(label);
  for (const cond of deviceLast(g.conditions)) builder.condition(cond as any);
  for (const e of g.pressDo) builder.to(e);
  return builder.build();
}
