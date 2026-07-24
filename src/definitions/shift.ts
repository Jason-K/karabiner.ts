import { urlRegistry } from "../data";
import { TIMINGS } from "../data/timings";
import { defineBindings, type Binding } from "../engine";

// A shift key that passes through on tap/hold and opens Raycast clipboard
// history on double-tap. Left and right shift behave identically apart from
// the key they pass through, so this factory keeps the two bindings in sync.

export const shiftBindings: Binding[] = [
  {
    trigger: { keys: ["left_shift"] },
    timing: {
      aloneMs: TIMINGS.timeoutDoubleTapMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    multiTap: { allowPassThrough: true, mods: [] },
    cases: [
      { phase: "release", do: [{ type: "key", key: "left_shift" }] },
      { phase: "hold", do: [{ type: "key", key: "left_shift" }] },
      {
        tapCount: 2,
        phase: "release",
        do: [{ type: "url", url: urlRegistry.rayClipboard }],
      },
    ],
  },
  {
    trigger: { keys: ["right_shift"] },
    timing: {
      aloneMs: TIMINGS.timeoutDoubleTapMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    multiTap: { allowPassThrough: true, mods: [] },
    cases: [
      { phase: "release", do: [{ type: "key", key: "right_shift" }] },
      { phase: "hold", do: [{ type: "key", key: "right_shift" }] },
      {
        tapCount: 2,
        phase: "release",
        do: [{ type: "url", url: urlRegistry.rayClipboard }],
      },
    ],
  },
];

export const buildShiftRules = () => defineBindings(shiftBindings);
