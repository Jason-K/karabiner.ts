import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";
import {
    generateMultiTapRule,
    type MultiTapConfig,
} from "../engine/multi-tap-rules";

const LEFT_COMMAND_TAP_DELAY_MS = 600;

export const leftCommandMultiTap: MultiTapConfig = {
  key: "left_command",
  description: "Tap/double-tap/hold handler",
  alone: [{ type: "key", key: "left_command" }],
  hold: [{ type: "key", key: "left_command" }],
  tapTap: [{ type: "appHistory", index: 1 }],
  thresholdMs: LEFT_COMMAND_TAP_DELAY_MS,
  allowPassThrough: true,
  mods: [],
};

export const buildLeftCommandRule = () => generateMultiTapRule(leftCommandMultiTap);

export const cmdQGuard: DoubleTapGuardConfig = {
  key: "q",
  modifiers: ["left_command"],
  description: "Quit app",
  timeoutMs: 300,
};

export const buildCmdQRule = () => generateDoubleTapGuardRule(cmdQGuard);
