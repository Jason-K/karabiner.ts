import { APP_ID, CMDS, COMBOS, URLS, VMOD } from "../data";
import { capsVars } from "./caps-lock";
import {
  actHere,
  appHistory,
  bind,
  condApp,
  condNotVar,
  map,
  from,
  hold,
  key,
  openApp,
  openUrl,
  options,
  press,
  release,
  shell,
  to,
  when,
  type Binding,
} from "../engine";

//   SINGLE KEY TAP/HOLD RULES — one binding per key; hold fires the action,
//   tap passes the key through (the engine's default-alone behavior).

const numBindings: Binding[] = [
  bind(from("8"), to(hold(openApp(APP_ID.ringCentral)))),
  bind(from("keypad_0"), to(hold(openUrl(URLS.rectWinsUnstashAll, true)))),
  bind(from("keypad_2"), to(hold(openUrl(URLS.rectWinStashDown, true)))),
  bind(from("keypad_4"), to(hold(openUrl(URLS.rectWinStashLeft, true)))),
  bind(from("keypad_5"), to(hold(openUrl(URLS.rectWinsUnstash, true)))),
  bind(from("keypad_6"), to(hold(openUrl(URLS.rectWinStashRight, true)))),
  bind(from("keypad_8"), to(hold(openUrl(URLS.rectWinStashUp, true)))),
];

const letterBindings: Binding[] = [
  bind(from("a"), to(hold(key("f18", VMOD.COCS)))),
  bind(from("c"), to(hold(map(COMBOS.showBusyCal)))),
  bind(from("d"), to(hold(key("f1", VMOD.CO_S)))),
  bind(from("f"), to(hold(actHere("qspace")))),
  bind(from("g"), to(hold(openApp(APP_ID.claude, "shell")))),
  bind(from("h"), to(hold(openUrl(URLS.rayHere2There)))),
  bind(from("j"), to(hold(openUrl(URLS.rayRecentDownloads)))),
  bind(from("k"), to(hold(openApp(APP_ID.kitty)))),
  bind(from("n"), to(hold(openUrl(URLS.newClientNote, true)))),
  bind(from("o"), to(hold(openUrl(URLS.csxOcrNoLinebreaks)))),
  bind(from("p"), to(hold(map(COMBOS.showPopclip)))),
  bind(from("q"), to(hold(openApp(APP_ID.qspace)))),
  bind(from("r"), to(hold(shell(CMDS.rayGetRecents)))),
  bind(from("s"), to(hold(openUrl(URLS.csxCaptureArea)))),
  bind(from("s", ["shift"]), to(hold(openUrl(URLS.csxCaptureWindow)))),
  bind(from("t"), to(hold(map(COMBOS.showKittyQuakeTerm)))),
  bind(from("v"), to(hold(openUrl(URLS.rayClipboard)))),
  bind(from("x"), to(hold(actHere("copy")))),
  bind(from("y"), to(hold(actHere("copy")))),
  bind(from("z"), to(hold(openUrl(URLS.rayZoxideSearchDirs)))),
];

const symbolBindings: Binding[] = [
  bind(
    from("keypad_equal_sign"),
    to(
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", VMOD._O_S),
        shell(CMDS.tpQuickDate),
      ]),
    ),
    options({
      timing: { aloneMs: 200, holdMs: 200 },
      suppressCancelFallback: true,
    }),
  ),
  bind(
    from("equal_sign"),
    to(
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", VMOD._O_S),
        shell(CMDS.tpQuickDate),
      ]),
    ),
    options({
      timing: { aloneMs: 200, holdMs: 200 },
      suppressCancelFallback: true,
    }),
  ),
  bind(from("slash"), to(hold(map(COMBOS.raycastHere2This)))),
  bind(from("grave_accent_and_tilde"), to(hold(map(COMBOS.showPopclip)))),
];

const nonCharBindings: Binding[] = [
  bind(
    from("keypad_enter"),
    to(
      release(key("keypad_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condApp(APP_ID.excel, false)),
      hold(key("f2")).when(condApp(APP_ID.excel)),
    ),
    options({
      timing: { aloneMs: 200, holdMs: 200 },
      suppressCancelFallback: true,
    }),
  ),
  bind(
    from("return_or_enter"),
    to(
      release(key("return_or_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condApp(APP_ID.excel, false)),
      hold(key("f2")).when(condApp(APP_ID.excel)),
    ),
    options({
      timing: { aloneMs: 200, holdMs: 200 },
      suppressCancelFallback: true,
    }),
  ),
  bind(from("tab"), to(hold(key("mission_control", { halt: true, repeat: true })))),
  bind(
    from("escape"),
    to(
      release(key("escape")),
      hold(shell(CMDS.killForegroundApp)),
      hold(shell(CMDS.killAllApps)).withTapCount(2),
    ),
    options({
      multiTap: { mods: [] },
    }),
  ),
  bind(from("home"), to(press(key("left_arrow", ["left_command"])))),
  bind(from("end"), to(press(key("right_arrow", ["left_command"])))),
];

const functionKeyBindings: Binding[] = [
  bind(from("f1"), to(hold(key("display_brightness_decrement", { repeat: true })))),
  bind(from("f2"), to(hold(key("display_brightness_increment", { repeat: true })))),
  bind(from("f3"), to(hold(key("mission_control")))),
  bind(from("f4"), to(hold(key("launchpad")))),
  bind(from("f5"), to(hold(key("f5", ["COC_"])))),
  bind(from("f7"), to(hold(key("rewind", { repeat: true })))),
  bind(from("f8"), to(hold(key("play_or_pause")))),
  bind(from("f9"), to(hold(key("fastforward", { repeat: true })))),
  bind(from("f10"), to(hold(key("mute")))),
  bind(from("f11"), to(hold(key("volume_decrement", { repeat: true })))),
  bind(from("f12"), to(hold(key("volume_increment", { repeat: true })))),
];

const modifierKeyBindings: Binding[] = [
  bind(
    from("fn"),
    to(hold(key("f5", ["COC_"]))),
    when(condNotVar(capsVars.pressed, 1)),
  ),
  bind(
    from("left_command"),
    to(
      release(key("left_command")),
      hold(key("left_command")),
      release(appHistory(1)).withTapCount(2),
    ),
    // Do not intercept left_command while caps lock is held: caps emits
    // left_command as its hyper-modifier key_code, and this rule's lazy
    // transform would otherwise drop cmd from the caps modifier set.
    when(condNotVar(capsVars.pressed, 1)),
    options({
      multiTap: { allowPassThrough: true, mods: [] },
    }),
  ),
  bind(
    from("left_shift"),
    to(
      release(key("left_shift")),
      hold(key("left_shift")),
      release(openUrl(URLS.rayClipboard)).withTapCount(2),
    ),
    when(condNotVar(capsVars.pressed, 1)),
    options({
      multiTap: { allowPassThrough: true, mods: [] },
    }),
  ),
  bind(
    from("right_shift"),
    to(
      release(key("right_shift")),
      hold(key("right_shift")),
      release(openUrl(URLS.rayClipboard)).withTapCount(2),
    ),
    when(condNotVar(capsVars.pressed, 1)),
    options({
      multiTap: { allowPassThrough: true, mods: [] },
    }),
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
