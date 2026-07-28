import { APP_BUNDLES, CMDS, PATHS, TIMINGS, URLS } from "../data";
import type { Binding } from "../engine";

//   SINGLE KEY TAP/HOLD RULES — one binding per key; hold fires the action,
//   tap passes the key through (the engine's default-alone behavior).

const numBindings: Binding[] = [
  {
    trigger: { keys: ["8"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "app", ref: APP_BUNDLES.ringCentral, mode: "shell" }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_0"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinsUnstashAll, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_2"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinStashDown, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_4"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinStashLeft, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_5"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinsUnstash, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_6"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinStashRight, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_8"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.rectWinStashUp, background: true }],
      },
    ],
  },
];

const letterBindings: Binding[] = [
  {
    trigger: { keys: ["a"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f18",
            modifiers: ["vmCOC_"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },

  {
    trigger: { keys: ["c"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "7",
            modifiers: ["vmCO_S"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["d"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f1",
            modifiers: ["vmCO_S"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "qspace" }] }],
  },
  {
    trigger: { keys: ["g"] },
    cases: [
      { phase: "hold", do: [{ type: "app", ref: APP_BUNDLES.claude, mode: "shell" }] },
    ],
  },
  {
    trigger: { keys: ["h"] },
    cases: [{ phase: "hold", do: [{ type: "url", url: URLS.rayHere2There }] }],
  },
  {
    trigger: { keys: ["j"] },
    cases: [
      { phase: "hold", do: [{ type: "url", url: URLS.rayRecentDownloads }] },
    ],
  },
  {
    trigger: { keys: ["k"] },
    cases: [{ phase: "hold", do: [{ type: "app", ref: APP_BUNDLES.kitty }] }],
  },
  {
    trigger: { keys: ["n"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: URLS.newClientNote,
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["o"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: URLS.csxCaptureTextNoLinebreaks }],
      },
    ],
  },
  {
    trigger: { keys: ["p"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f9",
            modifiers: ["vmCOCS"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["q"] },
    cases: [
      { phase: "hold", do: [{ type: "app", ref: APP_BUNDLES.qspace }] },
    ],
  },
  {
    trigger: { keys: ["r"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "shell", command: PATHS.scriptNewDLs }],
      },
    ],
  },
  {
    trigger: { keys: ["s"] },
    cases: [{ phase: "hold", do: [{ type: "url", url: URLS.csxCaptureArea }] }],
  },
  {
    trigger: { keys: ["s"], modifiers: ["shift"] },
    cases: [
      { phase: "hold", do: [{ type: "url", url: URLS.csxCaptureWindow }] },
    ],
  },
  {
    trigger: { keys: ["t"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f11",
            modifiers: ["vm_OCS"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["v"] },
    cases: [{ phase: "hold", do: [{ type: "url", url: URLS.rayClipboard }] }],
  },
  {
    trigger: { keys: ["x"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "copy" }] }],
  },
  {
    trigger: { keys: ["y"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "copy" }] }],
  },
  {
    trigger: { keys: ["z"] },
    cases: [
      { phase: "hold", do: [{ type: "url", url: URLS.rayZoxideSearchDirs }] },
    ],
  },
];

const symbolBindings: Binding[] = [
  {
    trigger: { keys: ["keypad_equal_sign"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "key", key: "keypad_equal_sign", options: { halt: true } }],
      },
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          { type: "key", key: "c", modifiers: ["left_command"] },
          { type: "shell", command: CMDS.tpQuickDate },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["equal_sign"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "key", key: "keypad_equal_sign", options: { halt: true } }],
      },
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          { type: "key", key: "c", modifiers: ["left_command"] },
          { type: "shell", command: CMDS.tpQuickDate },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["slash"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "h",
            modifiers: ["vmCOCS"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["grave_accent_and_tilde"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f9",
            modifiers: ["vmCOCS"],
            options: { halt: true, repeat: false },
          },
        ],
      },
    ],
  },
]

const nonCharBindings: Binding[] = [
  {
    trigger: { keys: ["keypad_enter"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "key", key: "keypad_enter", options: { halt: true } }],
      },
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.hsFormatCutSeed }],
        conditions: [{ app: APP_BUNDLES.excel, unless: true }],
      },
      {
        phase: "hold",
        do: [{ type: "key", key: "f2", options: { repeat: false } }],
        conditions: [{ app: APP_BUNDLES.excel }],
      },
    ],
  },
  {
    trigger: { keys: ["return_or_enter"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    cases: [
      {
        phase: "release",
        do: [{ type: "key", key: "return_or_enter", options: { halt: true } }],
      },
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.hsFormatCutSeed }],
        conditions: [{ app: APP_BUNDLES.excel, unless: true }],
      },
      {
        phase: "hold",
        do: [{ type: "key", key: "f2", options: { repeat: false } }],
        conditions: [{ app: APP_BUNDLES.excel }],
      },
    ],
  },
  {
    trigger: { keys: ["tab"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "mission_control",
            options: { halt: true, repeat: true },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["escape"] },
    timing: {
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    },
    multiTap: { mods: [] },
    cases: [
      { phase: "release", do: [{ type: "key", key: "escape" }] },
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.killForegroundApp }],
      },
      {
        tapCount: 2,
        phase: "hold",
        do: [{ type: "shell", command: CMDS.killAllApps }],
      },
    ],
  },
  {
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
  {
    trigger: { keys: ["end"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "right_arrow", modifiers: ["left_command"] }],
      },
    ],
  },
];

const functionKeyBindings: Binding[] = [
  {
    trigger: { keys: ["f1"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "display_brightness_decrement",
            options: { repeat: true },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f2"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "display_brightness_increment",
            options: { repeat: true },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f3"] },
    cases: [
      {
        phase: "hold",
        do: [
          { type: "key", key: "mission_control", options: { repeat: false } },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f4"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "launchpad", options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["f5"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f5",
            modifiers: ["vmCOC_"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f7"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "rewind", options: { repeat: true } }],
      },
    ],
  },
  {
    trigger: { keys: ["f8"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "play_or_pause", options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["f9"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "fastforward", options: { repeat: true } }],
      },
    ],
  },
  {
    trigger: { keys: ["f10"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "mute", options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["f11"] },
    cases: [
      {
        phase: "hold",
        do: [
          { type: "key", key: "volume_decrement", options: { repeat: true } },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["f12"] },
    cases: [
      {
        phase: "hold",
        do: [
          { type: "key", key: "volume_increment", options: { repeat: true } },
        ],
      },
    ],
  },
];

const modifierKeyBindings: Binding[] = [
  {
    trigger: { keys: ["fn"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "key",
            key: "f5",
            modifiers: ["vmCOC_"],
            options: { repeat: false },
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["left_command"] },
    timing: {
      aloneMs: TIMINGS.timeoutDoubleTapMs,
      heldThresholdMs: TIMINGS.timeoutDoubleTapMs,
    },
    multiTap: { allowPassThrough: true, mods: [] },
    cases: [
      { phase: "release", do: [{ type: "key", key: "left_command" }] },
      { phase: "hold", do: [{ type: "key", key: "left_command" }] },
      { tapCount: 2, phase: "release", do: [{ type: "appHistory", index: 1 }] },
    ],
  },
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
        do: [{ type: "url", url: URLS.rayClipboard }],
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
        do: [{ type: "url", url: URLS.rayClipboard }],
      },
    ],
  },
];

export const singleKeyTapHoldBindings: Binding[] = [
  ...numBindings,
  ...letterBindings,
  ...symbolBindings,
  ...nonCharBindings,
  ...functionKeyBindings,
  ...modifierKeyBindings,
];
