import type { ActionSpec } from "../core/action-dsl";
import type { Binding, Case, Trigger } from "./binding";

type TapHoldOpts = {
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  timeoutMs?: number;
  thresholdMs?: number;
};

/** General tap/hold binding with explicit key + modifiers (hyper / right-option / left-command shape). */
export function tapHoldBinding(
  key: string,
  modifiers: string[],
  opts: TapHoldOpts,
): Binding {
  const cases: Case[] = [];
  if (opts.alone) cases.push({ phase: "release", do: opts.alone });
  if (opts.hold) cases.push({ phase: "hold", do: opts.hold });
  return {
    trigger: { keys: [key], ...(modifiers.length ? { modifiers } : {}) },
    timing: { aloneMs: opts.timeoutMs, heldThresholdMs: opts.thresholdMs },
    cases,
  };
}

/** Bare-key hold-only binding (the single-key shape): tap passes through, hold fires. */
export function holdKey(
  key: string,
  hold: ActionSpec[],
  opts?: { modifiers?: string[]; timeoutMs?: number; thresholdMs?: number },
): Binding {
  return tapHoldBinding(key, opts?.modifiers ?? [], {
    hold,
    timeoutMs: opts?.timeoutMs,
    thresholdMs: opts?.thresholdMs,
  });
}

/** Plain press remap (hyper launcher shape). */
export function remap(key: string, modifiers: string[], doActions: ActionSpec[]): Binding {
  return {
    trigger: { keys: [key], ...(modifiers.length ? { modifiers } : {}) },
    cases: [{ phase: "press", do: doActions }],
  };
}

function triggerSignature(t: Trigger): string {
  if ("pointer" in t) {
    return `pointer:${t.pointer}|mods:${[...(t.modifiers ?? [])].sort().join(",")}`;
  }
  const mods = [...(t.modifiers ?? [])].sort().join(",");
  const order = "order" in t && t.order ? JSON.stringify(t.order) : "";
  return `keys:${[...t.keys].sort().join(",")}|mods:${mods}|order:${order}`;
}

/**
 * Cross-file duplicate-trigger guard — replaces the barrel's `mergeTapHoldRecords`
 * keyString check. Throws on two bindings whose triggers are equivalent
 * (keys + modifiers, order-independent). Returns the input unchanged when unique.
 */
export function assertUniqueTriggers(bindings: Binding[]): Binding[] {
  const seen = new Map<string, Binding>();
  for (const b of bindings) {
    const sig = triggerSignature(b.trigger);
    if (seen.has(sig)) {
      throw new Error(`Duplicate trigger across definition files: ${sig}`);
    }
    seen.set(sig, b);
  }
  return bindings;
}
