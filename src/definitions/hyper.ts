import { MOD_COMBO } from "../core/mods";
import { APPS, CMDS } from "../data";
import { URLS } from "../data/urls";
import { defineBindings, type Binding } from "../engine";

// Launcher triggers use MOD_COMBO.vmCOCS (the expanded modifier array) because
// buildRemap — unlike buildTapHold — does not expand alias modifiers.
export const hyperLauncherBindings: Binding[] = [
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
    trigger: { keys: ["comma"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: APPS.systemSettings }],
      },
    ],
  },
  {
    trigger: { keys: ["f12"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "shell", command: CMDS.typinatorEditLastRule }],
      },
    ],
  },
  {
    trigger: { keys: ["escape"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: APPS.activityMonitor }],
      },
    ],
  },
];

export const hyperTapHoldBindings: Binding[] = [
  {
    trigger: { keys: ["t"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: CMDS.typinatorNewRule }],
      },
      {
        phase: "hold",
        do: [{ type: "shell", command: CMDS.typinatorEditLastRule }],
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
        // do: [{ type: "shell", command: rectangleOrientationBasedCommand("right-half", "bottom-half") }],
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
];

export const buildHyperLauncherRules = () => defineBindings(hyperLauncherBindings);
