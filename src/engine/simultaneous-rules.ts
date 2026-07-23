import type { Rule } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding, type Case, type SimOrder } from "./binding";
import type { TapHoldConfig } from "./tap-hold-rules";

export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_when?: "any" | "all";
  to_after_key_up?: import("../core/action-dsl").ActionSpec[];
};

export type SimultaneousConfig = {
  keys: string[];
  description: string;
  alone?: import("../core/action-dsl").ActionSpec[];
  hold?: import("../core/action-dsl").ActionSpec[];
  tapTap?: import("../core/action-dsl").ActionSpec[];
  tapTapHold?: import("../core/action-dsl").ActionSpec[];
  thresholdMs?: number;
  simultaneousOptions?: SimultaneousOptions;
  simultaneousThresholdMs?: number;
};

/**
 * Map the user-facing `SimultaneousOptions` (Karabiner JSON shape) to the
 * `SimOrder` slice stored on a Binding's `trigger.order`. The `to_after_key_up`
 * field is split off — it becomes `binding.afterKeyUp` (resolved ActionSpec[])
 * in the adapter, then re-merged into `karOptions` by `binding.ts` when the
 * simultaneous core primitive is called.
 */
function resolveOrder(simOpts: SimultaneousOptions | undefined): SimOrder | undefined {
  if (!simOpts) return undefined;
  const o: SimOrder = {};
  if (simOpts.key_down_order) o.down = simOpts.key_down_order;
  if (simOpts.key_up_order) o.up = simOpts.key_up_order;
  if (simOpts.key_up_when) o.upWhen = simOpts.key_up_when;
  if (simOpts.detect_key_down_uninterruptedly) o.detectUninterrupted = true;
  return Object.keys(o).length ? o : undefined;
}

export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  suppressionVars: string[] = [],
  tapHoldKeys: Record<string, TapHoldConfig>,
): Rule[] {
  validateMappings(mappings, tapHoldKeys);

  const bindings: Binding[] = Object.entries(mappings).map(([, config]) => {
    const cases: Case[] = [];
    if (config.alone) cases.push({ phase: "release", do: config.alone });
    if (config.hold) cases.push({ phase: "hold", do: config.hold });
    if (config.tapTap) cases.push({ tapCount: 2, phase: "release", do: config.tapTap });
    if (config.tapTapHold) cases.push({ tapCount: 2, phase: "hold", do: config.tapTapHold });
    return {
      description: formatRuleDescription(config.keys, config.description, "simultaneous"),
      trigger: {
        keys: config.keys,
        ...(resolveOrder(config.simultaneousOptions)
          ? { order: resolveOrder(config.simultaneousOptions) }
          : {}),
      },
      timing: {
        aloneMs: config.thresholdMs,
        heldThresholdMs: config.thresholdMs,
        simultaneousMs: config.simultaneousThresholdMs,
      },
      ...(suppressionVars.length
        ? { conditions: suppressionVars.map((v) => ({ var: { name: v, varDesc: v }, equals: 1, unless: true })) }
        : {}),
      ...(config.simultaneousOptions?.to_after_key_up
        ? { afterKeyUp: config.simultaneousOptions.to_after_key_up }
        : {}),
      cases,
    };
  });
  return defineBindings(bindings);
}

function normalizedChordKey(keys: string[], keyDownOrder?: string): string {
  const sorted =
    keyDownOrder === "strict" || keyDownOrder === "strict_inverse"
      ? keys.join(",")
      : [...keys].sort().join(",");
  return `${sorted}__${keyDownOrder ?? "insensitive"}`;
}

function validateMappings(
  mappings: Record<string, SimultaneousConfig>,
  tapHoldKeys: Record<string, TapHoldConfig>,
): void {
  // Input validation
  for (const [label, config] of Object.entries(mappings)) {
    if (config.keys.length < 2) {
      throw new Error(
        `Simultaneous chord "${label}": requires at least 2 keys, got ${config.keys.length}.`,
      );
    }
    if (config.tapTap && config.tapTapHold) {
      throw new Error(
        `Simultaneous chord "${label}": tapTap and tapTapHold are mutually exclusive.`,
      );
    }
    if (!config.alone && !config.hold && !config.tapTap && !config.tapTapHold) {
      throw new Error(
        `Simultaneous chord "${label}": no action fields specified (alone, hold, tapTap, or tapTapHold). This would produce a no-op rule.`,
      );
    }
  }

  // Check 1: duplicate chords (order-aware)
  const seen = new Map<string, string>(); // normalizedKey → label
  for (const [label, config] of Object.entries(mappings)) {
    const key = normalizedChordKey(
      config.keys,
      config.simultaneousOptions?.key_down_order,
    );
    if (seen.has(key)) {
      throw new Error(
        `Simultaneous chord "${label}" is a duplicate of "${seen.get(key)}" — same keys and key_down_order.`,
      );
    }
    seen.set(key, label);
  }

  // Check 2: tap-hold key overlap (bare keys only — no modifier prefix)
  const bareHoldKeys = new Set(
    Object.keys(tapHoldKeys).filter((k) => !k.includes("+")),
  );
  for (const [label, config] of Object.entries(mappings)) {
    for (const key of config.keys) {
      if (bareHoldKeys.has(key)) {
        throw new Error(
          `Simultaneous chord "${label}" conflict: key "${key}" is also defined as a bare tap-hold key. ` +
            `Add a modifier prefix to the tap-hold entry (e.g., "cmd+${key}") to resolve the ambiguity.`,
        );
      }
    }
  }
}
