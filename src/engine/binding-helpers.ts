import { buttons, defaultButtonNames, type ButtonSpec } from "../data/settings-mouse";
import { getTriggerKeys, resolveModifiers, type Binding, type Trigger } from "./binding";

function triggerSignature(t: Trigger): string {
  const { mandatory, optional } = resolveModifiers(t.modifiers);
  const mandStr = [...mandatory].sort().join(",");
  const optStr = [...optional].sort().join(",");
  const mods = `mandatory:[${mandStr}]|optional:[${optStr}]`;
  const keys = getTriggerKeys(t);
  const order = "order" in t && t.order ? JSON.stringify(t.order) : "";
  return `keys:${[...keys].sort().join(",")}|mods:${mods}|order:${order}`;
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

/** Resolve a pointer alias (or raw button id) → button + nameScope + label. */
export function resolveButton(pointer: string): {
  button: string;
  nameScope?: ButtonSpec["nameScope"];
  desc: string;
} {
  const spec = (buttons as Record<string, ButtonSpec>)[pointer];
  if (spec)
    return { button: spec.button, nameScope: spec.nameScope, desc: spec.desc };
  return { button: pointer, desc: defaultButtonNames[pointer] ?? pointer };
}

export function isPointerButton(pointer: string): boolean {
  return pointer in buttons || /^button\d+$/.test(pointer);
}

