import { MODIFIER_KEY_CODES } from "../data";

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEY_CODES.has(key);
}

export * from "./utils/input-devices";
export * from "./utils/sanitize-actions";
