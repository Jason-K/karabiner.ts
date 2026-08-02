/**
 * The complete generated configuration, assembled from `src/definitions/`.
 *
 * Pure: importing this module performs no I/O and reads no environment. That is
 * what lets tests compile the real configuration and diff it against the
 * committed golden file without the build's filesystem side effects.
 */

import { DEVICES } from "./data";
import {
  capsLockBindings,
  disabledHotkeys,
  guardBindings,
  mouseBindings,
  NUMPAD_REMAPS,
  simultaneousMappings,
  tapHoldBindings,
} from "./definitions";
import type { Binding } from "./data";
import type { AnalysisReport, DeviceConfig, PlannedBinding, RulePlan } from "./engine";
import {
  assertNoConflictsInOrder,
  buildDeviceConfig,
  emitRules,
  generateSimultaneousRules,
  planRules,
} from "./engine";
import type { Rule } from "./types/karabiner";

/**
 * Every binding set.
 *
 * Declaration order here is only a tiebreaker: `planRules()` decides the order
 * rules are actually emitted in, from the triggers themselves (most modifiers
 * first, then ⌘ ⌥ ⌃ ⇧, then alphabetical). Two bindings that resolve to the same
 * trigger stay in the order they appear here, whichever sets they came from.
 */
export const BINDING_SETS: ReadonlyArray<{ name: string; bindings: Binding[] }> = [
  { name: "tap-hold", bindings: tapHoldBindings },
  { name: "guards", bindings: guardBindings },
  { name: "mouse", bindings: mouseBindings },
  { name: "caps-lock", bindings: capsLockBindings },
  { name: "disabled-hotkeys", bindings: disabledHotkeys },
];

/** Device-scoped settings and simple modifications. */
export const DEVICE_CONFIGS: DeviceConfig[] = [
  buildDeviceConfig(DEVICES.appleNumericKeypad, [...NUMPAD_REMAPS]),
  buildDeviceConfig(DEVICES.g502X),
];

/** The rule layout the build emits: grouping, ordering and descriptions. */
export function rulePlan(): RulePlan[] {
  return planRules(BINDING_SETS);
}

/** Every binding in the order Karabiner will evaluate it. */
export function orderedBindings(): PlannedBinding[] {
  return rulePlan().flatMap((plan) => plan.bindings);
}

/**
 * Compile every binding set into the final ordered rule list.
 *
 * Conflict analysis runs first, over the planned order rather than the
 * declaration order, and throws on any rule that a preceding rule makes
 * unreachable — so an unfireable binding fails the build rather than sitting
 * silently dead in the config.
 *
 * @throws {import('./engine').RuleConflictError} on unreachable rules.
 */
export function buildRules(): { rules: Rule[]; analysis: AnalysisReport } {
  const plans = rulePlan();
  const analysis = assertNoConflictsInOrder(plans.flatMap((p) => p.bindings));
  const rules = [
    // Chords stay ahead of everything: a single-key rule for one of a chord's
    // members can consume the chord's first key-down, and trigger order alone
    // cannot express that dependency.
    ...generateSimultaneousRules(simultaneousMappings, tapHoldBindings),
    ...emitRules(plans),
  ];
  return { rules, analysis };
}
