// Re-export modifier constants and aliases from their canonical location.
// Static data lives in src/data/key-aliases.ts; Ms is the only local definition.
export { HYPER, SUPER, MEH, MODIFIER_ALIASES, L, R } from "../data/key-aliases";

/** Milliseconds type alias — used in timing parameters to self-document intent. */
export type Ms = number;
