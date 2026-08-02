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
import type { AnalysisReport, DeviceConfig } from "./engine";
import {
  assertNoConflicts,
  buildDeviceConfig,
  defineBindings,
  generateSimultaneousRules,
} from "./engine";
import type { Rule } from "./types/karabiner";

/**
 * Every binding set, in the order its rules are emitted.
 *
 * Order is load-bearing: Karabiner evaluates complex modifications top-down and
 * stops at the first manipulator whose `from` and conditions match. Chords must
 * precede the single-key rules for their member keys, and narrowly-conditioned
 * rules must precede the unconditional rules they refine.
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

/**
 * Compile every binding set into the final ordered rule list.
 *
 * Conflict analysis runs first and throws on any rule that a preceding rule
 * makes unreachable, so an unfireable binding fails the build rather than
 * sitting silently dead in the config.
 *
 * @throws {import('./engine').RuleConflictError} on unreachable rules.
 */
export function buildRules(): { rules: Rule[]; analysis: AnalysisReport } {
  const analysis = assertNoConflicts(BINDING_SETS);
  const rules = [
    ...generateSimultaneousRules(simultaneousMappings, tapHoldBindings),
    ...BINDING_SETS.flatMap(({ bindings }) => defineBindings(bindings)),
  ];
  return { rules, analysis };
}
