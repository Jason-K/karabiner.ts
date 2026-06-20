import {
  generateMultiTapRule,
  type MultiTapConfig,
} from "../engine/multi-tap-rules";

const DOUBLE_TAP_DELAY_MS = 600;

// `raycast-x://` is the URL scheme for the Raycast v2 beta.
const RAYCAST_CLIPBOARD_HISTORY_URL =
  "raycast-x://extensions/raycast/clipboard-history/clipboard-history";

export const leftShiftMultiTap: MultiTapConfig = {
  key: "left_shift",
  description: "Raycast clipboard history",
  alone: [{ type: "key", key: "left_shift" }],
  hold: [{ type: "key", key: "left_shift" }],
  tapTap: [
    {
      type: "shell",
      command: `open -u ${RAYCAST_CLIPBOARD_HISTORY_URL}`,
    },
  ],
  thresholdMs: DOUBLE_TAP_DELAY_MS,
  allowPassThrough: true,
  mods: [],
};

export const rightShiftMultiTap: MultiTapConfig = {
  key: "right_shift",
  description: "Raycast clipboard history",
  alone: [{ type: "key", key: "right_shift" }],
  hold: [{ type: "key", key: "right_shift" }],
  tapTap: [
    {
      type: "shell",
      command: `open -u ${RAYCAST_CLIPBOARD_HISTORY_URL}`,
    },
  ],
  thresholdMs: DOUBLE_TAP_DELAY_MS,
  allowPassThrough: true,
  mods: [],
};

export const buildShiftRules = () => [
  generateMultiTapRule(leftShiftMultiTap),
  generateMultiTapRule(rightShiftMultiTap),
];
