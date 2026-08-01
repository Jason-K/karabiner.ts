import { type PointingButton } from "karabiner.ts";
import { DEVICES } from "../registries/devices";
import type { VarSpec } from "../primitives/vars";

// ── Button registry (replaces g502xButtons) ────────────────────────────────

export type DeviceName = keyof typeof DEVICES;

export type ButtonSpec = {
  button: PointingButton;
  nameScope: "global" | DeviceName[];
  desc: string;
};

export const buttons = {
  // Physically standard (most pointing devices) → global. Bindings that must
  // restrict them add an explicit `device` condition.
  left: { button: "button1", nameScope: "global", desc: "Left click" },
  right: { button: "button2", nameScope: "global", desc: "Right click" },
  middle: { button: "button3", nameScope: "global", desc: "Middle click" },
  wheel: { button: "button3", nameScope: "global", desc: "Wheel click" },
  back: { button: "button4", nameScope: "global", desc: "Back button" },
  // G502X-specific extra buttons → auto-scope to the G502X.
  shift_button: {
    button: "button5",
    nameScope: ["g502X"],
    desc: "Shift button",
  },
  forward: {
    button: "button6",
    nameScope: ["g502X"],
    desc: "Forward button",
  },
  wheelLeft: {
    button: "button7",
    nameScope: ["g502X"],
    desc: "Wheel left",
  },
  wheelRight: {
    button: "button8",
    nameScope: ["g502X"],
    desc: "Wheel right",
  },
  middleBack: {
    button: "button9",
    nameScope: ["g502X"],
    desc: "Middle-back (G9)",
  },
  leftForward: {
    button: "button10",
    nameScope: ["g502X"],
    desc: "Left-forward (G8)",
  },
  leftBack: {
    button: "button11",
    nameScope: ["g502X"],
    desc: "Left-back (G7)",
  },
} as const satisfies Record<string, ButtonSpec>;

export const defaultButtonNames: Record<string, string> = {
  button1: "Left click",
  button2: "Right click",
  button3: "Middle click",
};

// ── Mouse signaling variables ────────────────────────────────────────────────

export { mouseVars } from "../registries/vars";

/** Known mouse button aliases for auto-completion. */
export type KnownPointerButton =
  | "button1" | "button2" | "button3" | "button4" | "button5"
  | "shift_button" | "wheel" | "wheelLeft" | "wheelRight"
  | "leftBack" | "leftForward" | "middleBack"
  | "left" | "right" | "back" | "forward";

/** Pointer button string type with IntelliSense auto-completion for known mouse button aliases. */
export type PointerButtonAlias = KnownPointerButton | (string & {});

