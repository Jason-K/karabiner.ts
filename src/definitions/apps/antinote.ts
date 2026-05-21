import { appRegistry } from "../../data";
import type { TapHoldConfig } from "../../engine";
import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../../engine/double-tap-guard-rules";

export const antinoteTapHoldMappings: Record<string, TapHoldConfig> = {
  "left_shift+a": {
    description: "Antinote",
    hold: [{ type: "url", url: "antinote://", background: true }],
  },
};

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [appRegistry.antinote, appRegistry.antinoteLegacy],
};

export const buildAntinoteRules = () => [
  generateDoubleTapGuardRule(antinoteDeleteGuard),
];
