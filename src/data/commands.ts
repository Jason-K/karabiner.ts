import { PATHS } from "./paths";
import { TIMINGS } from "./timings";

const cmdEntry = (name: string, refDesc: string) => ({
  type: "command" as const,
  name,
  refDesc,
});

const subCommands = {
  // PRIVILEGES
  revokePriv: `${PATHS.binPrivCLI.name} -r`,
  addPriv: `${PATHS.binPrivCLI.name} -a`,
  getPriv: `${PATHS.binPrivCLI.name} -r && sleep ${TIMINGS.privDelaySec} && ${PATHS.binPrivCLI.name} -a && sleep ${TIMINGS.privDelaySec}`,

  // UTILITIES
  callSendKeys: `${PATHS.binSendKeys.name} --initial-delay 0 --delay 0.005`,

  // SCRIPTS
  getWordDocPath: `osascript '${PATHS.scriptWordGetDocPath.name}'`,

  // HAMMERSPOON
  callHammerspoon: `${PATHS.binHS.name} -c`,

  hsGetDisplayInfo: `${PATHS.binHS.name} -c 'local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local screenFrame = screen:frame()`,

  // TEXT PROCESSOR
  callTextProcessor: `${PATHS.binUV.name} --directory ${PATHS.dirTextProcessor.name} run python ${PATHS.scriptTextProcessorCLI.name}`,

};

const Passwords_Privileges = {
  // PASSWORDS AND PRIVILEGES
  getPrivileges: cmdEntry(`${subCommands.getPriv}`, "Get privileges"),
  fillPassword: cmdEntry(
    `${subCommands.getPriv} && ${subCommands.callSendKeys} --characters "<c:/:command,option,control>"`,
    "Fill password",
  ),
  fillUsernameAndPassword: cmdEntry(
    `${subCommands.getPriv} && ${subCommands.callSendKeys} --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`,
    "Fill username and password",
  ),
  getWordDocPathAndPrivileges: cmdEntry(
    `${subCommands.getWordDocPath} && ${subCommands.getPriv} && ${subCommands.callSendKeys} --characters "<c:/:command,option,control>"`,
    "Get privileges and path to active Word document",
  ),

};

const Kill_Apps = {
  killForegroundApp: cmdEntry(
    `${PATHS.binAppKill.name} --foreground`,
    "Kill foreground application",
  ),
  killAllApps: cmdEntry(
    `${PATHS.binAppKill.name} --all`,
    "Kill all applications",
  ),
};

const Hs_Functions = {
  hsFormatSelection: cmdEntry(
    `${subCommands.callHammerspoon} 'FormatSelection()'`,
    "Format selection using hsStringEval",
  ),
  hsFormatCutSeed: cmdEntry(
    `${subCommands.callHammerspoon} 'FormatCutSeed()'`,
    "Format substrings within selection",
  ),
}

const Typinator_Scripts = {
  typinatorNewRule: cmdEntry(
    `${PATHS.binPythonTypinator.name} ${PATHS.scriptTypinatorNewRule.name}`,
    "Create new Typinator rule",
  ),
  scriptTypinatorLastRule: cmdEntry(
    `osascript '${PATHS.scriptTypinatorLastRule.name}'`,
    "Edit last Typinator expansion",
  ),
};

const Spotify = {
  spotifyToggle: cmdEntry(
    `if pgrep -x 'Spotify' > /dev/null; then open 'raycast-x://extensions/mattisssa/spotify-player/togglePlayPause'; else '${PATHS.binAppOpen.name}' -b 'com.spotify.client'; fi; echo 'Spotify toggled'`,
    "open Spotify or toggle play/pause",
  ),
};

const Text_Processor = {
  tpQuickDate: cmdEntry(
    `${subCommands.callTextProcessor} quick_date --source clipboard --dest paste`,
    "Insert today's date in yyyy-mm-dd format at the cursor.",
  ),
  tpCaseUpper: cmdEntry(
    `${subCommands.callTextProcessor} uppercase --source clipboard --dest paste`,
    "Convert clipboard to uppercase.",
  ),
  tpCaseLower: cmdEntry(
    `${subCommands.callTextProcessor} lower_case --source clipboard --dest paste`,
    "Convert clipboard to lowercase.",
  ),
  tpCaseTitle: cmdEntry(
    `${subCommands.callTextProcessor} title_case --source clipboard --dest paste`,
    "Convert clipboard to title case.",
  ),
  tpWrapQuotes: cmdEntry(
    `${subCommands.callTextProcessor} wrap_quotes --source clipboard --dest paste`,
    "Wrap clipboard in quotes.",
  ),
  tpWrapSingleQuotes: cmdEntry(
    `${subCommands.callTextProcessor} wrap_single_quotes --source clipboard --dest paste`,
    "Wrap clipboard in single quotes.",
  ),
  tpWrapParentheses: cmdEntry(
    `${subCommands.callTextProcessor} wrap_parentheses --source clipboard --dest paste`,
    "Wrap clipboard in parentheses.",
  ),
  tpWrapBrackets: cmdEntry(
    `${subCommands.callTextProcessor} wrap_brackets --source clipboard --dest paste`,
    "Wrap clipboard in brackets.",
  ),
  tpWrapBraces: cmdEntry(
    `${subCommands.callTextProcessor} wrap_braces --source clipboard --dest paste`,
    "Wrap clipboard in braces.",
  ),
  tpWrapAngleBrackets: cmdEntry(
    `${subCommands.callTextProcessor} wrap_angle_brackets --source clipboard --dest paste`,
    "Wrap clipboard in angle brackets.",
  ),
};

const Windows = {
  winRightOrBottom: cmdEntry(
    `${subCommands.hsGetDisplayInfo}; local url = (screenFrame.w >= screenFrame.h) and [[rectangle-pro://execute-action?name=right-half]] or [[rectangle-pro://execute-action?name=bottom-half]]; hs.urlevent.openURL(url)'`,
    "Move window to right or bottom half",
  ),
  winLeftOrTop: cmdEntry(
    `${subCommands.hsGetDisplayInfo}; local url = (screenFrame.w >= screenFrame.h) and [[rectangle-pro://execute-action?name=left-half]] or [[rectangle-pro://execute-action?name=top-half]]; hs.urlevent.openURL(url)'`,
    "Move window to left or top half",
  ),
  winMaxOrRestore: cmdEntry(
    `${subCommands.hsGetDisplayInfo}; local winFrame = win and win:frame() or screenFrame; local positionTolerance = 24; local widthCoverage = screenFrame.w > 0 and (winFrame.w / screenFrame.w) or 0; local heightCoverage = screenFrame.h > 0 and (winFrame.h / screenFrame.h) or 0; local leftAligned = math.abs(winFrame.x - screenFrame.x) <= positionTolerance; local topAligned = math.abs(winFrame.y - screenFrame.y) <= positionTolerance; local isMaximized = leftAligned and topAligned and widthCoverage >= 0.97 and heightCoverage >= 0.9; local url = isMaximized and [[rectangle-pro://execute-action?name=restore]] or [[rectangle-pro://execute-action?name=maximize]]; hs.urlevent.openURL(url)'`,
    "Maximize or restore window",
  ),
}

export const CMDS = {
  ...Passwords_Privileges,
  ...Kill_Apps,
  ...Hs_Functions,
  ...Typinator_Scripts,
  ...Spotify,
  ...Text_Processor,
  ...Windows,
} as const;

export type CommandRef = import("./refs").CommandRef;
