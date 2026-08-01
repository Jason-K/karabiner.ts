import type { Trigger } from "../../data";
import { buttons, defaultButtonNames, type ButtonSpec } from "../../data/constants/mouse";
import { resolveModifiers } from "./modifier-utils";

export function getTriggerKeys(trigger: Trigger): string[] {
  return "keys" in trigger ? trigger.keys : [trigger.pointer];
}


/**
 * Generate a deterministic signature string for an I/O trigger or action chord.
 */
export function ioSignature(t: Trigger): string {
  const { mandatory, optional } = resolveModifiers(t.modifiers);
  const mandStr = [...mandatory].sort().join(",");
  const optStr = [...optional].sort().join(",");
  const mods = `mandatory:[${mandStr}]|optional:[${optStr}]`;
  const keys = getTriggerKeys(t);
  const order = "order" in t && t.order ? JSON.stringify(t.order) : "";
  return `keys:${[...keys].sort().join(",")}|mods:${mods}|order:${order}`;
}

/** Legacy alias for ioSignature */
export const triggerSignature = ioSignature;

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
