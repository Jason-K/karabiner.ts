import { spotifyToggleCommand } from "../core/scripts";
import { raycastRegistry } from "../data";
import { PATHS } from "../data/paths";
import { TIMINGS } from "../data/timings";
import type { Binding } from "../engine";

export const rightOptionTapHoldBindings: Binding[] = [
  {
    trigger: { keys: ["k"], modifiers: ["right_option"] },
    timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "kitty" }] }],
  },
  {
    trigger: { keys: ["s"], modifiers: ["right_option"] },
    timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
    cases: [
      { phase: "release", do: [{ type: "shell", command: spotifyToggleCommand() }] },
      { phase: "hold", do: [{ type: "raycast", ref: raycastRegistry.spotifySearch }] },
    ],
  },
  {
    trigger: { keys: ["t"], modifiers: ["right_option"] },
    timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
    cases: [{ phase: "hold", do: [{ type: "osascript", scriptPath: PATHS.typinatorEditLastRule }] }],
  },
];

// export const buildRightOptionLauncherRules = () =>
//   generateModifierLauncherRules({
//     triggerKey: "right_option",
//     launchers: rightOptionLaunchers,
//   });
