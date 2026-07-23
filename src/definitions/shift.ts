import type { ActionSpec } from "../core/action-dsl";
import { defineBindings, type Binding } from "../engine";

const DOUBLE_TAP_DELAY_MS = 600;

// `raycast-x://` is the URL scheme for the Raycast v2 beta.
const RAYCAST_CLIPBOARD_HISTORY_URL =
  "raycast-x://extensions/raycast/clipboard-history/clipboard-history";

const clipboardHistoryAction: ActionSpec = {
  type: "shell",
  command: `open -u ${RAYCAST_CLIPBOARD_HISTORY_URL}`,
};

// A shift key that passes through on tap/hold and opens Raycast clipboard
// history on double-tap. Left and right shift behave identically apart from
// the key they pass through, so this factory keeps the two bindings in sync.
function shiftClipboardBinding(key: "left_shift" | "right_shift"): Binding {
  return {
    trigger: { keys: [key] },
    timing: { aloneMs: DOUBLE_TAP_DELAY_MS, heldThresholdMs: DOUBLE_TAP_DELAY_MS },
    multiTap: { allowPassThrough: true, mods: [] },
    cases: [
      { phase: "release", do: [{ type: "key", key }] },
      { phase: "hold", do: [{ type: "key", key }] },
      { tapCount: 2, phase: "release", do: [clipboardHistoryAction] },
    ],
  };
}

export const shiftBindings: Binding[] = [
  shiftClipboardBinding("left_shift"),
  shiftClipboardBinding("right_shift"),
];

export const buildShiftRules = () => defineBindings(shiftBindings);
