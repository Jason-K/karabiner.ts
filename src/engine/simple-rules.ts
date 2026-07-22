import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type SimpleRemapMapping = {
  from: { key: string; modifiers?: ModKey[] };
  description: string;
  to: { key: string; modifiers?: ModKey[] };
};

export type DisabledShortcutMapping = {
  key: string;
  modifiers: ModKey[];
  description: string;
};

export type AppScopedRemapMapping = {
  from: { key: string; modifiers?: ModKey[] };
  description: string;
  to: { key: string; modifiers?: ModKey[] };
  ifApp?: string | string[];
};

const tapDesc = (chord: string[], description: string) =>
  formatRuleDescription(chord, description, "tap");

export function generateSimpleRemapRules(mappings: ReadonlyArray<SimpleRemapMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...(m.from.modifiers ?? []), m.from.key], m.description),
      trigger: { keys: [m.from.key], modifiers: m.from.modifiers as string[] | undefined },
      cases: [{ phase: "press", do: [{ type: "key", key: m.to.key, modifiers: m.to.modifiers as any }] }],
    })),
  );
}

export function generateDisabledShortcutRules(mappings: ReadonlyArray<DisabledShortcutMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...m.modifiers, m.key], m.description),
      trigger: { keys: [m.key], modifiers: m.modifiers as string[] },
      cases: [{ phase: "press", do: [{ type: "noop" }] }],
    })),
  );
}

export function generateAppScopedRemapRules(mappings: ReadonlyArray<AppScopedRemapMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...(m.from.modifiers ?? []), m.from.key], m.description),
      trigger: { keys: [m.from.key], modifiers: m.from.modifiers as string[] | undefined },
      ...(m.ifApp ? { conditions: [{ app: m.ifApp }] } : {}),
      cases: [{ phase: "press", do: [{ type: "key", key: m.to.key, modifiers: m.to.modifiers as any }] }],
    })),
  );
}
