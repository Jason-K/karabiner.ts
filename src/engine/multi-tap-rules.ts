import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding, type Case } from "./binding";

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

export function generateMultiTapRule(config: MultiTapConfig): Rule {
  if (config.tapTap && config.tapTapHold) {
    throw new Error("MultiTapConfig: tapTap and tapTapHold are mutually exclusive");
  }
  const cases: Case[] = [];
  if (config.alone) cases.push({ phase: "release", do: config.alone });
  if (config.hold) cases.push({ phase: "hold", do: config.hold });
  if (config.tapTap) cases.push({ tapCount: 2, phase: "release", do: config.tapTap });
  if (config.tapTapHold) cases.push({ tapCount: 2, phase: "hold", do: config.tapTapHold });
  const binding: Binding = {
    description: formatRuleDescription(config.key, config.description, "multi-tap"),
    trigger: { keys: [config.key] },
    timing: { aloneMs: config.thresholdMs, heldThresholdMs: config.thresholdMs },
    multiTap: { allowPassThrough: config.allowPassThrough, mods: config.mods },
    cases,
  };
  return defineBindings([binding])[0]!;
}
