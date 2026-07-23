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
import { defineBindings, remap, tapHoldBinding, type Binding } from "../engine";

// Launcher triggers use MOD_COMBO.vmCOCS (the expanded modifier array) because
// buildRemap — unlike buildTapHold — does not expand alias modifiers.
export const hyperLauncherBindings: Binding[] = [
  remap("s", MOD_COMBO.vmCOCS, [
    { type: "shell", command: formatSelectionCommand() },
  ]),
  // remap("t", MOD_COMBO.vmCOCS, [{ type: "shell", command: typinatorNewRuleCommand() }]),
  remap("comma", MOD_COMBO.vmCOCS, [
    { type: "app", ref: appRegistry.systemSettings },
  ]),
  remap("f12", MOD_COMBO.vmCOCS, [
    { type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` },
  ]),
  remap("escape", MOD_COMBO.vmCOCS, [
    { type: "app", ref: appRegistry.activityMonitor },
  ]),
];

export const hyperTapHoldBindings: Binding[] = [
  tapHoldBinding("t", ["vmCOCS"], {
    alone: [{ type: "shell", command: typinatorNewRuleCommand() }],
    hold: [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }],
  }),
  tapHoldBinding("q", ["vmCOCS"], {
    alone: [
      {
        type: "key",
        key: "left_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
  }),
  tapHoldBinding("e", ["vmCOCS"], {
    alone: [
      {
        type: "key",
        key: "right_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
  }),
  tapHoldBinding("r", ["vmCOCS"], {
    alone: [
      {
        type: "key",
        key: "up_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
  }),
  tapHoldBinding("f", ["vmCOCS"], {
    alone: [
      {
        type: "key",
        key: "down_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
  }),
  tapHoldBinding("keypad_1", ["vmCOCS"], {
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-left-eighth"),
        background: true,
      },
    ],
  }),
  tapHoldBinding("keypad_3", ["vmCOCS"], {
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-right-eighth"),
        background: true,
      },
    ],
  }),
  tapHoldBinding("keypad_5", ["vmCOCS"], {
    alone: [
      { type: "url", url: urlRegistry.rectWinMaximize.name, background: true },
    ],
  }),
  tapHoldBinding("keypad_7", ["vmCOCS"], {
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-left-eighth"),
        background: true,
      },
    ],
  }),
  tapHoldBinding("keypad_9", ["vmCOCS"], {
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-right-eighth"),
        background: true,
      },
    ],
  }),
  tapHoldBinding("spacebar", ["vmCOCS"], {
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  }),
  tapHoldBinding("tab", ["vmCOCS"], {
    alone: [
      {
        type: "url",
        url: urlRegistry.rectAppNextDisplay.name,
        background: true,
      },
    ],
    hold: [
      {
        type: "url",
        url: urlRegistry.rectAppPrevDisplay.name,
        background: true,
      },
    ],
  }),
  tapHoldBinding("left_arrow", ["vmCOCS"], {
    alone: [
      {
        type: "shell",
        command: rectangleOrientationBasedCommand("left-half", "top-half"),
      },
    ],
    hold: [
      {
        type: "url",
        url: urlRegistry.rectAppPrevDisplay.name,
        background: true,
      },
    ],
  }),
  tapHoldBinding("right_arrow", ["vmCOCS"], {
    alone: [
      {
        type: "shell",
        command: rectangleOrientationBasedCommand("right-half", "bottom-half"),
      },
    ],
    hold: [
      {
        type: "url",
        url: urlRegistry.rectAppNextDisplay.name,
        background: true,
      },
    ],
  }),
];

export const buildHyperLauncherRules = () => defineBindings(hyperLauncherBindings);
