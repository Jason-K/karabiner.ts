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
import {
  generateModifierLauncherRules,
  type ModifierLauncherMapping,
} from "../engine/launcher-rules";
import { tapHoldBinding, type Binding } from "../engine";

export const hyperLauncherMappings: ModifierLauncherMapping[] = [
  {
    key: "s",
    description: "Format selection",
    action: { type: "shell", command: formatSelectionCommand() },
  },
  {
    key: "t",
    description: "New Typinator rule",
    action: { type: "shell", command: typinatorNewRuleCommand() },
  },
  {
    key: "comma",
    description: "Open System Settings",
    action: { type: "app", ref: appRegistry.systemSettings },
  },
  {
    key: "f12",
    description: "Edit last Typinator rule",
    action: { type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` },
  },
  {
    key: "escape",
    description: "Open Activity Monitor",
    action: { type: "app", ref: appRegistry.activityMonitor },
  },
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
    alone: [{ type: "url", url: rectangleActionUrl("bottom-left-eighth"), background: true }],
  }),
  tapHoldBinding("keypad_3", ["vmCOCS"], {
    alone: [{ type: "url", url: rectangleActionUrl("bottom-right-eighth"), background: true }],
  }),
  tapHoldBinding("keypad_5", ["vmCOCS"], {
    alone: [{ type: "url", url: rectangleActionUrl("maximize"), background: true }],
  }),
  tapHoldBinding("keypad_7", ["vmCOCS"], {
    alone: [{ type: "url", url: rectangleActionUrl("top-left-eighth"), background: true }],
  }),
  tapHoldBinding("keypad_9", ["vmCOCS"], {
    alone: [{ type: "url", url: rectangleActionUrl("top-right-eighth"), background: true }],
  }),
  tapHoldBinding("spacebar", ["vmCOCS"], {
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  }),
  tapHoldBinding("tab", ["vmCOCS"], {
    alone: [{ type: "url", url: rectangleActionUrl("next-display"), background: true }],
    hold: [{ type: "url", url: rectangleActionUrl("previous-display"), background: true }],
  }),
  tapHoldBinding("left_arrow", ["vmCOCS"], {
    alone: [{ type: "shell", command: rectangleOrientationBasedCommand("left-half", "top-half") }],
    hold: [{ type: "url", url: rectangleActionUrl("previous-display"), background: true }],
  }),
  tapHoldBinding("right_arrow", ["vmCOCS"], {
    alone: [{ type: "shell", command: rectangleOrientationBasedCommand("right-half", "bottom-half") }],
    hold: [{ type: "url", url: rectangleActionUrl("next-display"), background: true }],
  }),
];

export const buildHyperLauncherRules = () =>
  generateModifierLauncherRules({
    triggerKey: MOD_COMBO.vmCOCS,
    triggerLabel: "vmCOCS",
    launchers: hyperLauncherMappings,
  });
