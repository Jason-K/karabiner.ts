import { MOD_COMBO } from "../core/mods";
import {
  APP_BUNDLES,
  CMDS,
  EXTERNAL_HKS,
  KE_VAR_VALUES,
  KE_VARS,
  PW_BUNDLES,
  TIMINGS,
  URLS,
} from "../data";
import {
  actHere,
  bind,
  cmd,
  condApp,
  condNotVar,
  condVar,
  extHk,
  from,
  hold,
  key,
  openApp,
  openUrl,
  press,
  release,
  shell,
  timing,
  to,
  when,
  type Binding,
} from "../engine";

const modNumBindings: Binding[] = [
  bind(from("keypad_1", ["vmCOCS"]), to(release(openUrl(URLS.rectWinBottomLeftEighth, true)))),
  bind(from("keypad_3", ["vmCOCS"]), to(release(openUrl(URLS.rectWinBottomRightEighth, true)))),
  bind(from("keypad_5", ["vmCOCS"]), to(release(openUrl(URLS.rectWinMaximize, true)))),
  bind(from("keypad_7", ["vmCOCS"]), to(release(openUrl(URLS.rectWinTopLeftEighth, true)))),
  bind(from("keypad_9", ["vmCOCS"]), to(release(openUrl(URLS.rectWinTopRightEighth, true)))),
];

const modLetterBindings: Binding[] = [
  bind(from("a", ["shift"]), to(hold(openUrl(URLS.antinoteNewNoteInBackground)))),
  bind(from("e", ["vmCOCS"]), to(release(extHk(EXTERNAL_HKS.focusWinRight)))),
  bind(from("f", ["vmCOCS"]), to(release(extHk(EXTERNAL_HKS.focusWinBottom)))),
  bind(
    from("h", ["left_command"]),
    to(press(extHk(EXTERNAL_HKS.skimHighlight))),
    when(condApp(APP_BUNDLES.skim)),
  ),
  bind(
    from("k", ["right_option"]),
    to(hold(actHere("kitty"))),
    timing({
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    }),
  ),
  bind(from("m", ["left_command"]), to(hold(extHk(EXTERNAL_HKS.restoreMinimizedWindow)))),
  bind(
    from("p", ["left_command"]),
    to(
      release(cmd(CMDS.wordPrint)).when(condApp(APP_BUNDLES.word)),
      hold(extHk(EXTERNAL_HKS.popclip)),
    ),
  ),
  bind(from("q", ["vmCOCS"]), to(release(extHk(EXTERNAL_HKS.focusWinLeft)))),
  bind(from("r", ["vmCOCS"]), to(release(extHk(EXTERNAL_HKS.focusWinTop)))),
  bind(from("s", MOD_COMBO.vmCOCS), to(press(shell(CMDS.hsFormatSelection)))),
  bind(
    from("s", ["right_option"]),
    to(
      release(shell(CMDS.spotifyToggle)),
      hold(openUrl(URLS.raySpotifySearch)),
    ),
    timing({
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    }),
  ),
  bind(
    from("t", ["vmCOCS"]),
    to(
      release(shell(CMDS.typinatorNewRule)),
      hold(shell(CMDS.scriptTypinatorLastRule)),
    ),
  ),
  bind(
    from("t", ["right_option"]),
    to(hold(shell(CMDS.scriptTypinatorLastRule))),
    timing({
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    }),
  ),
  bind(
    from("u", ["left_command"]),
    to(press(extHk(EXTERNAL_HKS.skimUnderline))),
    when(condApp(APP_BUNDLES.skim)),
  ),
];

const modSymbolBindings: Binding[] = [
  bind(from("comma", MOD_COMBO.vmCOCS), to(press(openApp(APP_BUNDLES.systemSettings)))),
  bind(
    from("slash", ["left_command"]),
    to(
      // AUTHENTICATION DIALOG fill password.
      press(cmd(CMDS.fillPassword)).when(
        condApp(PW_BUNDLES),
        condVar(KE_VARS.accessibilityType, KE_VAR_VALUES.axTextField),
        condVar(KE_VARS.accessibilitySubtype, KE_VAR_VALUES.axSecureTextField),
      ),
      // AUTHENTICATION DIALOG: fill username and password.
      press(cmd(CMDS.fillUsernameAndPassword)).when(
        condApp(PW_BUNDLES),
        condVar(KE_VARS.accessibilityType, KE_VAR_VALUES.axTextField),
        condNotVar(KE_VARS.accessibilitySubtype, KE_VAR_VALUES.axSecureTextField),
      ),
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      press(shell(CMDS.getWordDocPathAndPrivileges)).when(condApp(APP_BUNDLES.word)),
    ),
  ),
];

const modNonCharBindings: Binding[] = [
  bind(from("end", ["shift"]), to(press(key("right_arrow", ["left_command", "shift"])))),
  bind(
    from("escape", ["control"]),
    to(
      release(openApp(APP_BUNDLES.activityMonitor)),
      hold(openApp(APP_BUNDLES.processSpy)),
    ),
    timing({
      aloneMs: TIMINGS.delayHoldMs,
      heldThresholdMs: TIMINGS.delayHoldMs,
    }),
  ),
  bind(from("escape", MOD_COMBO.vmCOCS), to(press(openApp(APP_BUNDLES.activityMonitor)))),
  bind(from("home", ["shift"]), to(press(key("left_arrow", ["left_command", "shift"])))),
  bind(
    from("left_arrow", ["vmCOCS"]),
    to(
      release(shell(CMDS.winLeftOrTop)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
  bind(
    from("left_arrow", MOD_COMBO.vmC__S),
    to(press(extHk(EXTERNAL_HKS.zenNextTab))),
    when(condApp(APP_BUNDLES.zen)),
  ),
  bind(
    from("right_arrow", ["vmCOCS"]),
    to(
      release(shell(CMDS.winRightOrBottom)),
      hold(openUrl(URLS.rectAppNextDisplay, true)),
    ),
  ),
  bind(
    from("right_arrow", MOD_COMBO.vmC__S),
    to(press(extHk(EXTERNAL_HKS.zenPreviousTab))),
    when(condApp(APP_BUNDLES.zen)),
  ),
  bind(from("spacebar", ["vmCOCS"]), to(release(shell(CMDS.winMaxOrRestore)))),
  bind(
    from("tab", ["vmCOCS"]),
    to(
      release(openUrl(URLS.rectAppNextDisplay, true)),
      hold(openUrl(URLS.rectAppPrevDisplay, true)),
    ),
  ),
];

const modFunctionKeyBindings: Binding[] = [
  bind(from("f12", MOD_COMBO.vmCOCS), to(press(shell(CMDS.scriptTypinatorLastRule)))),
];

export const modifiedSingleKeyTapHoldBindings: Binding[] = [
  ...modNumBindings,
  ...modLetterBindings,
  ...modSymbolBindings,
  ...modNonCharBindings,
  ...modFunctionKeyBindings,
];
