import type { ToEvent } from 'karabiner.ts';
import { rule, toKey } from 'karabiner.ts';
import { getAllSublayerVars } from '../lib/leader/runtime';
import type { SubLayerConfig } from '../lib/leader/types';
import { formatRuleDescription } from "../lib/rule-descriptions";
import { tapHold } from '../lib/tap-hold';

export type TapHoldConfig = {
  alone?: ToEvent[];
  hold: ToEvent[];
  description: string;
  timeoutMs?: number;
  thresholdMs?: number;
  appOverrides?: Array<{
    app: string;
    unless?: boolean;
    alone?: ToEvent[];
    hold?: ToEvent[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ToEvent[];
    invoked?: ToEvent[];
  }>;
};

function parseKeyWithModifiers(keyString: string): { key: string; modifiers: string[] } {
  const parts = keyString.split('+').map((p) => p.trim());
  if (parts.length === 1) {
    return { key: parts[0], modifiers: [] };
  }

  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  const normalizedModifiers = modifiers.flatMap((mod) => {
    const lower = mod.toLowerCase();

    if (lower.startsWith("left_") || lower.startsWith("right_")) {
      return [lower];
    }

    switch (lower) {
      case "hyper":
        return ["command", "option", "control"];
      case "super":
        return ["command", "option", "control", "shift"];
      case "meh":
        return ["command", "option", "shift"];
      case "cmd":
        return ["command"];
      case "opt":
      case "alt":
        return ["option"];
      case "ctrl":
        return ["control"];
      case "command":
      case "option":
      case "control":
      case "shift":
        return [lower];
      default:
        return [mod];
    }
  });

  return { key, modifiers: normalizedModifiers };
}

export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  spaceLayers: SubLayerConfig[],
): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = getAllSublayerVars(spaceLayers, 'space');

  return Object.entries(tapHoldKeys).map(([keyString, config]) => {
    const { key, modifiers } = parseKeyWithModifiers(keyString);

    const manipulators = tapHold({
      key,
      alone: config.alone ?? [toKey(key as any, modifiers as any[], { halt: true })],
      hold: config.hold,
      timeoutMs: config.timeoutMs,
      thresholdMs: config.thresholdMs,
      appOverrides: config.appOverrides,
    }).build();

    if (modifiers.length > 0) {
      manipulators.forEach((m: any) => {
        m.from.modifiers = m.from.modifiers || {};
        m.from.modifiers.mandatory = modifiers;
      });
    }

    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];

      m.conditions.push({
        type: 'variable_unless',
        name: spaceModVar,
        value: 1,
      });

      allSublayerVars.forEach((sublayerVar) => {
        m.conditions.push({
          type: 'variable_unless',
          name: sublayerVar,
          value: 1,
        });
      });
    });

    return rule(
      formatRuleDescription(keyString, config.description, "hold"),
    ).manipulators(manipulators);
  });
}
