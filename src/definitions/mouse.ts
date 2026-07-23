import { toFromEvent } from "../core/beta";
import { g502xButtons } from "../core/mouse";
import { appRegistry, DEVICE_IDENTIFIERS, karabinerDeviceId, TIMINGS } from "../data";
import {
  WIN_ACTIVATE_UNDER_CURSOR,
  type MouseDeviceConfig,
} from "../data/mouse";
import {
  rectangleActionUrl,
  rectangleMaxOrRestoreEvents,
  WIN_LEFT_OR_TOP,
  WIN_MAX_OR_RESTORE,
  WIN_NEXT_DISPLAY,
  WIN_RIGHT_OR_BOTTOM,
} from "../data/rectangle";

export { buildMouseDeviceRules, buildMouseRules } from "../engine/mouse-rules";

export const mouseDeviceMappings: MouseDeviceConfig[] = [
  {
    key: "logitech_g502_x",
    name: "Logitech G502 X",
    identifiers: karabinerDeviceId(DEVICE_IDENTIFIERS.logitechG502X),
    buttonMap: g502xButtons,
    mappings: [
      // -------------------------------------------------------------
      // SHIFT BUTTON
      // -------------------------------------------------------------
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
          // OPTION 1: activate BetterStage radial menu
          // { pointing_button: "button3", modifiers: ["left_option"], repeat: false, },
          // OPTION 2: activate Rectangle Pro free movement
          WIN_ACTIVATE_UNDER_CURSOR,
          {
            key_code: "left_control",
            modifiers: ["left_option", "left_shift"],
          },
        ],
        overrides: [
          {
            when: [{ variable: "right_button_pressed", match: "if", value: 1 }],
            to: [
              {
                key_code: "down_arrow",
                modifiers: ["left_control"],
                repeat: false,
              },
            ],
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      // -------------------------------------------------------------
      // WHEEL LEFT BUTTON
      // -------------------------------------------------------------
      {
        type: "tapHold",
        button: "wheel_left",
        description:
          "[WHEEL LEFT] Move window left/up (hold) / Change workspace (hold in Zen)",
        hold: [...WIN_LEFT_OR_TOP],
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
      // -------------------------------------------------------------
      // WHEEL RIGHT BUTTON
      // -------------------------------------------------------------
      {
        type: "tapHold",
        button: "wheel_right",
        description:
          "[WHEEL RIGHT] Move window right/down (hold) / Change workspace (hold in Zen)",
        hold: [...WIN_RIGHT_OR_BOTTOM],
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
      // -------------------------------------------------------------
      // WHEEL (AS BUTTON)
      // -------------------------------------------------------------
      {
        type: "tapHold",
        button: "wheel",
        description:
          "[WHEEL] Fill screen with window (hold) / Open link in glance (rbutton+wheel in Zen)",
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
        hold: [WIN_ACTIVATE_UNDER_CURSOR, ...rectangleMaxOrRestoreEvents()],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      {
        type: "tapHold",
        button: "left_back",
        description:
          "[G7] Fill screen with window (tap) / Move window to next display (hold)",
        alone: rectangleMaxOrRestoreEvents(),
        hold: [
          WIN_ACTIVATE_UNDER_CURSOR,
          {
            shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
          },
        ],
        thresholdMs: TIMINGS.delayMouseHoldMs,
        timeoutMs: TIMINGS.delayMouseHoldMs,
      },
      // -------------------------------------------------------------
      // G8 BUTTON
      // -------------------------------------------------------------
      {
        type: "tapHold",
        button: "left_forward",
        description: "[G8] Activate Popclip (tap) / Activate Sidenote (hold)",
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
      // -------------------------------------------------------------
      // G9 BUTTON
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // BACK BUTTON
      // -------------------------------------------------------------
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
      // -------------------------------------------------------------
      // FORWARD BUTTON
      // -------------------------------------------------------------
      {
        type: "tapHold",
        button: "forward",
        description:
          "[FORWARD] Show windows of active app (hold) / Cycle tabs (rbutton+forward in Zen)",
        alone: [{ pointing_button: "button5", repeat: false }],
        hold: [
          {
            key_code: "down_arrow",
            modifiers: ["left_control"],
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
      // -------------------------------------------------------------
      // RIGHT BUTTON
      // -------------------------------------------------------------
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
      // -------------------------------------------------------------
      // LEFT BUTTON
      // -------------------------------------------------------------
      {
        type: "doubleTap",
        button: "left",
        description:
          "[RBUTTON+LBUTTON] single action by app / double next display",
        // Var to set on first tap
        firstTapPendingVar: "left_with_right_first_tap",
        // Optional condition, which limits when double tap events will fire.
        when: [{ variable: "right_button_pressed", match: "if", value: 1 }],
        // NOTE: the event to fire on first tap is handled in overrides in this case
        // Events to fire on double tap. This is the "double tap" action.
        doubleTapEvents: WIN_NEXT_DISPLAY,
        thresholdMs: TIMINGS.timeoutDoubleClickMs,
        overrides: [
          {
            // ZEN OVERRIDES
            // -------------------------------------------------------------
            when: [{ app: appRegistry.zen }],
            // ZEN - Rbutton + Lbutton (hold) = option+click (preview open link)
            holdEvents: [
              {
                pointing_button: "button1",
                modifiers: ["left_option"],
                repeat: false,
              },
            ],
            // ZEN - Rbutton + Lbutton (tap) = cmd+click (open link in new tab)
            delayedSingleTapEvents: [
              {
                pointing_button: "button1",
                modifiers: ["left_command"],
                repeat: false,
              },
            ],
          },
          {
            // NON-ZEN OVERRIDES
            // -------------------------------------------------------------
            when: [{ app: appRegistry.zen, unless: true }],
            // Rbutton + Lbutton (hold) = maximize window under cursor
            delayedSingleTapEvents: WIN_MAX_OR_RESTORE,
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
