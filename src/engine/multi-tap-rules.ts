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

  const firstTapPendingVar = `multi_tap_${key}`;

  const manipulators = varTapTapHold({
    key,
    firstTapPendingVar,
    immediateSingleTapEvents: alone?.flatMap(resolveActionToEvents),
    holdEvents: hold?.flatMap(resolveActionToEvents),
    doubleTapEvents: tapTap?.flatMap(resolveActionToEvents),
    doubleTapHoldEvents: tapTapHold?.flatMap(resolveActionToEvents),
    thresholdMs,
    allowPassThrough,
    mods: mods as any,
  });

  return rule(
    formatRuleDescription(key, description, "multi-tap"),
  ).manipulators(manipulators) as any;
}
