import { appRegistry } from "../../data";
import { tapHoldBinding, type Binding } from "../../engine";
import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../../engine/double-tap-guard-rules";

export const antinoteTapHoldBindings: Binding[] = [
  tapHoldBinding("a", ["left_shift"], {
    hold: [{ type: "url", url: "antinote://", background: true }],
  }),
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
