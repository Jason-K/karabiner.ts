import { MOD_COMBO } from "../core/mods";
import { APPS, CMDS, TIMINGS, URLS } from "../data";
import type { Binding } from "../engine";

const lCmdBindings: Binding[] = [
  {
    trigger: { keys: ["m"], modifiers: ["left_command"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "m",
            modifiers: MOD_COMBO.vm_OC_,
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["p"], modifiers: ["left_command"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "p",
            modifiers: MOD_COMBO.vmCOC_,
            options: { repeat: false },
          },
        ],
      },
    ],
  },
];

const rOptBindings: Binding[] = [
  {
    trigger: { keys: ["k"], modifiers: ["right_option"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "kitty" }] }],
  },
  {
    trigger: { keys: ["s"], modifiers: ["right_option"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: CMDS.spotifyToggle }],
      },
      { phase: "hold", do: [{ type: "url", url: URLS.raySpotifySearch }] },
    ],
  },
  {
    trigger: { keys: ["t"], modifiers: ["right_option"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.typinatorEditLastRule }],
      },
    ],
  },
];

const ctrlBindings: Binding[] = [
  {
    trigger: { keys: ["escape"], modifiers: ["control"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "app", ref: APPS.activityMonitor }],
      },
      { phase: "hold", do: [{ type: "app", ref: APPS.processSpy }] },
    ],
  },
];


const antinoteRemaps: Binding[] = [
  {
    trigger: { keys: ["a"], modifiers: ["shift"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.antinoteNewNoteInBackground }],
      },
    ],
  },
];

const zenRemaps: Binding[] = [
  {
    trigger: { keys: ["right_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: APPS.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "close_bracket",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["left_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: APPS.zen }],
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "open_bracket",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
];

const skimRemaps: Binding[] = [
  {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    conditions: [{ app: APPS.skim }],
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "h", modifiers: MOD_COMBO.vmC_C_ }],
      },
    ],
  },
  {
    trigger: { keys: ["u"], modifiers: ["left_command"] },
    conditions: [{ app: APPS.skim }],
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "u", modifiers: MOD_COMBO.vmC_C_ }],
      },
    ],
  },
];

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...lCmdBindings,
  ...rOptBindings,
  ...ctrlBindings,
  ...antinoteRemaps,
  ...zenRemaps,
  ...skimRemaps,
];
