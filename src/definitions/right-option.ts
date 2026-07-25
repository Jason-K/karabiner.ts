import { spotifyToggleCommand } from "../core/scripts";
import { Urls } from "../data";
import { Paths } from "../data/paths";
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
      { phase: "hold", do: [{ type: "url", url: Urls.raySpotifySearch }] },
    ],
  },
  {
    trigger: { keys: ["t"], modifiers: ["right_option"] },
    timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
    cases: [{ phase: "hold", do: [{ type: "osascript", scriptPath: Paths.typinatorEditLastRule.name }] }],
  },
];
