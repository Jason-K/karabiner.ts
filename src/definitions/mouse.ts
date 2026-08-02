import { toTrigger } from "../engine/resolve-to-action";
import { APP_ID, CMDS, COMBOS, DEVICES, TIMINGS, URLS, VM } from "../data";
import { mouseVars } from "../data";
import {
  bind,
  condApp,
  condDevice,
  condNotVar,
  condVar,
  from,
  ifVar,
  hold,
  key,
  map,
  openUrl,
  options,
  press,
  release,
  shell,
  timing,
  to,
  when,
  type Binding,
} from "../engine";

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
  bind(
    from("shift_button"),
    to(
      // override (right button held): immediate down_arrow
      press(map(COMBOS.showMissionControl)).when(ifVar(mouseVars.rightButtonPressed, 1)),
      release(key("up_arrow", ["control"])),
      hold([
        { pointing_button: "button1" },
        key("left_control", ["option", "shift"]),
      ]),
    ),
  ),
  // -------------------------------------------------------------
  // WHEEL LEFT — Move window left/up (hold) / Change workspace (hold in Zen)
  // -------------------------------------------------------------
  bind(
    from("wheelLeft"),
    to(
      // overrides declared in REVERSE of the bespoke prepend order so the
      // emitted manipulator order matches (groupByConditions is first-seen).
      // Zen + right-button + wheel-up → prev workspace
      press(key("left_arrow", VM.C_CS)).when(
        condApp(APP_ID.zen),
        condVar(mouseVars.rightButtonPressed, 1),
        condVar(mouseVars.wheelDown, 0),
      ),
      // wheel held down → swallow (the wheel-as-button mapping handles it)
      press([]).when(condVar(mouseVars.wheelDown, 1)),
      // base hold — wheel guards on the base only (matches bespoke injection)
      hold(shell(CMDS.winLeftOrTop)).when(
        condNotVar(mouseVars.wheelDown, 1),
        condNotVar(mouseVars.rightButtonPressed, 1),
      ),
    ),
    timing({
      aloneMs: TIMINGS.timeoutWheelChordMs,
      holdMs: TIMINGS.timeoutWheelChordMs,
    }),
  ),
  // -------------------------------------------------------------
  // WHEEL RIGHT — Move window right/down (hold) / Change workspace (hold in Zen)
  // -------------------------------------------------------------
  bind(
    from("wheelRight"),
    to(
      press(key("right_arrow", VM.C_CS)).when(
        condApp(APP_ID.zen),
        condVar(mouseVars.rightButtonPressed, 1),
        condVar(mouseVars.wheelDown, 0),
      ),
      hold(shell(CMDS.winRightOrBottom)).when(
        condNotVar(mouseVars.wheelDown, 1),
        condNotVar(mouseVars.rightButtonPressed, 1),
      ),
    ),
    timing({
      aloneMs: TIMINGS.timeoutWheelChordMs,
      holdMs: TIMINGS.timeoutWheelChordMs,
    }),
  ),
  // -------------------------------------------------------------
  // WHEEL (AS BUTTON) — Fill screen (hold) / Open link in glance (rbutton+wheel in Zen)
  // -------------------------------------------------------------
  bind(
    from("wheel"),
    to(
      press([
        { pointing_button: "button1", modifiers: ["option"], repeat: false },
      ]).when(
        condApp(APP_ID.zen),
        condVar(mouseVars.rightButtonPressed, 1),
      ),
      release([{ pointing_button: "button3", repeat: false }]),
      hold(shell(CMDS.winMaxOrRestore)),
    ),
    when(condDevice(DEVICES.g502X)),
    options({
      whileHoldVar: mouseVars.wheelDown,
    }),
  ),
  // -------------------------------------------------------------
  // G7 (left_back) — Fill screen (tap) / Move window to next display (hold)
  // -------------------------------------------------------------
  bind(
    from("leftBack"),
    to(
      release(shell(CMDS.winMaxOrRestore)),
      hold(openUrl(URLS.rectDisplayNext)),
    ),
  ),
  // -------------------------------------------------------------
  // G8 (left_forward) — Activate Popclip (tap) / Activate Sidenote (hold)
  // -------------------------------------------------------------
  bind(
    from("leftForward"),
    to(
      release(shell(CMDS.showPopclip)),
      hold(key("f10", VM.CO_S, { repeat: false })),
    ),
  ),
  // -------------------------------------------------------------
  // G9 (middle_back) — Screenshot to text (tap) / markdown (hold)
  // -------------------------------------------------------------
  bind(
    from("middleBack"),
    to(
      release([openUrl(URLS.csxOcrNoLinebreaks)]),
      hold([shell(CMDS.screenshot_to_md)]),
    ),
  ),
  // -------------------------------------------------------------
  // BACK — Back (tap) / Window switch (hold); Zen+rbutton → next tab
  // -------------------------------------------------------------
  bind(
    from("back"),
    to(
      press(
        key("close_bracket", ["left_command", "shift"], { repeat: true }),
      ).when(
        condApp(APP_ID.zen),
        condVar(mouseVars.rightButtonPressed, 1),
      ),
      release([{ pointing_button: "button4", repeat: false }]),
      hold(key("tab", ["left_command"])),
    ),
    when(condDevice(DEVICES.g502X)),
    options({
      eventOptions: { halt: true, repeat: false },
    }),
  ),
  // -------------------------------------------------------------
  // FORWARD — Show windows of active app (hold) / Cycle tabs (rbutton+forward in Zen)
  // -------------------------------------------------------------
  bind(
    from("forward"),
    to(
      press(
        key("open_bracket", ["left_command", "shift"], { repeat: true }),
      ).when(
        condApp(APP_ID.zen),
        condVar(mouseVars.rightButtonPressed, 1),
      ),
      release([{ pointing_button: "button5", repeat: false }]),
      hold(key("down_arrow", ["control"], { repeat: false })),
    ),
    options({
      eventOptions: { halt: true, repeat: false },
    }),
  ),
  // -------------------------------------------------------------
  // RIGHT — Right click (tap) / Zen chord modifier (hold).
  // whileHoldVar signals right_button_pressed.
  // -------------------------------------------------------------
  bind(
    from("right"),
    to(
      release([{ pointing_button: "button2", repeat: false }]),
      hold([]),
    ),
    when(condDevice(DEVICES.g502X)),
    options({
      whileHoldVar: mouseVars.rightButtonPressed,
    }),
  ),
  // -------------------------------------------------------------
  // LEFT BUTTON (right-button held) — single action by app (tap) / double tap
  // → next display. Zen vs non-Zen split into condition-groups; the single tap
  // is DELAYED (fires via to_if_invoked after the timer) so a true double-tap
  // can still win. firstTapPendingVar is shared across both groups.
  // -------------------------------------------------------------
  bind(
    from("left"),
    to(
      // Zen — tap = cmd+click (delayed), hold = option+click, double = next display
      release([{ pointing_button: "button1", modifiers: ["left_command"], repeat: false }])
        .when(condApp(APP_ID.zen))
        .withDelayed(),
      hold([{ pointing_button: "button1", modifiers: ["option"], repeat: false }])
        .when(condApp(APP_ID.zen)),
      release(openUrl(URLS.rectDisplayNext))
        .when(condApp(APP_ID.zen))
        .withTapCount(2),
      // Non-Zen — tap = maximize (delayed), double = next display
      release(shell(CMDS.winMaxOrRestore))
        .when(condApp(APP_ID.zen, false))
        .withDelayed(),
      release(openUrl(URLS.rectDisplayNext))
        .when(condApp(APP_ID.zen, false))
        .withTapCount(2),
    ),
    when(
      condDevice(DEVICES.g502X),
      condVar(mouseVars.rightButtonPressed, 1),
    ),
    options({
      multiTap: { firstTapPendingVar: mouseVars.leftWithRightFirstTap },
    }),
  ),
  // -------------------------------------------------------------
  // LEFT BUTTON (right-button NOT held) — Left click (tap) / chord modifier (hold)
  // -------------------------------------------------------------
  bind(
    from("left"),
    to(
      release(key("return_or_enter")).when(
        condApp(APP_ID.onePiece),
        condApp(APP_ID.onePiecePreferences, false),
      ),
      hold([toTrigger()]),
    ),
    when(
      condDevice(DEVICES.g502X),
      condNotVar(mouseVars.rightButtonPressed, 1),
    ),
    options({
      whileHoldVar: mouseVars.leftButtonPressed,
      timing: { holdMs: 0 },
    }),
  ),
];
