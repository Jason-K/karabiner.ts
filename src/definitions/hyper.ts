import { HYPER } from "../core/mods";
import {
    formatSelectionCommand,
    typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS } from "../data";
import {
    rectangleActionByFocusedWindowOrientationCommand,
    rectangleActionUrl,
    rectangleMaxOrRestoreCommand,
} from "../data/rectangle";
import type { TapHoldConfig } from "../engine";
import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";

const RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("left-half", "top-half");

const RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("right-half", "bottom-half");

const RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-right", "bottom-half");

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
    key: "semicolon",
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
  "vmCOC_+a": {
    description: "Raycast AI-chat",
    hold: [
      {
        type: "key",
        key: "f18",
        modifiers: ["vmCOCS"],
        options: { repeat: false },
      },
    ],
  },
  "vmCOC_+t": {
    description: "Edit last Typinator rule",
    alone: [{ type: "shell", command: typinatorNewRuleCommand() }],
    hold: [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }],
  },
  "vmCOC_+q": {
    description: "Rectangle Pro left",
    alone: [
      { type: "url", url: rectangleActionUrl("left-half"), background: true },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("fill-left"), background: true },
    ],
  },
  "vmCOC_+w": {
    description: "Rectangle Pro right",
    alone: [
      { type: "url", url: rectangleActionUrl("right-half"), background: true },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("fill-right"), background: true },
    ],
  },
  "vmCOC_+1": {
    description: "Rectangle left-half/top-half by orientation",
    alone: [{ type: "shell", command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION }],
  },
  "vmCOC_+2": {
    description: "Rectangle right-half/bottom-half by orientation",
    alone: [
      { type: "shell", command: RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION },
    ],
  },
  "vmCOC_+3": {
    description: "Rectangle first-third",
    alone: [
      { type: "url", url: rectangleActionUrl("first-third"), background: true },
    ],
  },
  "vmCOC_+4": {
    description: "Rectangle first-fourth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("first-fourth"),
        background: true,
      },
    ],
  },
  "vmCOC_+keypad_1": {
    description: "Rectangle bottom-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-left-eighth"),
        background: true,
      },
    ],
  },
  "vmCOC_+keypad_3": {
    description: "Rectangle bottom-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-right-eighth"),
        background: true,
      },
    ],
  },
  "vmCOC_+keypad_5": {
    description: "Rectangle maximize",
    alone: [
      { type: "url", url: rectangleActionUrl("maximize"), background: true },
    ],
  },
  "vmCOC_+keypad_7": {
    description: "Rectangle top-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-left-eighth"),
        background: true,
      },
    ],
  },
  "vmCOC_+keypad_9": {
    description: "Rectangle top-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-right-eighth"),
        background: true,
      },
    ],
  },
  "vmCOC_+spacebar": {
    description: "Rectangle maximize / restore",
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  },
  "vmCOC_+tab": {
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
  "vmCOC_+left_arrow": {
    description: "Rectangle fill-left / previous-display",
    alone: [{ type: "shell", command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION }],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("previous-display"),
        background: true,
      },
    ],
  },
  "vmCOC_+right_arrow": {
    description: "Rectangle fill-right / next-display",
    alone: [
      {
        type: "shell",
        command: RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION,
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
    triggerKey: HYPER,
    triggerLabel: "vmCOC_",
    launchers: hyperLauncherMappings,
  });
