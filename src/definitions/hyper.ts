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
    action: { type: "shell", command: "open -a '/System/Applications/System Settings.app'" },
  },
  {
    key: "f12",
    description: "Edit last Typinator rule",
    action: { type: "shell", command: `/usr/bin/osascript ${PATHS.typinatorEditLastAppleScript}` },
  },
  {
    key: "escape",
    description: "Open Activity Monitor",
    action: { type: "shell", command: "open -a 'Activity Monitor'" },
  },
];

export const hyperTapHoldMappings: Record<string, TapHoldConfig> = {
  "hyper+a": {
    description: "Raycast AI-chat",
    hold: [
      {
        type: "key",
        key: "f18",
        modifiers: ["command", "option", "control", "shift"],
        options: { repeat: false },
      },
    ],
  },
  "hyper+q": {
    description: "Rectangle Pro left",
    alone: [
      { type: "url", url: rectangleActionUrl("left-half"), background: true },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("fill-left"), background: true },
    ],
  },
  "hyper+w": {
    description: "Rectangle Pro right",
    alone: [
      { type: "url", url: rectangleActionUrl("right-half"), background: true },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("fill-right"), background: true },
    ],
  },
  "hyper+1": {
    description: "Rectangle left-half/top-half by orientation",
    alone: [{ type: "shell", command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION }],
  },
  "hyper+2": {
    description: "Rectangle right-half/bottom-half by orientation",
    alone: [
      { type: "shell", command: RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION },
    ],
  },
  "hyper+3": {
    description: "Rectangle first-third",
    alone: [
      { type: "url", url: rectangleActionUrl("first-third"), background: true },
    ],
  },
  "hyper+4": {
    description: "Rectangle first-fourth",
    alone: [
      { type: "url", url: rectangleActionUrl("first-fourth"), background: true },
    ],
  },
  "hyper+keypad_1": {
    description: "Rectangle bottom-left-eighth",
    alone: [
      { type: "url", url: rectangleActionUrl("bottom-left-eighth"), background: true },
    ],
  },
  "hyper+keypad_3": {
    description: "Rectangle bottom-right-eighth",
    alone: [
      { type: "url", url: rectangleActionUrl("bottom-right-eighth"), background: true },
    ],
  },
  "hyper+keypad_5": {
    description: "Rectangle maximize",
    alone: [
      { type: "url", url: rectangleActionUrl("maximize"), background: true },
    ],
  },
  "hyper+keypad_7": {
    description: "Rectangle top-left-eighth",
    alone: [
      { type: "url", url: rectangleActionUrl("top-left-eighth"), background: true },
    ],
  },
  "hyper+keypad_9": {
    description: "Rectangle top-right-eighth",
    alone: [
      { type: "url", url: rectangleActionUrl("top-right-eighth"), background: true },
    ],
  },
  "hyper+spacebar": {
    description: "Rectangle maximize / restore",
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  },
  "hyper+tab": {
    description: "Rectangle next-display / previous-display",
    alone: [
      { type: "url", url: rectangleActionUrl("next-display"), background: true },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("previous-display"), background: true },
    ],
  },
  "hyper+left_arrow": {
    description: "Rectangle fill-left / previous-display",
    alone: [
      { type: "shell", command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("previous-display"), background: true },
    ],
  },
  "hyper+right_arrow": {
    description: "Rectangle fill-right / next-display",
    alone: [
      { type: "shell", command: RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION },
    ],
    hold: [
      { type: "url", url: rectangleActionUrl("next-display"), background: true },
    ],
  },
};

export const buildHyperLauncherRules = () =>
  generateModifierLauncherRules({
    triggerKey: HYPER,
    triggerLabel: "hyper",
    launchers: hyperLauncherMappings,
  });
