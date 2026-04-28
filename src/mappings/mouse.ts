import type { PointingButton, ToEvent } from "karabiner.ts";
import { g502xButtons } from "../lib/mouse";

export type MouseIdentifiers = {
  product_id: number;
  vendor_id: number;
};

export type MouseTapHoldMapping = {
  type: "tapHold";
  button: string;
  description: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  thresholdMs?: number;
  timeoutMs?: number;
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

export type MouseMapping = MouseTapHoldMapping | MouseDoubleTapMapping;

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
        description: "ctrl+up (tap) / ctrl+opt+shift down (hold)",
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
        description: "Rectangle fill-left (tap) / prev-display (hold)",
        alone: [{ shell_command: "open 'rectangle-pro://execute-action?name=fill-left'" }],
        hold: [{ shell_command: "open 'rectangle-pro://execute-action?name=previous-display'" }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "wheel_right",
        description: "Rectangle fill-right (tap) / next-display (hold)",
        alone: [{ shell_command: "open 'rectangle-pro://execute-action?name=fill-right'" }],
        hold: [{ shell_command: "open 'rectangle-pro://execute-action?name=next-display'" }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "middle_back",
        description: "CleanShot OCR (tap) / area capture (hold)",
        alone: [{ shell_command: "open 'cleanshot://capture-text?linebreaks=false'" }],
        hold: [{ shell_command: "open 'cleanshot://capture-area'" }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "middle_front",
        description: "Middle (tap) / Rectangle maximize (hold)",
        alone: [{ pointing_button: "button3" }],
        hold: [{ shell_command: "open 'rectangle-pro://execute-action?name=maximize'" }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "back",
        description: "Back (tap) / Last application (hold)",
        alone: [{ pointing_button: "button4" }],
        hold: [{ key_code: "tab", modifiers: ["left_command"] }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "left_back",
        description: "Rectangle maximize (tap) / show minimized (hold)",
        alone: [{ shell_command: "open 'rectangle-pro://execute-action?name=maximize'" }],
        hold: [{ key_code: "m", modifiers: ["left_control", "left_option"] }],
        thresholdMs: 300,
        timeoutMs: 300,
      },
      {
        type: "tapHold",
        button: "left_forward",
        description: "Show menu (tap) / Here2There active-to-target (hold)",
        alone: [{ key_code: "m", modifiers: ["left_option"] }],
        hold: [
          {
            shell_command: "open 'raycast://extensions/Jason/here-to-there/activeToTarget'",
          },
        ],
        thresholdMs: 250,
        timeoutMs: 250,
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
