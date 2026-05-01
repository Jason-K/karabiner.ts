import type { PointingButton, ToEvent } from "karabiner.ts";
import { g502xButtons } from "../lib/mouse";
import {
  rectangleActionByFocusedWindowOrientationCommand,
  rectangleActionUrl,
  rectangleMaxOrRestoreEvents,
} from "./rectangle";

const RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("left-half", "top-half");

const RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("right-half", "bottom-half");

const RECTANGLE_FILL_LEFT_OR_TOP_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-left", "top-half");

const RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-right", "bottom-half");

export type MouseIdentifiers = {
  product_id: number;
  vendor_id: number;
};

export type MouseTapHoldMapping = {
  type: "tapHold";
  button: string;
  description: string;
  variable?: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  eventOptions?: {
    halt?: boolean;
    repeat?: boolean;
  };
  thresholdMs?: number;
  timeoutMs?: number;
};

export type MouseSimultaneousMapping = {
  type: "simultaneous";
  buttons: string[];
  description: string;
  to: ToEvent[];
  thresholdMs?: number;
};

export type MouseDoubleTapMapping = {
  type: "doubleTap";
  button: string;
  description: string;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  allowPassThrough?: boolean;
  thresholdMs?: number;
};

export type MouseMapping =
  | MouseTapHoldMapping
  | MouseDoubleTapMapping
  | MouseSimultaneousMapping;

export type MouseDeviceConfig = {
  buttonMap: Record<string, PointingButton>;
  identifiers: MouseIdentifiers;
  key: string;
  mappings: MouseMapping[];
  name: string;
};

export const mouseDeviceMappings: MouseDeviceConfig[] = [
  {
    key: "logitech_g502_x",
    name: "Logitech G502 X",
    identifiers: {
      product_id: 49305,
      vendor_id: 1133,
    },
    buttonMap: g502xButtons,
    mappings: [
      {
        type: "tapHold",
        button: "shift",
        description: "Mission Control (tap) / Rectangle snap (hold)",
        alone: [
          {
            key_code: "up_arrow",
            modifiers: ["left_control"],
          },
        ],
        hold: [
          {
            key_code: "left_control",
            modifiers: ["left_option", "left_shift"],
          },
        ],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "wheel_left",
        description: "Rectangle fill-left (hold)",
        hold: [
          {
            shell_command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION,
          },
        ],
        thresholdMs: 140,
        timeoutMs: 140,
      },
      {
        type: "tapHold",
        button: "wheel_right",
        description: "Rectangle fill-right (hold)",
        hold: [
          {
            shell_command: RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION,
          },
        ],
        thresholdMs: 140,
        timeoutMs: 140,
      },
      {
        type: "tapHold",
        button: "middle_back",
        description: "CleanShot OCR (tap) / area capture (hold)",
        alone: [
          { shell_command: "open 'cleanshot://capture-text?linebreaks=false'" },
        ],
        hold: [{ shell_command: "open 'cleanshot://capture-area'" }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "middle_front",
        description: "Middle (tap) / Rectangle maximize (hold)",
        variable: "middle_front_pressed",
        alone: [{ pointing_button: "button3" }],
        hold: rectangleMaxOrRestoreEvents(),
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "left_back",
        description: "Rectangle Max/Restore (tap) / Next Display (hold)",
        alone: rectangleMaxOrRestoreEvents(),
        hold: [
          {
            shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
          },
        ],
        thresholdMs: 400,
        timeoutMs: 400,
      },
      {
        type: "tapHold",
        button: "left_forward",
        description: "Show menu (tap) / move (hold)",
        alone: [{ key_code: "m", modifiers: ["left_option"] }],
        hold: [
          {
            key_code: "left_command",
            modifiers: ["left_option", "left_shift"],
          },
        ],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "back",
        description: "Back (tap) / CMD+Tab (hold)",
        alone: [{ pointing_button: "button4" }],
        hold: [{ key_code: "tab", modifiers: ["left_command"] }],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "forward",
        description: "Forward (tap) / CMD+Tab (hold)",
        alone: [{ pointing_button: "button5" }],
        hold: [
          {
            key_code: "grave_accent_and_tilde",
            modifiers: ["left_command"],
          },
        ],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: 300,
        timeoutMs: 300,
      },
    ],
  },
];

/**
 * Scroll-wheel chord requests tracked for follow-up implementation.
 *
 * Karabiner basic `from` events support key_code/consumer_key_code/pointing_button,
 * but not wheel up/down as direct `from` event sources, so these cannot currently be
 * represented in this declarative mapping pipeline without an external scroll event source.
 *
 * NOTE - see ~/.config/hammerspoon/modules/scroll_chords.lua for reference on how these have been implemented in the meantime.
 */
export const mouseScrollChordRequests = [
  "forward+scroll_up -> volume_increment",
  "forward+scroll_down -> volume_decrement",
  "back+scroll_down -> left_control+tab",
  "back+scroll_up -> left_control+left_shift+tab",
  "right+scroll_down -> left_command+tab",
  "right+scroll_up -> left_command+left_shift+tab",
] as const;
