import type { Binding } from "../../data";
import { ioSignature } from "../utils/input-devices";

/**
 * Cross-file duplicate-trigger guard — replaces the barrel's `mergeTapHoldRecords`
 * keyString check. Throws on two bindings whose triggers are equivalent
 * (keys + modifiers, order-independent). Returns the input unchanged when unique.
 */
export function assertUniqueTriggers(bindings: Binding[]): Binding[] {
  const seen = new Map<string, Binding>();
  for (const b of bindings) {
    const sig = ioSignature(b.trigger);
    if (seen.has(sig)) {
      throw new Error(`Duplicate trigger across definition files: ${sig}`);
    }
    seen.set(sig, b);
  }
  return bindings;
}
