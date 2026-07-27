import { APPS, TIMINGS } from "../data";
import {
  generateDoubleTapGuardRule,
  type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";

const globalGuards: DoubleTapGuardConfig = {
  key: "q",
  modifiers: ["left_command"],
  description: "Quit app",
  timeoutMs: TIMINGS.timeoutDoubleTapMs,
};

const antinoteGuards: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [APPS.antinote],
};

export const guardRules: DoubleTapGuardConfig[] = [
  globalGuards,
  antinoteGuards,
];

export const buildGuardRules = () =>
  guardRules.map((guard) => generateDoubleTapGuardRule(guard));
