import { resolveModifiers, type Binding, type Trigger } from "./binding";

function triggerSignature(t: Trigger): string {
  const { mandatory, optional } = resolveModifiers(t.modifiers);
  const mandStr = [...mandatory].sort().join(",");
  const optStr = [...optional].sort().join(",");
  const mods = `mandatory:[${mandStr}]|optional:[${optStr}]`;
  if ("pointer" in t) {
    return `pointer:${t.pointer}|mods:${mods}`;
  }
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
