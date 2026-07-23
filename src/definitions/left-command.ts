import { MOD_COMBO } from "../core/mods";
import { TIMINGS } from "../data";
import { defineBindings, tapHoldBinding, type Binding } from "../engine";
import {
  generateDoubleTapGuardRule,
  type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";

export const leftCommandMultiTapBinding: Binding = {
  trigger: { keys: ["left_command"] },
  timing: { aloneMs: TIMINGS.timeoutDoubleTapMs, heldThresholdMs: TIMINGS.timeoutDoubleTapMs },
  multiTap: { allowPassThrough: true, mods: [] },
  cases: [
    { phase: "release", do: [{ type: "key", key: "left_command" }] },
    { phase: "hold", do: [{ type: "key", key: "left_command" }] },
    { tapCount: 2, phase: "release", do: [{ type: "appHistory", index: 1 }] },
  ],
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
  defineBindings([leftCommandMultiTapBinding])[0]!;
export const buildCmdQRule = () => generateDoubleTapGuardRule(cmdQGuard);
