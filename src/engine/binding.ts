import type { ActionSpec } from "../core/action-dsl";

/** When in the key lifecycle the case's action fires. Maps to a Karabiner output channel. */
export type Phase = "press" | "release" | "hold";
// press      -> to
// release    -> to_if_alone   (tap: release within aloneMs, uninterrupted)
// hold       -> to_if_held_down

/** External state condition. Realized as a Karabiner `conditions[]` entry. */
export type Condition =
  | { app: string | string[]; unless?: boolean }
  | { var: string; equals: string | number; unless?: boolean }
  | { device: string; unless?: boolean }; // reserved for the later mouse round

export type SimOrder = {
  down?: "insensitive" | "strict" | "strict_inverse";
  up?: "insensitive" | "strict" | "strict_inverse";
  upWhen?: "any" | "all";
  detectUninterrupted?: boolean;
};

/** What was pressed. 1 key = single; 2+ keys = simultaneous chord. */
export type Trigger =
  | { keys: string[]; modifiers?: string[]; order?: SimOrder }
  | { pointer: string; modifiers?: string[] };

/** One (state + timing) -> action pairing. */
export type Case = {
  tapCount?: number; // default 1; 2 = double-tap, etc. (framework-managed state)
  phase?: Phase; // default "press"
  conditions?: Condition[];
  do: ActionSpec[]; // { type: "noop" } = swallow (omits `to`)
};

/** One binding = one description = one Karabiner rule. */
export type Binding = {
  description: string;
  trigger: Trigger;
  timing?: {
    aloneMs?: number;
    heldThresholdMs?: number;
    delayedMs?: number;
    simultaneousMs?: number;
  };
  conditions?: Condition[]; // hoisted — applied to every case
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: { allowPassThrough?: boolean; mods?: string[] };
  afterKeyUp?: ActionSpec[];
};
