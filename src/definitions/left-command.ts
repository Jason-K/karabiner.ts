import { MOD_COMBO } from "../core/mods";
import { TIMINGS } from "../data";
import { tapHoldBinding, type Binding } from "../engine";
import {
  generateDoubleTapGuardRule,
  type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";
import {
  generateMultiTapRule,
  type MultiTapConfig,
} from "../engine/multi-tap-rules";

export const leftCommandMultiTap: MultiTapConfig = {
  key: "left_command",
  description: "Tap/double-tap/hold handler",
  alone: [{ type: "key", key: "left_command" }],
  hold: [{ type: "key", key: "left_command" }],
  tapTap: [{ type: "appHistory", index: 1 }],
  thresholdMs: TIMINGS.timeoutDoubleTapMs,
  allowPassThrough: true,
  mods: [],
};

export const cmdQGuard: DoubleTapGuardConfig = {
  key: "q",
  modifiers: ["left_command"],
  description: "Quit app",
  timeoutMs: TIMINGS.timeoutDoubleTapMs,
};

export const leftCommandTapHoldBindings: Binding[] = [
  tapHoldBinding("m", ["left_command"], {
    hold: [
      {
        type: "key",
        key: "m",
        modifiers: MOD_COMBO.vm_OC_,
        options: { repeat: false },
      },
    ],
  }),
  tapHoldBinding("p", ["left_command"], {
    hold: [
      {
        type: "key",
        key: "p",
        modifiers: MOD_COMBO.vmCOC_,
        options: { repeat: false },
      },
    ],
  }),
];

export const buildLeftCommandRule = () =>
  generateMultiTapRule(leftCommandMultiTap);
export const buildCmdQRule = () => generateDoubleTapGuardRule(cmdQGuard);
