// Re-export modifier constants and aliases from their canonical location.
// Static data lives in src/data/key-aliases.ts; Ms is the only local definition.
export {
  HYPER,
  L,
  MEH,
  MODIFIER_ALIASES,
  R,
  SUPER,
  VM_MODIFIER_ALIASES,
} from "../data/key-aliases";
export type {
  ModifierAlias,
  ModifierKey,
  VirtualModifierAlias,
} from "../data/key-aliases";

/** Milliseconds type alias — used in timing parameters to self-document intent. */
export type Ms = number;
