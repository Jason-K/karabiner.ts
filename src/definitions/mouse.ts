import { toFromEvent } from "../core/beta";
import { appRegistry, DEVICE_IDENTIFIERS, TIMINGS } from "../data";
import {
  WIN_ACTIVATE_UNDER_CURSOR,
  mouseVars,
} from "../data/mouse";
import {
  rectangleActionUrl,
  rectangleMaxOrRestoreEvents,
  WIN_LEFT_OR_TOP,
  WIN_MAX_OR_RESTORE,
  WIN_NEXT_DISPLAY,
  WIN_RIGHT_OR_BOTTOM,
} from "../data/rectangle";
import type { Binding } from "../engine";

/**
 * G502X mouse mappings authored as plain `Binding[]` literals and consumed by
 * `defineBindings` (the same engine as keys). Device-specific button aliases
 * (shift, forward, wheelLeft, wheelRight, middleBack, leftForward, leftBack)
 * auto-scope to the G502X via the `buttons` registry `nameScope`; the global
 * buttons used here (back, wheel, right, left) carry an explicit `device`
 * condition.
 */
export const mouseBindings: Binding[] = [
  // -------------------------------------------------------------
  // SHIFT BUTTON — Mission Control (tap) / Rectangle key (hold);
  // right-button chord → down_arrow
  // -------------------------------------------------------------
  {
    trigger: { pointer: "shift" },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      // override (right button held): immediate down_arrow
      { phase: "press", conditions: [{ var: mouseVars.rightButtonPressed, equals: 1 }], do: [{ key_code: "down_arrow", modifiers: ["control"], repeat: false }] },
      { phase: "release", do: [{ key_code: "up_arrow", modifiers: ["control"] }] },
      {
        phase: "hold",
        do: [
          WIN_ACTIVATE_UNDER_CURSOR,
          { key_code: "left_control", modifiers: ["option", "shift"] },
        ],
      },
    ],
  },
  // -------------------------------------------------------------
  // WHEEL LEFT — Move window left/up (hold) / Change workspace (hold in Zen)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "wheelLeft" },
    timing: { aloneMs: TIMINGS.timeoutWheelChordMs, heldThresholdMs: TIMINGS.timeoutWheelChordMs },
    cases: [
      // overrides declared in REVERSE of the bespoke prepend order so the
      // emitted manipulator order matches (groupByConditions is first-seen).
      // Zen + right-button + wheel-up → prev workspace
      {
        phase: "press",
        conditions: [
          { app: appRegistry.zen },
          { var: mouseVars.rightButtonPressed, equals: 1 },
          { var: mouseVars.wheelDown, equals: 0 },
        ],
        do: [{ key_code: "left_arrow", modifiers: ["command", "control", "shift"], repeat: false }],
      },
      // wheel held down → swallow (the wheel-as-button mapping handles it)
      { phase: "press", conditions: [{ var: mouseVars.wheelDown, equals: 1 }], do: [] },
      // base hold — wheel guards on the base only (matches bespoke injection)
      {
        phase: "hold",
        conditions: [
          { var: mouseVars.wheelDown, equals: 1, unless: true },
          { var: mouseVars.rightButtonPressed, equals: 1, unless: true },
        ],
        do: [...WIN_LEFT_OR_TOP],
      },
    ],
  },
  // -------------------------------------------------------------
  // WHEEL RIGHT — Move window right/down (hold) / Change workspace (hold in Zen)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "wheelRight" },
    timing: { aloneMs: TIMINGS.timeoutWheelChordMs, heldThresholdMs: TIMINGS.timeoutWheelChordMs },
    cases: [
      {
        phase: "press",
        conditions: [
          { app: appRegistry.zen },
          { var: mouseVars.rightButtonPressed, equals: 1 },
          { var: mouseVars.wheelDown, equals: 0 },
        ],
        do: [{ key_code: "right_arrow", modifiers: ["command", "control", "shift"], repeat: false }],
      },
      {
        phase: "hold",
        conditions: [
          { var: mouseVars.wheelDown, equals: 1, unless: true },
          { var: mouseVars.rightButtonPressed, equals: 1, unless: true },
        ],
        do: [...WIN_RIGHT_OR_BOTTOM],
      },
    ],
  },
  // -------------------------------------------------------------
  // WHEEL (AS BUTTON) — Fill screen (hold) / Open link in glance (rbutton+wheel in Zen)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "wheel" },
    conditions: [{ device: DEVICE_IDENTIFIERS.logitechG502X }],
    whileHoldVar: mouseVars.wheelDown,
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      {
        phase: "press",
        conditions: [{ app: appRegistry.zen }, { var: mouseVars.rightButtonPressed, equals: 1 }],
        do: [{ pointing_button: "button1", modifiers: ["option"], repeat: false }],
      },
      { phase: "release", do: [{ pointing_button: "button3", repeat: false }] },
      { phase: "hold", do: [WIN_ACTIVATE_UNDER_CURSOR, ...rectangleMaxOrRestoreEvents()] },
    ],
  },
  // -------------------------------------------------------------
  // G7 (left_back) — Fill screen (tap) / Move window to next display (hold)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "leftBack" },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      { phase: "release", do: rectangleMaxOrRestoreEvents() },
      {
        phase: "hold",
        do: [
          WIN_ACTIVATE_UNDER_CURSOR,
          { shell_command: `open -g '${rectangleActionUrl("next-display")}'` },
        ],
      },
    ],
  },
  // -------------------------------------------------------------
  // G8 (left_forward) — Activate Popclip (tap) / Activate Sidenote (hold)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "leftForward" },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      { phase: "release", do: [{ shell_command: "osascript -e 'tell application \"Popclip\" to appear'" }] },
      { phase: "hold", do: [{ key_code: "f10", modifiers: ["command", "option", "shift"], repeat: false }] },
    ],
  },
  // -------------------------------------------------------------
  // G9 (middle_back) — Screenshot to text (tap) / markdown (hold)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "middleBack" },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      { phase: "release", do: [{ shell_command: "open 'cleanshot://capture-text?linebreaks=false'" }] },
      {
        phase: "hold",
        do: [
          {
            shell_command:
              "/Users/jason/Scripts/.venv/shared_venv/bin/python3 /Users/jason/Scripts/ui/screenshot_to_md/shot_to_md.py",
          },
        ],
      },
    ],
  },
  // -------------------------------------------------------------
  // BACK — Back (tap) / Window switch (hold); Zen+rbutton → next tab
  // -------------------------------------------------------------
  {
    trigger: { pointer: "back" },
    conditions: [{ device: DEVICE_IDENTIFIERS.logitechG502X }],
    eventOptions: { halt: true, repeat: false },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      {
        phase: "press",
        conditions: [{ app: appRegistry.zen }, { var: mouseVars.rightButtonPressed, equals: 1 }],
        do: [{ key_code: "close_bracket", modifiers: ["command", "shift"], repeat: true }],
      },
      { phase: "release", do: [{ pointing_button: "button4", repeat: false }] },
      { phase: "hold", do: [{ key_code: "tab", modifiers: ["command"] }] },
    ],
  },
  // -------------------------------------------------------------
  // FORWARD — Show windows of active app (hold) / Cycle tabs (rbutton+forward in Zen)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "forward" },
    eventOptions: { halt: true, repeat: false },
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      {
        phase: "press",
        conditions: [{ app: appRegistry.zen }, { var: mouseVars.rightButtonPressed, equals: 1 }],
        do: [{ key_code: "open_bracket", modifiers: ["command", "shift"], repeat: true }],
      },
      { phase: "release", do: [{ pointing_button: "button5", repeat: false }] },
      { phase: "hold", do: [{ key_code: "down_arrow", modifiers: ["control"], repeat: false }] },
    ],
  },
  // -------------------------------------------------------------
  // RIGHT — Right click (tap) / Zen chord modifier (hold).
  // whileHoldVar signals right_button_pressed; suppressCancelFallback drops
  // the stray click on a canceled hold.
  // -------------------------------------------------------------
  {
    trigger: { pointer: "right" },
    conditions: [{ device: DEVICE_IDENTIFIERS.logitechG502X }],
    whileHoldVar: mouseVars.rightButtonPressed,
    suppressCancelFallback: true,
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      { phase: "release", do: [{ pointing_button: "button2", repeat: false }] },
      { phase: "hold", do: [] },
    ],
  },
  // -------------------------------------------------------------
  // LEFT BUTTON (right-button held) — single action by app (tap) / double tap
  // → next display. Zen vs non-Zen split into condition-groups; the single tap
  // is DELAYED (fires via to_if_invoked after the timer) so a true double-tap
  // can still win. firstTapPendingVar is shared across both groups.
  // -------------------------------------------------------------
  {
    trigger: { pointer: "left" },
    conditions: [
      { device: DEVICE_IDENTIFIERS.logitechG502X },
      { var: mouseVars.rightButtonPressed, equals: 1 },
    ],
    multiTap: { firstTapPendingVar: mouseVars.leftWithRightFirstTap },
    timing: { aloneMs: TIMINGS.timeoutDoubleClickMs },
    cases: [
      // Zen — tap = cmd+click (delayed), hold = option+click, double = next display
      { tapCount: 1, phase: "release", delayed: true, conditions: [{ app: appRegistry.zen }], do: [{ pointing_button: "button1", modifiers: ["command"], repeat: false }] },
      { tapCount: 1, phase: "hold", conditions: [{ app: appRegistry.zen }], do: [{ pointing_button: "button1", modifiers: ["option"], repeat: false }] },
      { tapCount: 2, phase: "release", conditions: [{ app: appRegistry.zen }], do: [...WIN_NEXT_DISPLAY] },
      // Non-Zen — tap = maximize (delayed), double = next display
      { tapCount: 1, phase: "release", delayed: true, conditions: [{ app: appRegistry.zen, unless: true }], do: [...WIN_MAX_OR_RESTORE] },
      { tapCount: 2, phase: "release", conditions: [{ app: appRegistry.zen, unless: true }], do: [...WIN_NEXT_DISPLAY] },
    ],
  },
  // -------------------------------------------------------------
  // LEFT BUTTON (right-button NOT held) — Left click (tap) / chord modifier (hold)
  // -------------------------------------------------------------
  {
    trigger: { pointer: "left" },
    conditions: [
      { device: DEVICE_IDENTIFIERS.logitechG502X },
      { var: mouseVars.rightButtonPressed, equals: 1, unless: true },
    ],
    whileHoldVar: mouseVars.leftButtonPressed,
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: 0 },
    cases: [
      { phase: "release", do: [] },
      { phase: "hold", do: [toFromEvent()] },
    ],
  },
];
