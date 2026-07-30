import { VMOD } from "../core/mods";
import {
  APP_ID,
  CMDS,
  COMBOS,
  KE_VAR_VALUES,
  KE_VARS,
  PW_IDS,
  URLS,
} from "../data";
import {
  actHere,
  bind,
  cmd,
  condApp,
  condNotVar,
  condVar,
  combo,
  from,
  hold,
  key,
  openApp,
  openUrl,
  press,
  release,
  shell,
  to,
  when,
  type Binding,
} from "../engine";

const modNumBindings: Binding[] = [
  bind(from("keypad_1", ["COCS"]), to(release(openUrl(URLS.rectWinBottomLeftEighth, true)))),
  bind(from("keypad_3", ["COCS"]), to(release(openUrl(URLS.rectWinBottomRightEighth, true)))),
  bind(from("keypad_5", ["COCS"]), to(release(openUrl(URLS.rectWinMaximize, true)))),
  bind(from("keypad_7", ["COCS"]), to(release(openUrl(URLS.rectWinTopLeftEighth, true)))),
  bind(from("keypad_9", ["COCS"]), to(release(openUrl(URLS.rectWinTopRightEighth, true)))),
];

const modLetterBindings: Binding[] = [
  bind(from("a", ["shift"]), to(hold(openUrl(URLS.antinoteNewNoteInBackground)))),
  bind(from("e", ["COCS"]), to(release(combo(COMBOS.focusWinRight)))),
  bind(from("f", ["COCS"]), to(release(combo(COMBOS.focusWinBottom)))),
  bind(
    from("h", ["left_command"]),
    to(press(combo(COMBOS.skimHighlight))),
    when(condApp(APP_ID.skim)),
  ),
  bind(
    from("k", ["right_option"]),
    to(hold(actHere("kitty"))),
  ),
  bind(from("m", ["left_command"]), to(hold(combo(COMBOS.restoreMinimizedWindow)))),
  bind(
    from("p", ["left_command"]),
    to(
      release(cmd(CMDS.wordPrint)).when(condApp(APP_ID.word)),
      hold(combo(COMBOS.popclip)),
    ),
  ),
  bind(from("q", ["COCS"]), to(release(combo(COMBOS.focusWinLeft)))),
  bind(from("r", ["COCS"]), to(release(combo(COMBOS.focusWinTop)))),
  bind(from("s", VMOD.COCS), to(press(shell(CMDS.hsFormatSelection)))),
  bind(
    from("s", ["right_option"]),
    to(
      release(shell(CMDS.spotifyToggle)),
      hold(openUrl(URLS.raySpotifySearch)),
    ),
  ),
  bind(
    from("t", ["COCS"]),
    to(
      release(shell(CMDS.typinatorNewRule)),
      hold(shell(CMDS.scriptTypinatorLastRule)),
    ),
  ),
  bind(
    from("t", ["right_option"]),
    to(hold(shell(CMDS.scriptTypinatorLastRule))),
  ),
  bind(
    from("u", ["left_command"]),
    to(press(combo(COMBOS.skimUnderline))),
    when(condApp(APP_ID.skim)),
  ),
];

const modSymbolBindings: Binding[] = [
  bind(from("comma", VMOD.COCS), to(press(openApp(APP_ID.systemSettings)))),
  bind(
    from("slash", ["left_command"]),
    to(
      // AUTHENTICATION DIALOG fill password.
      press(cmd(CMDS.fillPassword)).when(
        condApp(PW_IDS),
        condVar(KE_VARS.accessibilityType, KE_VAR_VALUES.axTextField),
        condVar(KE_VARS.accessibilitySubtype, KE_VAR_VALUES.axSecureTextField),
      ),
      // AUTHENTICATION DIALOG: fill username and password.
      press(cmd(CMDS.fillUsernameAndPassword)).when(
        condApp(PW_IDS),
        condVar(KE_VARS.accessibilityType, KE_VAR_VALUES.axTextField),
        condNotVar(KE_VARS.accessibilitySubtype, KE_VAR_VALUES.axSecureTextField),
      ),
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      press(shell(CMDS.getWordDocPathAndPrivileges)).when(condApp(APP_ID.word)),
    ),
  ),
];

const modNonCharBindings: Binding[] = [
  bind(from("end", ["shift"]), to(press(key("right_arrow", ["left_command", "shift"])))),
  bind(
    from("escape", ["control"]),
    to(
      release(openApp(APP_ID.activityMonitor)),
      hold(openApp(APP_ID.processSpy)),
    ),
  ),
  bind(from("escape", VMOD.COCS), to(press(openApp(APP_ID.activityMonitor)))),
  bind(from("home", ["shift"]), to(press(key("left_arrow", ["left_command", "shift"])))),
  bind(
    from("left_arrow", ["COCS"]),
    to(
      release(shell(CMDS.winLeftOrTop)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
  bind(
    from("left_arrow", VMOD.C__S),
    to(press(combo(COMBOS.zenNextTab))),
    when(condApp(APP_ID.zen)),
  ),
  bind(
    from("right_arrow", ["COCS"]),
    to(
      release(shell(CMDS.winRightOrBottom)),
      hold(openUrl(URLS.rectAppNextDisplay, true)),
    ),
  ),
  bind(
    from("right_arrow", VMOD.C__S),
    to(press(combo(COMBOS.zenPreviousTab))),
    when(condApp(APP_ID.zen)),
  ),
  bind(from("spacebar", ["COCS"]), to(release(shell(CMDS.winMaxOrRestore)))),
  bind(
    from("tab", ["COCS"]),
    to(
      release(openUrl(URLS.rectAppNextDisplay, true)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
];

const modFunctionKeyBindings: Binding[] = [
  bind(from("f12", VMOD.COCS), to(press(shell(CMDS.scriptTypinatorLastRule)))),
];

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...modNumBindings,
  ...modLetterBindings,
  ...modSymbolBindings,
  ...modNonCharBindings,
  ...modFunctionKeyBindings,
];
