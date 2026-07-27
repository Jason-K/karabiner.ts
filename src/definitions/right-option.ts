// export const rightOptionTapHoldBindings: Binding[] = [
//   {
//     trigger: { keys: ["k"], modifiers: ["right_option"] },
//     timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
//     cases: [{ phase: "hold", do: [{ type: "actHere", action: "kitty" }] }],
//   },
//   {
//     trigger: { keys: ["s"], modifiers: ["right_option"] },
//     timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
//     cases: [
//       { phase: "release", do: [{ type: "shell", command: Commands.spotifyToggle }] },
//       { phase: "hold", do: [{ type: "url", url: Urls.raySpotifySearch }] },
//     ],
//   },
//   {
//     trigger: { keys: ["t"], modifiers: ["right_option"] },
//     timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
//     cases: [{ phase: "hold", do: [{ type: "shell", command: Commands.typinatorEditLastRule }] }],
//   },
// ];
