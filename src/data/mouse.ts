import { type PointingButton, type ToEvent } from "karabiner.ts";
import { DEVICE_IDENTIFIERS } from "./devices";
import type { VarSpec } from "./refs";

// ── Button registry (replaces g502xButtons) ────────────────────────────────

export type DeviceName = keyof typeof DEVICE_IDENTIFIERS;

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
  shift: { button: "button5", nameScope: ["logitechG502X"], desc: "Shift button" },
  forward: { button: "button6", nameScope: ["logitechG502X"], desc: "Forward button" },
  wheelLeft: { button: "button7", nameScope: ["logitechG502X"], desc: "Wheel left" },
  wheelRight: { button: "button8", nameScope: ["logitechG502X"], desc: "Wheel right" },
  middleBack: { button: "button9", nameScope: ["logitechG502X"], desc: "Middle-back (G9)" },
  leftForward: { button: "button10", nameScope: ["logitechG502X"], desc: "Left-forward (G8)" },
  leftBack: { button: "button11", nameScope: ["logitechG502X"], desc: "Left-back (G7)" },
} as const satisfies Record<string, ButtonSpec>;

export const defaultButtonNames: Record<string, string> = {
  button1: "Left click",
  button2: "Right click",
  button3: "Middle click",
};

/** Resolve a pointer alias (or raw button id) → button + nameScope + label. */
export function resolveButton(pointer: string): {
  button: string;
  nameScope?: ButtonSpec["nameScope"];
  desc: string;
} {
  const spec = (buttons as Record<string, ButtonSpec>)[pointer];
  if (spec) return { button: spec.button, nameScope: spec.nameScope, desc: spec.desc };
  return { button: pointer, desc: defaultButtonNames[pointer] ?? pointer };
}

/** Mouse chord-modifier signaling variables. */
export const mouseVars = {
  rightButtonPressed: { name: "right_button_pressed", varDesc: "Right button held" },
  wheelDown: { name: "wheel_down", varDesc: "Wheel held down" },
  leftButtonPressed: { name: "left_button_pressed", varDesc: "Left button held" },
  leftWithRightFirstTap: { name: "left_with_right_first_tap", varDesc: "Left+right first tap" },
} as const satisfies Record<string, VarSpec>;
