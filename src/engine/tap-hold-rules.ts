import type { Rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { AppRef } from "../data";
import { resolveModComboAlias } from "../data/key-aliases";
import { defineBindings, type Binding, type Case } from "./binding";

export type TapHoldConfig = {
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  description: string;
  timeoutMs?: number;
  thresholdMs?: number;
  appOverrides?: Array<{
    app: AppRef;
    unless?: boolean;
    alone?: ActionSpec[];
    hold?: ActionSpec[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ActionSpec[];
    invoked?: ActionSpec[];
  }>;
};

function parseKeyWithModifiers(keyString: string): {
  key: string;
  modifiers: string[];
} {
  const parts = keyString.split("+").map((p) => p.trim());
  if (parts.length === 1) {
    return { key: parts[0], modifiers: [] };
  }

  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  const normalizedModifiers = modifiers.flatMap((mod) => {
    const alias = resolveModComboAlias(mod);
    if (alias) return alias;

    const lower = mod.toLowerCase();
    switch (lower) {
      case "cmd": return ["command"];
      case "opt":
      case "alt": return ["option"];
      case "ctrl": return ["control"];
      default: return [lower];
    }
  });

  return { key, modifiers: normalizedModifiers };
}

export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  suppressionVars: string[] = [],
): Rule[] {
  const bindings: Binding[] = Object.entries(tapHoldKeys).map(([keyString, config]) => {
    const { key, modifiers } = parseKeyWithModifiers(keyString);
    const cases: Case[] = [];
    if (config.alone) cases.push({ phase: "release", do: config.alone });
    if (config.hold) cases.push({ phase: "hold", do: config.hold });
    for (const ov of config.appOverrides ?? []) {
      const conds = [{ app: ov.app, ...(ov.unless ? { unless: true } : {}) }];
      if (ov.alone) cases.push({ phase: "release", conditions: conds, do: ov.alone });
      if (ov.hold) cases.push({ phase: "hold", conditions: conds, do: ov.hold });
    }
    return {
      description: formatRuleDescription(keyString, config.description, "hold"),
      trigger: { keys: [key], modifiers },
      timing: { aloneMs: config.timeoutMs, heldThresholdMs: config.thresholdMs },
      cases,
      ...(suppressionVars.length
        ? { conditions: suppressionVars.map((v) => ({ var: { name: v, varDesc: v }, equals: 1, unless: true })) }
        : {}),
    };
  });
  return defineBindings(bindings);
}
