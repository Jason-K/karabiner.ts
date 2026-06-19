import { g502xButtons } from "../core/mouse";
import { DEVICE_IDENTIFIERS, TIMINGS } from "../data";
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

const RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("left-half", "top-half");

const RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("right-half", "bottom-half");

const RECTANGLE_FILL_LEFT_OR_TOP_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-left", "top-half");

const RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-right", "bottom-half");

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
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            key_code: "left_control",
            modifiers: ["left_option", "left_shift"],
          },
        ],
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
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
        thresholdMs: TIMINGS.mouseWheelChordMs,
        timeoutMs: TIMINGS.mouseWheelChordMs,
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
        thresholdMs: TIMINGS.mouseWheelChordMs,
        timeoutMs: TIMINGS.mouseWheelChordMs,
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
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
      {
        type: "tapHold",
        button: "middle_front",
        description: "[WHEEL] Middle (tap) / Rectangle maximize (hold)",
        variable: "middle_front_pressed",
        alone: [{ pointing_button: "button3" }],
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          ...rectangleMaxOrRestoreEvents(),
        ],
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
      {
        type: "tapHold",
        button: "left_back",
        description: "[G7] Rectangle Max/Restore (tap) / Next Display (hold)",
        alone: rectangleMaxOrRestoreEvents(),
        hold: [
          ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
          {
            shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
          },
        ],
        thresholdMs: TIMINGS.mouseDisplaySwitchMs,
        timeoutMs: TIMINGS.mouseDisplaySwitchMs,
      },
      {
        type: "tapHold",
        button: "left_forward",
        description: "[G8] Activate Popclip (tap) / Sidenote (hold)",
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
          },
        ],
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
      {
        type: "tapHold",
        button: "back",
        description: "[BACK] Back (tap) / Window switch (hold)",
        alone: [{ pointing_button: "button4" }],
        hold: [{ key_code: "tab", modifiers: ["left_command"] }],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
      {
        type: "tapHold",
        button: "forward",
        description: "[FORWARD] Forward (tap) / App window switch (hold)",
        alone: [{ pointing_button: "button5" }],
        hold: [
          {
            key_code: "grave_accent_and_tilde",
            modifiers: ["left_command"],
          },
        ],
        eventOptions: { halt: true, repeat: false },
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
      {
        type: "tapHold",
        button: "right",
        description: "[RBUTTON] Right click (tap) / Zen chord modifier (hold)",
        variable: "right_button_pressed",
        alone: [{ pointing_button: "button2" }],
        hold: [],
        thresholdMs: TIMINGS.mouseDefaultMs,
        timeoutMs: TIMINGS.mouseDefaultMs,
      },
    ],
  },
];
