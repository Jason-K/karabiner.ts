import type { FromEvent } from "../../types/karabiner";
import type { Trigger } from "../../data";
import {
  getTriggerKeys,
  isPointerButton,
  resolveButton,
  resolveKeyAlias,
  resolveModifiers,
} from "../utils";

/**
 * Build the `from.modifiers` object for a manipulator's `from` event from a
 * trigger's resolved modifiers.
 */
export function fromModifiersObj(
  trigger: Trigger,
): Record<string, string[]> {
  const { mandatory, optional } = resolveModifiers(trigger.modifiers);
  const modifiersObj: Record<string, string[]> = {};
  if (mandatory.length) modifiersObj.mandatory = mandatory;
  if (optional.length) modifiersObj.optional = optional;
  else if (!mandatory.length) modifiersObj.optional = [];
  return modifiersObj;
}

/**
 * Convert a high-level Trigger specification into a Karabiner `FromEvent` matcher object.
 */
export function triggerToFrom(trigger: Trigger): FromEvent {
  const { mandatory, optional } = resolveModifiers(trigger.modifiers);
  const keys = getTriggerKeys(trigger);
  if (keys.length > 1) {
    return {
      simultaneous: keys.map((k) =>
        isPointerButton(k)
          ? { pointing_button: resolveButton(k).button }
          : { key_code: resolveKeyAlias(k) },
      ),
      simultaneous_options:
        "order" in trigger && trigger.order
          ? {
            ...(trigger.order.down ? { key_down_order: trigger.order.down } : {}),
            ...(trigger.order.up ? { key_up_order: trigger.order.up } : {}),
            ...(trigger.order.upWhen ? { key_up_when: trigger.order.upWhen } : {}),
            ...(trigger.order.detectUninterrupted
              ? { detect_key_down_uninterruptedly: trigger.order.detectUninterrupted }
              : {}),
          }
          : undefined,
      modifiers: { optional: ["any"] },
    } as unknown as FromEvent;
  }
  const k = keys[0]!;
  const from: Record<string, unknown> = isPointerButton(k)
    ? { pointing_button: resolveButton(k).button }
    : { key_code: resolveKeyAlias(k) };
  const modifiersObj: Record<string, string[]> = {};
  if (mandatory.length) modifiersObj.mandatory = mandatory;
  if (optional.length) modifiersObj.optional = optional;
  else if (!mandatory.length) modifiersObj.optional = [];
  from.modifiers = modifiersObj;
  return from as FromEvent;
}
