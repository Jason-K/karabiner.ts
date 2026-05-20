import { rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { varTapTapHold } from "../core/tap-hold";
import { resolveActionToEvents } from "./action-resolver";

export type MultiTapConfig = {
  key: string;
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs: number;
  allowPassThrough?: boolean;
  mods?: string[];
};

export function generateMultiTapRule(config: MultiTapConfig) {
  const {
    key,
    description,
    alone,
    hold,
    tapTap,
    tapTapHold,
    thresholdMs,
    allowPassThrough = false,
    mods = [],
  } = config;

  if (tapTap && tapTapHold) {
    throw new Error(
      "MultiTapConfig: tapTap and tapTapHold are mutually exclusive",
    );
  }

  const firstVar = `multi_tap_${key}`;

  const manipulators = varTapTapHold({
    key,
    firstVar,
    aloneEvents: alone?.flatMap(resolveActionToEvents),
    holdEvents: hold?.flatMap(resolveActionToEvents),
    tapTapEvents: tapTap?.flatMap(resolveActionToEvents),
    tapTapHoldEvents: tapTapHold?.flatMap(resolveActionToEvents),
    thresholdMs,
    allowPassThrough,
    mods: mods as any,
  });

  return rule(
    formatRuleDescription(key, description, "multi-tap"),
  ).manipulators(manipulators) as any;
}
