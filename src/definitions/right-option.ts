import { spotifyToggleCommand } from "../core/scripts";
import { raycastRegistry } from "../data";
import { PATHS } from "../data/paths";
import { TIMINGS } from "../data/timings";
import { tapHoldBinding, type Binding } from "../engine";

export const rightOptionTapHoldBindings: Binding[] = [
  tapHoldBinding("k", ["right_option"], {
    hold: [{ type: "actHere", action: "kitty" }],
    timeoutMs: TIMINGS.delayHoldMs,
    thresholdMs: TIMINGS.delayHoldMs,
  }),
  tapHoldBinding("s", ["right_option"], {
    alone: [{ type: "shell", command: spotifyToggleCommand() }],
    hold: [{ type: "raycast", ref: raycastRegistry.spotifySearch }],
    timeoutMs: TIMINGS.delayHoldMs,
    thresholdMs: TIMINGS.delayHoldMs,
  }),
  tapHoldBinding("t", ["right_option"], {
    hold: [{ type: "osascript", scriptPath: PATHS.typinatorEditLastRule }],
    timeoutMs: TIMINGS.delayHoldMs,
    thresholdMs: TIMINGS.delayHoldMs,
  }),
];

// export const buildRightOptionLauncherRules = () =>
//   generateModifierLauncherRules({
//     triggerKey: "right_option",
//     launchers: rightOptionLaunchers,
//   });
