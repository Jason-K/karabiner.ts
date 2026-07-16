import { toFromEvent } from "../core/beta";
import { g502xButtons } from "../core/mouse";
import { appRegistry, DEVICE_IDENTIFIERS, TIMINGS } from "../data";
import {
  ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
  type MouseDeviceConfig,
} from "../data/mouse";
import {
  rectangleActionByFocusedWindowOrientationCommand,
  rectangleActionUrl,
  rectangleMaxOrRestoreEvents,
} from "../data/rectangle";

export { buildMouseDeviceRules, buildMouseRules } from "../engine/mouse-rules";

const RECTANGLE_FILL_LEFT_OR_TOP_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-left", "top-half");

const RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-right", "bottom-half");

const MOVE_WINDOW_TO_NEXT_DISPLAY = [
  ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
  {
    shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
  },
];

const MAXIMIZE_WINDOW_UNDER_CURSOR = [
  ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
  ...rectangleMaxOrRestoreEvents(),
];

export const mouseDeviceMappings: MouseDeviceConfig[] = [
  {
    key: "logitech_g502_x",
    name: "Logitech G502 X",
    identifiers: DEVICE_IDENTIFIERS.logitechG502X,
    buttonMap: g502xButtons,
    mappings: [
      {
        type: "tapHold",
        button: "shift",
        description: "[SHIFT] Mission Control (tap) / Rectangle key (hold)",
        alone: [
          {
            key_code: "up_arrow",
            modifiers: ["left_control"],
          },
        ],
        hold: [
          // activate BetterStage radial menu
          //   {
          //     pointing_button: "button3",
          //     modifiers: ["left_option"],
          //     repeat: false,
          //   },
          // activate Rectangle Pro free movement
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            key_code: "left_control",
            modifiers: ["left_option", "left_shift"],
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "wheel_left",
        description: "[WHEEL LEFT] Rectangle fill-left (hold)",
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            shell_command: RECTANGLE_FILL_LEFT_OR_TOP_HALF_BY_ORIENTATION,
          },
        ],
        overrides: [
          {
            when: [{ variable: "wheel_down", match: "if", value: 1 }],
            to: [],
          },
          {
            when: [
              { app: appRegistry.zen },
              { variable: "right_button_pressed", match: "if", value: 1 },
              { variable: "wheel_down", match: "if", value: 0 },
            ],
            to: [
              {
                key_code: "left_arrow",
                modifiers: ["left_command", "left_control", "left_shift"],
                repeat: false,
              },
            ],
          },
        ],
        thresholdMs: TIMINGS.timeoutWheelChordMs,
        timeoutMs: TIMINGS.timeoutWheelChordMs,
      },
      {
        type: "tapHold",
        button: "wheel_right",
        description: "[WHEEL RIGHT] Rectangle fill-right (hold)",
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            shell_command: RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION,
          },
        ],
        overrides: [
          {
            when: [
              { app: appRegistry.zen },
              { variable: "right_button_pressed", match: "if", value: 1 },
              { variable: "wheel_down", match: "if", value: 0 },
            ],
            to: [
              {
                key_code: "right_arrow",
                modifiers: ["left_command", "left_control", "left_shift"],
                repeat: false,
              },
            ],
          },
        ],
        thresholdMs: TIMINGS.timeoutWheelChordMs,
        timeoutMs: TIMINGS.timeoutWheelChordMs,
      },
      {
        type: "tapHold",
        button: "middle_back",
        description: "[G9] Screenshot to text (tap) / markdown (hold)",
        alone: [
          { shell_command: "open 'cleanshot://capture-text?linebreaks=false'" },
        ],
        hold: [
          {
            shell_command:
              "/Users/jason/Scripts/.venv/shared_venv/bin/python3 /Users/jason/Scripts/ui/screenshot_to_md/shot_to_md.py",
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "wheel",
        description: "[WHEEL] Middle (tap) / Rectangle maximize (hold)",
        variable: "wheel_down",
        alone: [{ pointing_button: "button3", repeat: false }],
        overrides: [
          {
            when: [
              { app: appRegistry.zen },
              { variable: "right_button_pressed", match: "if", value: 1 },
            ],
            to: [
              {
                pointing_button: "button1",
                modifiers: ["left_option"],
                repeat: false,
              },
            ],
          },
        ],
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          ...rectangleMaxOrRestoreEvents(),
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "left_back",
        description:
          "[G7] Maximize window (tap) / Move window to next display (hold)",
        alone: rectangleMaxOrRestoreEvents(),
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "left_forward",
        description: "[G8] Popclip (tap) / Sidenote (hold)",
        alone: [
          {
            shell_command:
              "osascript -e 'tell application \"Popclip\" to appear'",
          },
        ],
        hold: [
          {
            key_code: "f10",
            modifiers: ["left_command", "left_option", "left_shift"],
            repeat: false,
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "back",
        description: "[BACK] Back (tap) / Window switch (hold)",
        alone: [{ pointing_button: "button4", repeat: false }],
        hold: [{ key_code: "tab", modifiers: ["left_command"] }],
        overrides: [
          {
            // ZEN - Rbutton + Back = CMD+SHIFT+] (switch to next tab)
            when: [
              { app: appRegistry.zen },
              { variable: "right_button_pressed", match: "if", value: 1 },
            ],
            to: [
              {
                key_code: "close_bracket",
                modifiers: ["left_command", "left_shift"],
                repeat: true,
              },
            ],
          },
        ],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "forward",
        description: "[FORWARD] Forward (tap) / App window switch (hold)",
        alone: [{ pointing_button: "button5", repeat: false }],
        hold: [
          {
            key_code: "grave_accent_and_tilde",
            modifiers: ["left_command"],
            repeat: false,
          },
        ],
        overrides: [
          {
            // ZEN - Rbutton + Forward = CMD+SHIFT+[ (switch to previous tab)
            when: [
              { app: appRegistry.zen },
              { variable: "right_button_pressed", match: "if", value: 1 },
            ],
            to: [
              {
                key_code: "open_bracket",
                modifiers: ["left_command", "left_shift"],
                repeat: true,
              },
            ],
          },
        ],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "right",
        description: "[RBUTTON] Right click (tap) / Zen chord modifier (hold)",
        variable: "right_button_pressed",
        alone: [{ pointing_button: "button2", repeat: false }],
        hold: [],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "doubleTap",
        button: "left",
        description:
          "[RBUTTON+LBUTTON] single action by app / double next display",
        firstVar: "left_with_right_first_tap",
        when: [{ variable: "right_button_pressed", match: "if", value: 1 }],
        tapTapEvents: MOVE_WINDOW_TO_NEXT_DISPLAY,
        thresholdMs: TIMINGS.timeoutDoubleClickMs,
        overrides: [
          {
            when: [{ app: appRegistry.zen }],
            deferredAloneEvents: [
              {
                pointing_button: "button1",
                modifiers: ["left_option"],
                repeat: false,
              },
            ],
          },
          {
            when: [{ app: appRegistry.zen, unless: true }],
            deferredAloneEvents: MAXIMIZE_WINDOW_UNDER_CURSOR,
          },
        ],
      },
      {
        type: "tapHold",
        button: "left",
        description: "[LBUTTON] Left click (tap) / Zen chord modifier (hold)",
        when: [{ variable: "right_button_pressed", match: "unless", value: 1 }],
        variable: "left_button_pressed",
        alone: [],
        hold: [toFromEvent()],
        thresholdMs: 0,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
    ],
  },
];
