import type { ActionSpec } from "../core/action-dsl";
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

/** Group cases that share the same condition signature into one manipulator. */
function groupByConditions(cases: ResolvedCase[]) {
  const groups = new Map<
    string,
    { conditions: unknown[]; pressDo: ToEvent[]; releaseDo: ToEvent[]; holdDo: ToEvent[] }
  >();
  for (const c of cases) {
    const key = JSON.stringify(c.conditions);
    if (!groups.has(key)) {
      groups.set(key, { conditions: c.conditions, pressDo: [], releaseDo: [], holdDo: [] });
    }
    const g = groups.get(key)!;
    if (c.phase === "press") g.pressDo.push(...c.do);
    if (c.phase === "release") g.releaseDo.push(...c.do);
    if (c.phase === "hold") g.holdDo.push(...c.do);
  }
  return [...groups.values()];
}

export function defineBindings(bindings: Binding[]): Rule[] {
  return bindings.map((b) => rule(b.description).manipulators(buildManipulators(b)) as unknown as Rule);
}

function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2);
  if (hasMultiTap) {
    throw new Error("multiTap arm not implemented until Task 6");
  }
  const isPointer = "pointer" in b.trigger;
  return groupByConditions(resolved).flatMap((g) => buildRemap(b, g, isPointer));
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
