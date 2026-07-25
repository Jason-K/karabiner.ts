import { MOD_COMBO } from "../core/mods";
import {
  formatSelectionCommand,
  typinatorNewRuleCommand,
} from "../core/scripts";
import { Paths, Apps, Commands } from "../data";
import { Urls } from "../data/urls";
import { defineBindings, type Binding } from "../engine";

// Launcher triggers use MOD_COMBO.vmCOCS (the expanded modifier array) because
// buildRemap — unlike buildTapHold — does not expand alias modifiers.
export const hyperLauncherBindings: Binding[] = [
  {
    trigger: { keys: ["s"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "shell", command: Commands.hsFormatSelection }],
      },
    ],
  },
  {
    trigger: { keys: ["comma"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: Apps.systemSettings }],
      },
    ],
  },
  {
    trigger: { keys: ["f12"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "shell", command: Commands.typinatorEditLastRule }],
      },
    ],
  },
  {
    trigger: { keys: ["escape"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      {
        phase: "press",
        do: [{ type: "app", ref: Apps.activityMonitor }],
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
        do: [{ type: "shell", command: Commands.typinatorNewRule }],
      },
      {
        phase: "hold",
        do: [
          { type: "shell", command: Commands.typinatorEditLastRule },
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
            url: Urls.rectWinBottomLeftEighth,
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
            url: Urls.rectWinBottomRightEighth,
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
            url: Urls.rectWinMaximize,
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
            url: Urls.rectWinTopLeftEighth,
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
            url: Urls.rectWinTopRightEighth,
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
        do: [{ type: "shell", command: Commands.winMaxOrRestore }],
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
            url: Urls.rectAppNextDisplay,
            background: true,
          },
        ],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: Urls.rectAppPrevDisplay,
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
            command: Commands.winLeftOrTop,
          },
        ],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: Urls.rectAppPrevDisplay,
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
            command: Commands.winRightOrBottom,
          },
        ],
        // do: [{ type: "shell", command: rectangleOrientationBasedCommand("right-half", "bottom-half") }],
      },
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: Urls.rectAppNextDisplay,
            background: true,
          },
        ],
      },
    ],
  },
];

export const buildHyperLauncherRules = () => defineBindings(hyperLauncherBindings);
