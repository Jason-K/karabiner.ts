import { rule } from "karabiner.ts";
import type { SimultaneousOptions as KarSimultaneousOptions } from "karabiner.ts";
import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { simultaneousMultiTap, simultaneousTapHold } from "../core/simultaneous";
import { resolveActionToEvents } from "./action-resolver";
import type { TapHoldConfig } from "./tap-hold-rules";

export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_when?: "any" | "all";
  to_after_key_up?: ActionSpec[];
};

export type SimultaneousConfig = {
  keys: string[];
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs?: number;
  simultaneousOptions?: SimultaneousOptions;
  simultaneousThresholdMs?: number;
};

function resolveKarOptions(
  simOpts: SimultaneousOptions | undefined,
): KarSimultaneousOptions | undefined {
  if (!simOpts) return undefined;
  const resolvedAfterKeyUp = simOpts.to_after_key_up?.flatMap(resolveActionToEvents);
  return {
    detect_key_down_uninterruptedly: simOpts.detect_key_down_uninterruptedly,
    key_down_order: simOpts.key_down_order,
    key_up_order: simOpts.key_up_order,
    key_up_when: simOpts.key_up_when,
    ...(resolvedAfterKeyUp?.length ? { to_after_key_up: resolvedAfterKeyUp } : {}),
  };
}

function injectSuppressionConditions(
  manipulators: any[],
  suppressionVars: string[],
): void {
  if (suppressionVars.length === 0) return;

  manipulators.forEach((m: any) => {
    m.conditions = m.conditions ?? [];
    suppressionVars.forEach((name) => {
      m.conditions.push({ type: "variable_unless", name, value: 1 });
    });
  });
}

export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  suppressionVars: string[] = [],
  tapHoldKeys: Record<string, TapHoldConfig>,
): any[] {
  validateMappings(mappings, tapHoldKeys);

  return Object.entries(mappings).map(([label, config]) => {
    const karOptions = resolveKarOptions(config.simultaneousOptions);
    const alone = config.alone?.flatMap(resolveActionToEvents);
    const hold = config.hold?.flatMap(resolveActionToEvents);
    const tapTap = config.tapTap?.flatMap(resolveActionToEvents);
    const tapTapHold = config.tapTapHold?.flatMap(resolveActionToEvents);

    const isMultiTap = tapTap !== undefined || tapTapHold !== undefined;
    const manipulators: any[] = isMultiTap
      ? simultaneousMultiTap({
          keys: config.keys,
          label,
          alone,
          hold,
          tapTap,
          tapTapHold,
          thresholdMs: config.thresholdMs,
          karOptions,
          simultaneousThresholdMs: config.simultaneousThresholdMs,
        })
      : simultaneousTapHold({
          keys: config.keys,
          alone,
          hold,
          thresholdMs: config.thresholdMs,
          karOptions,
          simultaneousThresholdMs: config.simultaneousThresholdMs,
        });

    injectSuppressionConditions(manipulators, suppressionVars);

    return rule(
      formatRuleDescription(config.keys, config.description, "simultaneous"),
    ).manipulators(manipulators);
  });
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
