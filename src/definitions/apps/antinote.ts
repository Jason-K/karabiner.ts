import { Apps } from "../../data";
import {
  generateDoubleTapGuardRule,
  type DoubleTapGuardConfig,
} from "../../engine/double-tap-guard-rules";

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [Apps.antinote],
};

export const buildAntinoteRules = () => [
  generateDoubleTapGuardRule(antinoteDeleteGuard),
];
