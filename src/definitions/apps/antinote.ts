import { appRegistry } from "../../data";
import type { Binding } from "../../engine";
import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../../engine/double-tap-guard-rules";

export const antinoteTapHoldBindings: Binding[] = [
  {
    trigger: { keys: ["a"], modifiers: ["shift"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: "antinote://", background: true }],
      },
    ],
  },
];

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [appRegistry.antinote],
};

export const buildAntinoteRules = () => [
  generateDoubleTapGuardRule(antinoteDeleteGuard),
];
