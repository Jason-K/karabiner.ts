import { APP_ID } from "../data";
import type { DoubleTapGuardConfig } from "../engine/double-tap-guard-rules";

export const globalGuards: DoubleTapGuardConfig = {
  key: "q",
  modifiers: ["left_command"],
  description: "Quit app",
};

export const antinoteGuards: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [APP_ID.antinote],
};

export const guardRules: DoubleTapGuardConfig[] = [
  globalGuards,
  antinoteGuards,
];

