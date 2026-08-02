import {
  buttons,
  type KeyCode,
  type PointerButtonAlias,
  type SimOrder,
  type Trigger,
  type TriggerModifiers,
} from "../data";
import { resolveKeyAlias } from "./utils";

function isPointerButton(input: string): boolean {
  return (
    input in buttons ||
    /^button\d+$/.test(input) ||
    [
      "shift_button",
      "wheel",
      "wheelLeft",
      "wheelRight",
      "leftBack",
      "leftForward",
      "middleBack",
      "left",
      "right",
      "back",
      "forward",
    ].includes(input)
  );
}


/** Unified trigger builder for both keys and pointer buttons. */
export function trigger(
  input: KeyCode | KeyCode[] | PointerButtonAlias,
  modifiers?: TriggerModifiers,
  order?: SimOrder,
): Trigger {
  if (typeof input === "string" && isPointerButton(input)) {
    return {
      pointer: input,
      ...(modifiers ? { modifiers } : {}),
    };
  }
  const keysArray = (Array.isArray(input) ? input : [input as KeyCode]).map(
    (k) => resolveKeyAlias(k as string),
  );
  return {
    keys: keysArray,
    ...(modifiers ? { modifiers } : {}),
    ...(order ? { order } : {}),
  };
}

export function triggerKeys(
  keys: KeyCode | KeyCode[],
  modifiers?: TriggerModifiers,
  order?: SimOrder,
): Trigger {
  const keysArray = (Array.isArray(keys) ? keys : [keys]).map((k) =>
    resolveKeyAlias(k as string),
  );
  return {
    keys: keysArray,
    ...(modifiers ? { modifiers } : {}),
    ...(order ? { order } : {}),
  };
}

export function triggerPointer(
  pointer: PointerButtonAlias,
  modifiers?: TriggerModifiers,
): Trigger {
  return {
    pointer,
    ...(modifiers ? { modifiers } : {}),
  };
}

/**
 * Every event of one kind — Karabiner's `from.any`.
 *
 * Claims the event before any later rule sees it, so pair it with a condition
 * and let {@link compareTriggerSortKeys} put it last in its rule.
 */
export function anyInput(
  kind: "key_code" | "consumer_key_code" | "pointing_button" = "key_code",
  modifiers: TriggerModifiers = { optional: ["any"] },
): Trigger {
  return { any: kind, modifiers };
}

export type FromInput =
  | Trigger
  | KeyCode
  | PointerButtonAlias
  | (KeyCode | PointerButtonAlias)[]
  | { key: KeyCode; modifiers?: TriggerModifiers }
  | { keys: KeyCode | KeyCode[]; modifiers?: TriggerModifiers; order?: SimOrder }
  | { pointer: PointerButtonAlias; modifiers?: TriggerModifiers };

export function from(
  input: FromInput,
  modifiers?: TriggerModifiers,
  order?: SimOrder,
): Trigger {
  if (typeof input === "string" || Array.isArray(input)) {
    return trigger(input as any, modifiers, order);
  }

  if (typeof input === "object" && input !== null) {
    if ("pointer" in input) {
      return triggerPointer(input.pointer, input.modifiers ?? modifiers);
    }
    if ("key" in input) {
      return triggerKeys(input.key, input.modifiers ?? modifiers);
    }
    if ("keys" in input) {
      return triggerKeys(
        input.keys as KeyCode | KeyCode[],
        input.modifiers ?? modifiers,
        input.order ?? order,
      );
    }
    if (modifiers || order) {
      const copy: Trigger = { ...(input as Trigger) };
      if (modifiers) copy.modifiers = modifiers;
      if (order && "keys" in copy) (copy as any).order = order;
      return copy;
    }
    return input as Trigger;
  }

  throw new Error(`Invalid trigger input passed to from(): ${JSON.stringify(input)}`);
}
