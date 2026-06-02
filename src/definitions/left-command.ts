import { L } from "../core/mods";
import type { TapHoldConfig } from "../engine";
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
  alone: [{ type: "key", key: L.cmd }],
  hold: [{ type: "key", key: L.cmd }],
  tapTap: [{ type: "appHistory", index: 1 }],
  thresholdMs: LEFT_COMMAND_TAP_DELAY_MS,
  allowPassThrough: true,
  mods: [],
};

export const cmdQGuard: DoubleTapGuardConfig = {
  key: "q",
  modifiers: [L.cmd],
  description: "Quit app",
  timeoutMs: 300,
};

export const leftCommandTapHoldMappings: Record<string, TapHoldConfig> = {
  "left_command+m": {
    description: "Deminimize",
    hold: [
      {
        type: "key",
        key: "m",
        modifiers: [L.opt, L.ctrl],
        options: { repeat: false },
      },
    ],
  },
  "left_command+p": {
    description: "Paletro",
    hold: [
      {
        type: "key",
        key: "p",
        modifiers: ["vmCOC_"],
        options: { repeat: false },
      },
    ],
  },
};

export const buildLeftCommandRule = () =>
  generateMultiTapRule(leftCommandMultiTap);
export const buildCmdQRule = () => generateDoubleTapGuardRule(cmdQGuard);
