import { MOD_COMBO } from "../core/mods";
import {
  formatSelectionCommand,
  typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS } from "../data";
import {
  rectangleActionUrl,
  rectangleMaxOrRestoreCommand,
  rectangleOrientationBasedCommand,
} from "../data/rectangle";
import type { TapHoldConfig } from "../engine";
import {
  generateModifierLauncherRules,
  type ModifierLauncherMapping,
} from "../engine/launcher-rules";

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
    action: { type: "app", ref: "systemSettings" },
  },
  {
    key: "f12",
    description: "Edit last Typinator rule",
    action: { type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` },
  },
  {
    key: "escape",
    description: "Open Activity Monitor",
    action: { type: "app", ref: "activityMonitor" },
  },
];

export const hyperTapHoldMappings: Record<string, TapHoldConfig> = {
  // "vmCOCS+a": {
  //   description: "Raycast AI-chat",
  //   hold: [
  //     {
  //       type: "key",
  //       key: "f18",
  //       modifiers: MOD_COMBO.vmCOCS,
  //       options: { repeat: false },
  //     },
  //   ],
  // },
  "vmCOCS+t": {
    description: "Edit last Typinator rule",
    alone: [{ type: "shell", command: typinatorNewRuleCommand() }],
    hold: [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }],
  },
  "vmCOCS+q": {
    description: "Focus window to the left",
    alone: [
      // { type: "url", url: rectangleActionUrl("left-half"), background: true },
      {
        type: "key",
        key: "left_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
    hold: [
      // { type: "url", url: rectangleActionUrl("fill-left"), background: true },
    ],
  },
  "vmCOCS+e": {
    description: "Focus window to the right",
    alone: [
      // { type: "url", url: rectangleActionUrl("right-half"), background: true },
      {
        type: "key",
        key: "right_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
    hold: [
      // { type: "url", url: rectangleActionUrl("fill-right"), background: true },
    ],
  },
  "vmCOCS+r": {
    description: "Focus window to the top",
    alone: [
      // { type: "url", url: rectangleActionUrl("top-half"), background: true },
      {
        type: "key",
        key: "up_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
    hold: [
      // { type: "url", url: rectangleActionUrl("fill-top"), background: true },
    ],
  },
  "vmCOCS+f": {
    description: "Focus window to the bottom",
    alone: [
      // { type: "url", url: rectangleActionUrl("bottom-half"), background: true },
      {
        type: "key",
        key: "down_arrow",
        modifiers: ["left_command", "left_control", "left_option"],
        options: { repeat: false },
      },
    ],
    hold: [
      // { type: "url", url: rectangleActionUrl("fill-bottom"), background: true },
    ],
  },
  "vmCOCS+keypad_1": {
    description: "Rectangle bottom-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-left-eighth"),
        background: true,
      },
    ],
  },
  "vmCOCS+keypad_3": {
    description: "Rectangle bottom-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-right-eighth"),
        background: true,
      },
    ],
  },
  "vmCOCS+keypad_5": {
    description: "Rectangle maximize",
    alone: [
      { type: "url", url: rectangleActionUrl("maximize"), background: true },
    ],
  },
  "vmCOCS+keypad_7": {
    description: "Rectangle top-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-left-eighth"),
        background: true,
      },
    ],
  },
  "vmCOCS+keypad_9": {
    description: "Rectangle top-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-right-eighth"),
        background: true,
      },
    ],
  },
  "vmCOCS+spacebar": {
    description: "Rectangle maximize / restore",
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  },
  "vmCOCS+tab": {
    description: "Rectangle next-display / previous-display",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("next-display"),
        background: true,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("previous-display"),
        background: true,
      },
    ],
  },
  "vmCOCS+left_arrow": {
    description: "Rectangle fill-left / previous-display",
    alone: [
      {
        type: "shell",
        command: rectangleOrientationBasedCommand("left-half", "top-half"),
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("previous-display"),
        background: true,
      },
    ],
  },
  "vmCOCS+right_arrow": {
    description: "Rectangle fill-right / next-display",
    alone: [
      {
        type: "shell",
        command: rectangleOrientationBasedCommand("right-half", "bottom-half"),
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("next-display"),
        background: true,
      },
    ],
  },
};

export const buildHyperLauncherRules = () =>
  generateModifierLauncherRules({
    triggerKey: MOD_COMBO.vmCOCS,
    triggerLabel: "vmCOCS",
    launchers: hyperLauncherMappings,
  });
