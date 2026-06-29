import { killAppCommand } from "../core/scripts";
import { TIMINGS } from "../data";
import {
  generateMultiTapRule,
  type MultiTapConfig,
} from "../engine/multi-tap-rules";
import {
  generateTapAloneHoldRule,
  type TapAloneHoldConfig,
} from "../engine/tap-alone-hold-rules";

export const escapeTapTapHold: MultiTapConfig = {
  key: "escape",
  description: "Escape / Kill app",
  alone: [{ type: "key", key: "escape" }],
  hold: [{ type: "shell", command: killAppCommand("foreground") }],
  tapTapHold: [{ type: "shell", command: killAppCommand() }],
  thresholdMs: TIMINGS.delayHoldMs,
  mods: [],
};

export const ctrlEscapeConfig: TapAloneHoldConfig = {
  key: "escape",
  modifiers: ["left_control"],
  description: "Activity Monitor / Process Spy",
  alone: [{ type: "app", ref: "activityMonitor" }],
  hold: [{ type: "app", ref: "processSpy" }],
  timeoutMs: TIMINGS.delayHoldMs,
};

export const buildEscapeTapTapHoldRule = () =>
  generateMultiTapRule(escapeTapTapHold);

export const buildCtrlEscapeMonitorRule = () =>
  generateTapAloneHoldRule(ctrlEscapeConfig);
