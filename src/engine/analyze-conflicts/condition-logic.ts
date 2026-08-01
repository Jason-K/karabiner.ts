/**
 * Condition-predicate reasoning for conflict analysis.
 *
 * Two rules that share an input domain only actually conflict when their
 * condition predicates can both hold at once. Both helpers here are deliberately
 * *conservative*: they answer "provably disjoint" and "provably implies", and
 * default to "don't know" (treated as a possible conflict / no implication)
 * rather than guessing. That keeps false negatives out of the disjointness test
 * and false positives out of the shadowing test.
 */

import type { Condition } from "../../data";

type AppCondition = Extract<Condition, { app: unknown }>;
type VarCondition = Extract<Condition, { var: unknown }>;
type DeviceCondition = Extract<Condition, { device: unknown }>;

const isApp = (c: Condition): c is AppCondition => "app" in c;
const isVar = (c: Condition): c is VarCondition => "var" in c;
const isDevice = (c: Condition): c is DeviceCondition => "device" in c;

/** Canonical key for an app condition's target set, ignoring polarity. */
function appTargetKey(c: AppCondition): string {
  const refs = Array.isArray(c.app) ? c.app : [c.app];
  return refs
    .map((ref) => {
      if (typeof ref === "string") return ref;
      const target = ref.type === "app" ? (ref.bundleId ?? ref.path) : ref.path;
      return Array.isArray(target) ? [...target].sort().join(",") : String(target);
    })
    .sort()
    .join("|");
}

/** Structural identity for a condition, used for the implication test. */
export function conditionKey(c: Condition): string {
  if (isApp(c)) return `app:${appTargetKey(c)}:${c.unless ? "unless" : "if"}`;
  if (isVar(c)) {
    return `var:${c.var.name}=${String(c.equals)}:${c.unless ? "unless" : "if"}`;
  }
  const d = c as DeviceCondition;
  return `device:${d.device.vendor_id}:${d.device.product_id}:${d.unless ? "unless" : "if"}`;
}

/**
 * `true` when conditions `a` and `b` can never both hold.
 *
 * Recognised contradictions:
 * - same variable, different required values
 * - same variable and value, opposite polarity
 * - same application target, opposite polarity
 * - different devices required (one event has one source device)
 */
function contradicts(a: Condition, b: Condition): boolean {
  if (isVar(a) && isVar(b) && a.var.name === b.var.name) {
    const sameValue = a.equals === b.equals;
    const samePolarity = Boolean(a.unless) === Boolean(b.unless);
    if (sameValue) return !samePolarity;
    // Different values: contradictory only when both demand a specific value.
    return samePolarity && !a.unless;
  }

  if (isApp(a) && isApp(b)) {
    if (appTargetKey(a) !== appTargetKey(b)) {
      // Two different apps cannot both be frontmost.
      return !a.unless && !b.unless;
    }
    return Boolean(a.unless) !== Boolean(b.unless);
  }

  if (isDevice(a) && isDevice(b) && !a.unless && !b.unless) {
    return (
      a.device.vendor_id !== b.device.vendor_id ||
      a.device.product_id !== b.device.product_id
    );
  }

  return false;
}

/** `true` when the two condition groups can never be satisfied simultaneously. */
export function conditionsProvablyDisjoint(
  a: readonly Condition[] | undefined,
  b: readonly Condition[] | undefined,
): boolean {
  for (const ca of a ?? []) {
    for (const cb of b ?? []) {
      if (contradicts(ca, cb)) return true;
    }
  }
  return false;
}

/**
 * `true` when satisfying `inner` necessarily satisfies `outer` — i.e. `outer` is
 * the weaker predicate, so it matches everywhere `inner` does.
 *
 * Sound but incomplete: only structural containment is recognised. An
 * unconditional `outer` (empty group) is implied by everything.
 */
export function conditionsImply(
  outer: readonly Condition[] | undefined,
  inner: readonly Condition[] | undefined,
): boolean {
  const innerKeys = new Set((inner ?? []).map(conditionKey));
  return (outer ?? []).every((c) => innerKeys.has(conditionKey(c)));
}

/** `true` when the two groups are the same set of conditions. */
export function sameConditions(
  a: readonly Condition[] | undefined,
  b: readonly Condition[] | undefined,
): boolean {
  return conditionsImply(a, b) && conditionsImply(b, a);
}
