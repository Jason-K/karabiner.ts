import { MOD_COMBO } from "../core/mods";
import {
  APPS,
  CMDS,
  PW_BUNDLES,
  TIMINGS,
  URLS,
  WIN_VALS,
  WIN_VARS,
} from "../data";
import type { Binding } from "../engine";

export const lCmdBindings: Binding[] = [
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

export const rOptBindings: Binding[] = [
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

export const ctrlBindings: Binding[] = [
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

export const shiftBindings: Binding[] = [
  {
    trigger: { keys: ["home"], modifiers: ["shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["end"], modifiers: ["shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "right_arrow",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  },
];

export const antinoteRemaps: Binding[] = [
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

export const zenRemaps: Binding[] = [
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

export const skimRemaps: Binding[] = [
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

export const fillPassword: Binding = {
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      // AUTHENTICATION DIALOG fill password.
      phase: "press",
      conditions: [
        { app: PW_BUNDLES },
        {
          var: WIN_VARS.focusedUiRole,
          equals: WIN_VALS.textFieldRole,
        },
        {
          var: WIN_VARS.focusedUiSubrole,
          equals: WIN_VALS.secureTextFieldSubrole,
        },
      ],
      do: [{ type: "command", ref: CMDS.fillPassword }],
    },
    {
      // AUTHENTICATION DIALOG: fill username and password.
      phase: "press",
      conditions: [
        { app: PW_BUNDLES },
        {
          var: WIN_VARS.focusedUiRole,
          equals: WIN_VALS.textFieldRole,
        },
        {
          var: WIN_VARS.focusedUiSubrole,
          equals: WIN_VALS.secureTextFieldSubrole,
          unless: true,
        },
      ],
      do: [{ type: "command", ref: CMDS.fillUsernameAndPassword }],
    },
    {
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      phase: "press",
      conditions: [{ app: APPS.word }],
      do: [{ type: "shell", command: CMDS.getWordDocPathAndPrivileges }],
    },
  ],
};

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...lCmdBindings,
  ...rOptBindings,
  ...ctrlBindings,
  ...shiftBindings,
  ...antinoteRemaps,
  ...zenRemaps,
  ...skimRemaps,
  fillPassword,
];
