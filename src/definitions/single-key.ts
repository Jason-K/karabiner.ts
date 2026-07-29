import { APP_BUNDLES, CMDS, EXTERNAL_HKS, PATHS, TIMINGS, URLS } from "../data";
import {
  actHere,
  appHistory,
  bind,
  condApp,
  condNotApp,
  extHk,
  from,
  hold,
  key,
  openApp,
  openUrl,
  press,
  release,
  shell,
  type Binding,
} from "../engine";

//   SINGLE KEY TAP/HOLD RULES — one binding per key; hold fires the action,
//   tap passes the key through (the engine's default-alone behavior).

const numBindings: Binding[] = [
  bind(from("8"), hold(openApp(APP_BUNDLES.ringCentral))),
  bind(from("keypad_0"), hold(openUrl(URLS.rectWinsUnstashAll, true))),
  bind(from("keypad_2"), hold(openUrl(URLS.rectWinStashDown, true))),
  bind(from("keypad_4"), hold(openUrl(URLS.rectWinStashLeft, true))),
  bind(from("keypad_5"), hold(openUrl(URLS.rectWinsUnstash, true))),
  bind(from("keypad_6"), hold(openUrl(URLS.rectWinStashRight, true))),
  bind(from("keypad_8"), hold(openUrl(URLS.rectWinStashUp, true))),
];

const letterBindings: Binding[] = [
  bind(from("a"), hold(key("f18", ["vmCOC_"], { repeat: false }))),
  bind(from("c"), hold(extHk(EXTERNAL_HKS.showBusyCal))),
  bind(from("d"), hold(key("f1", ["vmCO_S"], { repeat: false }))),
  bind(from("f"), hold(actHere("qspace"))),
  bind(from("g"), hold(openApp(APP_BUNDLES.claude, "shell"))),
  bind(from("h"), hold(openUrl(URLS.rayHere2There))),
  bind(from("j"), hold(openUrl(URLS.rayRecentDownloads))),
  bind(from("k"), hold(openApp(APP_BUNDLES.kitty))),
  bind(from("n"), hold(openUrl(URLS.newClientNote, true))),
  bind(from("o"), hold(openUrl(URLS.csxCaptureTextNoLinebreaks))),
  bind(from("p"), hold(extHk(EXTERNAL_HKS.showPopclip))),
  bind(from("q"), hold(openApp(APP_BUNDLES.qspace))),
  bind(from("r"), hold(shell(PATHS.scriptNewDLs))),
  bind(from("s"), hold(openUrl(URLS.csxCaptureArea))),
  bind(from("s", ["shift"]), hold(openUrl(URLS.csxCaptureWindow))),
  bind(from("t"), hold(extHk(EXTERNAL_HKS.showKittyQuakeTerm))),
  bind(from("v"), hold(openUrl(URLS.rayClipboard))),
  bind(from("x"), hold(actHere("copy"))),
  bind(from("y"), hold(actHere("copy"))),
  bind(from("z"), hold(openUrl(URLS.rayZoxideSearchDirs))),
];

const symbolBindings: Binding[] = [
  bind(
    from("keypad_equal_sign"),
    [
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", ["shift", "option"]),
        key("c", ["left_command"]),
        shell(CMDS.tpQuickDate),
      ]),
    ],
    {
      timing: {
        aloneMs: TIMINGS.delayHoldMs,
        heldThresholdMs: TIMINGS.delayHoldMs,
      },
    },
  ),
  bind(
    from("equal_sign"),
    [
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", ["shift", "option"]),
        key("c", ["left_command"]),
        shell(CMDS.tpQuickDate),
      ]),
    ],
    {
      timing: {
        aloneMs: TIMINGS.delayHoldMs,
        heldThresholdMs: TIMINGS.delayHoldMs,
      },
    },
  ),
  bind(from("slash"), hold(extHk(EXTERNAL_HKS.raycastHere2This))),
  bind(from("grave_accent_and_tilde"), hold(extHk(EXTERNAL_HKS.showPopclip))),
];

const nonCharBindings: Binding[] = [
  bind(
    from("keypad_enter"),
    [
      release(key("keypad_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condApp(APP_BUNDLES.excel, false)),
      hold(key("f2", { repeat: false })).when(condApp(APP_BUNDLES.excel)),
    ]
  ),
  bind(
    from("return_or_enter"),
    [
      release(key("return_or_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condApp(APP_BUNDLES.excel, false)),
      hold(key("f2", { repeat: false })).when(condApp(APP_BUNDLES.excel)),
    ],
  ),
  bind(from("tab"), hold(key("mission_control", { halt: true, repeat: true }))),
  bind(
    from("escape"),
    [
      release(key("escape")),
      hold(shell(CMDS.killForegroundApp)),
      hold(shell(CMDS.killAllApps)).withTapCount(2),
    ],
    {
      multiTap: { mods: [] },
    },
  ),
  bind(from("home"), press(key("left_arrow", ["left_command"]))),
  bind(from("end"), press(key("right_arrow", ["left_command"]))),
];

const functionKeyBindings: Binding[] = [
  bind(from("f1"), hold(key("display_brightness_decrement", { repeat: true }))),
  bind(from("f2"), hold(key("display_brightness_increment", { repeat: true }))),
  bind(from("f3"), hold(key("mission_control", { repeat: false }))),
  bind(from("f4"), hold(key("launchpad", { repeat: false }))),
  bind(from("f5"), hold(key("f5", ["vmCOC_"], { repeat: false }))),
  bind(from("f7"), hold(key("rewind", { repeat: true }))),
  bind(from("f8"), hold(key("play_or_pause", { repeat: false }))),
  bind(from("f9"), hold(key("fastforward", { repeat: true }))),
  bind(from("f10"), hold(key("mute", { repeat: false }))),
  bind(from("f11"), hold(key("volume_decrement", { repeat: true }))),
  bind(from("f12"), hold(key("volume_increment", { repeat: true }))),
];

const modifierKeyBindings: Binding[] = [
  bind(from("fn"), hold(key("f5", ["vmCOC_"], { repeat: false }))),
  bind(
    from("left_command"),
    [
      release(key("left_command")),
      hold(key("left_command")),
      release(appHistory(1)).withTapCount(2),
    ],
    {
      timing: {
        aloneMs: TIMINGS.timeoutDoubleTapMs,
        heldThresholdMs: TIMINGS.timeoutDoubleTapMs,
      },
      multiTap: { allowPassThrough: true, mods: [] },
    },
  ),
  bind(
    from("left_shift"),
    [
      release(key("left_shift")),
      hold(key("left_shift")),
      release(openUrl(URLS.rayClipboard)).withTapCount(2),
    ],
    {
      timing: {
        aloneMs: TIMINGS.timeoutDoubleTapMs,
        heldThresholdMs: TIMINGS.delayHoldMs,
      },
      multiTap: { allowPassThrough: true, mods: [] },
    },
  ),
  bind(
    from("right_shift"),
    [
      release(key("right_shift")),
      hold(key("right_shift")),
      release(openUrl(URLS.rayClipboard)).withTapCount(2),
    ],
    {
      timing: {
        aloneMs: TIMINGS.timeoutDoubleTapMs,
        heldThresholdMs: TIMINGS.delayHoldMs,
      },
      multiTap: { allowPassThrough: true, mods: [] },
    },
  ),
];

export const singleKeyTapHoldBindings: Binding[] = [
  ...numBindings,
  ...letterBindings,
  ...symbolBindings,
  ...nonCharBindings,
  ...functionKeyBindings,
  ...modifierKeyBindings,
];
