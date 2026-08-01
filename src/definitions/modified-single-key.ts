import { VMOD } from "../data";
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
  map,
  from,
  hold,
  ifKeVar,
  unlessKeVar,
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
  bind(from("keypad_1", VMOD.COCS), to(release(openUrl(URLS.winBottomLeftEighth, true)))),
  bind(from("keypad_3", VMOD.COCS), to(release(openUrl(URLS.winBottomRightEighth, true)))),
  bind(from("keypad_5", VMOD.COCS), to(release(openUrl(URLS.winMaximize, true)))),
  bind(from("keypad_7", VMOD.COCS), to(release(openUrl(URLS.winTopLeftEighth, true)))),
  bind(from("keypad_9", VMOD.COCS), to(release(openUrl(URLS.winTopRightEighth, true)))),
];

const modLetterBindings: Binding[] = [
  bind(from("a", ["shift"]), to(hold(openUrl(URLS.antinoteNewNoteInBackground)))),
  bind(from("e", VMOD.COCS), to(release(map(COMBOS.focusWinRight)))),
  bind(from("f", VMOD.COCS), to(release(map(COMBOS.focusWinBottom)))),
  bind(
    from("h", ["L.cmd"]),
    to(press(map(COMBOS.skimHighlight))),
    when(condApp(APP_ID.skim)),
  ),
  bind(
    from("k", ["R.opt"]),
    to(hold(actHere("kitty"))),
  ),
  bind(from("m", ["L.cmd"]), to(hold(map(COMBOS.restoreMinimizedWindow)))),
  bind(
    from("p", ["L.cmd"]),
    to(
      release(cmd(CMDS.wordPrint)).when(condApp(APP_ID.word)),
      hold(map(COMBOS.showPopclip)),
    ),
  ),
  bind(from("q", VMOD.COCS), to(release(map(COMBOS.focusWinLeft)))),
  bind(from("r", VMOD.COCS), to(release(map(COMBOS.focusWinTop)))),
  bind(from("s", VMOD.COCS), to(press(shell(CMDS.hsFormatSelection)))),
  bind(
    from("s", ["R.opt"]),
    to(
      release(shell(CMDS.spotifyToggle)),
      hold(openUrl(URLS.raySpotifySearch)),
    ),
  ),
  bind(
    from("t", VMOD.COCS),
    to(
      release(shell(CMDS.newTypinatorRule)),
      hold(shell(CMDS.lastTypinatorRule)),
    ),
  ),
  bind(
    from("t", ["R.opt"]),
    to(hold(shell(CMDS.lastTypinatorRule))),
  ),
  bind(
    from("u", ["L.cmd"]),
    to(press(map(COMBOS.skimUnderline))),
    when(condApp(APP_ID.skim)),
  ),
];

const modSymbolBindings: Binding[] = [
  bind(from("comma", VMOD.COCS), to(press(openApp(APP_ID.systemSettings)))),
  bind(
    from("slash", ["L.cmd"]),
    to(
      // AUTHENTICATION DIALOG fill password.
      press(cmd(CMDS.fillPw)).when(
        condApp(PW_IDS),
        ifKeVar(KE_VAR_VALUES.axTextField),
        ifKeVar(KE_VAR_VALUES.axSecureTextFieldSubrole),
      ),
      // AUTHENTICATION DIALOG: fill username and password.
      press(cmd(CMDS.fillUnPw)).when(
        condApp(PW_IDS),
        ifKeVar(KE_VAR_VALUES.axTextField),
        unlessKeVar(KE_VAR_VALUES.axSecureTextFieldSubrole),
      ),
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      press(shell(CMDS.getWordDocPathAndPrivileges)).when(condApp(APP_ID.word)),
    ),
  ),
];

const modNonCharBindings: Binding[] = [
  bind(from("end", ["shift"]), to(press(key("right_arrow", ["L.cmd", "shift"])))),
  bind(
    from("escape", ["control"]),
    to(
      release(openApp(APP_ID.activityMonitor)),
      hold(openApp(APP_ID.processSpy)),
    ),
  ),
  bind(from("escape", VMOD.COCS), to(press(openApp(APP_ID.activityMonitor)))),
  bind(from("home", ["shift"]), to(press(key("left_arrow", ["L.cmd", "shift"])))),
  bind(
    from("left_arrow", VMOD.COCS),
    to(
      release(shell(CMDS.winLeftOrTop)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
  bind(
    from("left_arrow", VMOD.C__S),
    to(press(map(COMBOS.zenNextTab))),
    when(condApp(APP_ID.zen)),
  ),
  bind(
    from("right_arrow", VMOD.COCS),
    to(
      release(shell(CMDS.winRightOrBottom)),
      hold(openUrl(URLS.rectAppNextDisplay, true)),
    ),
  ),
  bind(
    from("right_arrow", VMOD.C__S),
    to(press(map(COMBOS.zenPreviousTab))),
    when(condApp(APP_ID.zen)),
  ),
  bind(from("spacebar", VMOD.COCS), to(release(shell(CMDS.winMaxOrRestore)))),
  bind(
    from("tab", VMOD.COCS),
    to(
      release(openUrl(URLS.rectAppNextDisplay, true)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
];

const modFunctionKeyBindings: Binding[] = [
  bind(from("f12", VMOD.COCS), to(press(shell(CMDS.lastTypinatorRule)))),
];

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...modNumBindings,
  ...modLetterBindings,
  ...modSymbolBindings,
  ...modNonCharBindings,
  ...modFunctionKeyBindings,
];
