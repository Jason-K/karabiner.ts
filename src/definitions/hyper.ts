import { MOD_COMBO } from "../core/mods";
import {
  formatSelectionCommand,
  typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS, appRegistry } from "../data";
import {
  rectangleActionUrl,
  rectangleMaxOrRestoreCommand,
  rectangleOrientationBasedCommand,
} from "../data/rectangle";
import { urlRegistry } from "../data/urls";
import { defineBindings, type Binding } from "../engine";

// Launcher triggers use MOD_COMBO.vmCOCS (the expanded modifier array) because
// buildRemap — unlike buildTapHold — does not expand alias modifiers.
export const hyperLauncherBindings: Binding[] = [
  {
    trigger: { keys: ["s"], modifiers: MOD_COMBO.vmCOCS },
    cases: [{ phase: "press", do: [{ type: "shell", command: formatSelectionCommand() }] }],
  },
  // { trigger: { keys: ["t"], modifiers: MOD_COMBO.vmCOCS }, cases: [{ phase: "press", do: [{ type: "shell", command: typinatorNewRuleCommand() }] }] },
  {
    trigger: { keys: ["comma"], modifiers: MOD_COMBO.vmCOCS },
    cases: [{ phase: "press", do: [{ type: "app", ref: appRegistry.systemSettings }] }],
  },
  {
    trigger: { keys: ["f12"], modifiers: MOD_COMBO.vmCOCS },
    cases: [
      { phase: "press", do: [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }] },
    ],
  },
  {
    trigger: { keys: ["escape"], modifiers: MOD_COMBO.vmCOCS },
    cases: [{ phase: "press", do: [{ type: "app", ref: appRegistry.activityMonitor }] }],
  },
];

export const hyperTapHoldBindings: Binding[] = [
  {
    trigger: { keys: ["t"], modifiers: ["vmCOCS"] },
    cases: [
      { phase: "release", do: [{ type: "shell", command: typinatorNewRuleCommand() }] },
      { phase: "hold", do: [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }] },
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
            modifiers: ["left_command", "left_control", "left_option"],
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
            modifiers: ["left_command", "left_control", "left_option"],
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
            modifiers: ["left_command", "left_control", "left_option"],
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
            modifiers: ["left_command", "left_control", "left_option"],
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
        do: [{ type: "url", url: rectangleActionUrl("bottom-left-eighth"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_3"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "url", url: rectangleActionUrl("bottom-right-eighth"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_5"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "url", url: urlRegistry.rectWinMaximize.name, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_7"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "url", url: rectangleActionUrl("top-left-eighth"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_9"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "url", url: rectangleActionUrl("top-right-eighth"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["spacebar"], modifiers: ["vmCOCS"] },
    cases: [
      { phase: "release", do: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }] },
    ],
  },
  {
    trigger: { keys: ["tab"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "url", url: urlRegistry.rectAppNextDisplay.name, background: true }],
      },
      {
        phase: "hold",
        do: [{ type: "url", url: urlRegistry.rectAppPrevDisplay.name, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["left_arrow"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: rectangleOrientationBasedCommand("left-half", "top-half") }],
      },
      {
        phase: "hold",
        do: [{ type: "url", url: urlRegistry.rectAppPrevDisplay.name, background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["right_arrow"], modifiers: ["vmCOCS"] },
    cases: [
      {
        phase: "release",
        do: [{ type: "shell", command: rectangleOrientationBasedCommand("right-half", "bottom-half") }],
      },
      {
        phase: "hold",
        do: [{ type: "url", url: urlRegistry.rectAppNextDisplay.name, background: true }],
      },
    ],
  },
];

export const buildHyperLauncherRules = () => defineBindings(hyperLauncherBindings);
