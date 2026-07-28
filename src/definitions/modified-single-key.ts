import { MOD_COMBO } from "../core/mods";
import {
  APP_BUNDLES,
  CMDS,
  KE_VAR_VALUES,
  KE_VARS,
  PW_BUNDLES,
  TIMINGS,
  URLS,
} from "../data";
import type { Binding } from "../engine";

const modNumBindings: Binding[] = [
  {
    trigger: { keys: ["keypad_1"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectWinBottomLeftEighth,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_3"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectWinBottomRightEighth,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_5"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectWinMaximize,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_7"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectWinTopLeftEighth,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_9"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectWinTopRightEighth,
            background: true,
          },
        ],
      },
    ],
  },
];

const modLetterBindings: Binding[] = [
  {
    trigger: { keys: ["a"], modifiers: ["shift"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.antinoteNewNoteInBackground }],
      },
    ],
  },
  {
    trigger: { keys: ["e"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "key",
            key: "right_arrow",
            modifiers: ["left_command", "control", "option"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "key",
            key: "down_arrow",
            modifiers: ["left_command", "control", "option"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    conditions: [{ app: APP_BUNDLES.skim }],
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "h", modifiers: MOD_COMBO.vmC_C_ }],
      },
    ],
  },
  {
    trigger: { keys: ["k"], modifiers: ["right_option"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "kitty" }] }],
  },
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
  {
    trigger: { keys: ["q"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["left_command", "control", "option"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["r"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "key",
            key: "up_arrow",
            modifiers: ["left_command", "control", "option"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["s"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "shell", command: CMDS.hsFormatSelection }],
      },
    ],
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
    trigger: { keys: ["t"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: CMDS.typinatorNewRule }],
      },
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.scriptTypinatorLastRule }],
      },
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
        do: [{ type: "shell", command: CMDS.scriptTypinatorLastRule }],
      },
    ],
  },
  {
    trigger: { keys: ["u"], modifiers: ["left_command"] },
    conditions: [{ app: APP_BUNDLES.skim }],
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "u", modifiers: MOD_COMBO.vmC_C_ }],
      },
    ],
  },
];

const modSymbolBindings: Binding[] = [
  {
    trigger: { keys: ["comma"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: APP_BUNDLES.systemSettings }],
      },
    ],
  },
  {
    trigger: { keys: ["slash"], modifiers: ["left_command"] },
    cases: [
      {
        // AUTHENTICATION DIALOG fill password.
        phase: "press",
        conditions: [
          { app: PW_BUNDLES },
          {
            var: KE_VARS.accessibilityType,
            equals: KE_VAR_VALUES.axTextField,
          },
          {
            var: KE_VARS.accessibilitySubtype,
            equals: KE_VAR_VALUES.axSecureTextField,
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
            var: KE_VARS.accessibilityType,
            equals: KE_VAR_VALUES.axTextField,
          },
          {
            var: KE_VARS.accessibilitySubtype,
            equals: KE_VAR_VALUES.axSecureTextField,
            unless: true,
          },
        ],
        do: [{ type: "command", ref: CMDS.fillUsernameAndPassword }],
      },
      {
        // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
        phase: "press",
        conditions: [{ app: APP_BUNDLES.word }],
        do: [{ type: "shell", command: CMDS.getWordDocPathAndPrivileges }],
      },
    ],
  },
];

const modNonCharBindings: Binding[] = [
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
  {
    trigger: { keys: ["escape"], modifiers: ["control"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "app", ref: APP_BUNDLES.activityMonitor }],
      },
      { phase: "hold", do: [{ type: "app", ref: APP_BUNDLES.processSpy }] },
    ],
  },
  {
    trigger: { keys: ["escape"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: APP_BUNDLES.activityMonitor }],
      },
    ],
  },
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
    trigger: { keys: ["left_arrow"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "shell",
            command: CMDS.winLeftOrTop,
          },
        ],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: URLS.rectAppPrevDisplay,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["left_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: APP_BUNDLES.zen }],
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
  {
    trigger: { keys: ["right_arrow"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "shell",
            command: CMDS.winRightOrBottom,
          },
        ],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: URLS.rectAppNextDisplay,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["right_arrow"], modifiers: MOD_COMBO.vmC__S },
    conditions: [{ app: APP_BUNDLES.zen }],
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
    trigger: { keys: ["spacebar"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: CMDS.winMaxOrRestore }],
      },
    ],
  },
  {
    trigger: { keys: ["tab"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [
          {
            type: "url",
            url: URLS.rectAppNextDisplay,
            background: true,
          },
        ],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: URLS.rectAppPrevDisplay,
            background: true,
          },
        ],
      },
    ],
  },
];

const modFunctionKeyBindings: Binding[] = [
  {
    trigger: { keys: ["f12"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "shell", command: CMDS.scriptTypinatorLastRule }],
      },
    ],
  },
];

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...modNumBindings,
  ...modLetterBindings,
  ...modSymbolBindings,
  ...modNonCharBindings,
  ...modFunctionKeyBindings,
];
