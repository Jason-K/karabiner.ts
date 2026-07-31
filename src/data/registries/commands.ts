import { PATHS } from "./paths";
import type { CommandSpec } from "../primitives/commands";
import { TIMINGS } from "../constants/timings";
import { URLS } from "./urls";

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a shell command.
 *  @param commandStr - the shell command string to execute
 *  @param refDesc    - human label used in descriptions
 */
const cmdEntry = (commandStr: string, refDesc: string): CommandSpec => ({
  type: "command",
  command: commandStr,
  refDesc,
});

const subCommands = {
  // PRIVILEGES
  revokePriv: `${PATHS.binPrivCLI.path} -r`,
  addPriv: `${PATHS.binPrivCLI.path} -a`,
  getPriv: `${PATHS.binPrivCLI.path} -r && sleep ${TIMINGS.privDelaySec} && ${PATHS.binPrivCLI.path} -a && sleep ${TIMINGS.privDelaySec}`,

  // 1PASSWORD
  fillSecret: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control,shift>"`,
  fillNameAndSecret: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control,shift>"`,

  // UTILITIES
  callSendKeys: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005`,

  // SCRIPTS
  getWordDocPath: `osascript '${PATHS.scriptWordGetDocPath.path}'`,

  // HAMMERSPOON
  callHammerspoon: `'${PATHS.binHS.path}' -c`,

  hsGetDisplayInfo: `'${PATHS.binHS.path}' -c 'local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local screenFrame = screen:frame()`,

  // RAYCAST
  callRaycastExtension: `open -u raycast-x://extensions`,

  // TEXT PROCESSOR
  callTextProcessor: `'${PATHS.binUV.path}' --directory '${PATHS.dirTextProcessor.path}' run python '${PATHS.scriptTextProcessorCLI.path}'`,
};

const Passwords_Privileges = {
  // PASSWORDS AND PRIVILEGES
  getPrivileges: cmdEntry(`${subCommands.getPriv}`, "Get privileges"),
  fillPassword: cmdEntry(
    `${subCommands.getPriv} && ${subCommands.fillSecret}`,
    "Fill password",
  ),
  fillUsernameAndPassword: cmdEntry(
    `${subCommands.getPriv} && ${subCommands.fillNameAndSecret}`,
    "Fill username and password",
  ),
  getWordDocPathAndPrivileges: cmdEntry(
    `${subCommands.getWordDocPath} && ${subCommands.getPriv} && ${subCommands.fillSecret}`,
    "Get privileges and path to active Word document",
  ),
};

const Kill_Apps = {
  killForegroundApp: cmdEntry(
    `${PATHS.binAppKill.path} --foreground`,
    "Kill foreground application",
  ),
  killAllApps: cmdEntry(`${PATHS.binAppKill.path}`, "Kill all applications"),
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
};

const Typinator_Scripts = {
  typinatorNewRule: cmdEntry(
    `'${PATHS.binTypinatorVenv.path}' '${PATHS.scriptTypinatorNewRule.path}'`,
    "Create new Typinator rule",
  ),
  scriptTypinatorLastRule: cmdEntry(
    `osascript '${PATHS.scriptTypinatorLastRule.path}'`,
    "Edit last Typinator expansion",
  ),
};

const Spotify = {
  spotifyToggle: cmdEntry(
    `if pgrep -x 'Spotify' > /dev/null; then open '${URLS.raySpotifyPlayPause.url}'; else '${PATHS.binAppOpen.path}' -b 'com.spotify.client'; fi; echo 'Spotify toggled'`,
    "open Spotify or toggle play/pause",
  ),
};

const Text_Processor = {
  tpQuickDate: cmdEntry(
    `${subCommands.callTextProcessor} quick_date --source cut --dest paste`,
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
};

const Get_Recents = {
  rayGetRecents: cmdEntry(
    `${subCommands.callRaycastExtension}/jason/recents/recentCustom`,
    "Get recent items from Raycast",
  ),
  getRecentDls: cmdEntry(
    `${PATHS.scriptNewDLs.path} -a`,
    "Get recent items from script",
  ),
  getRecentMods: cmdEntry(
    `${PATHS.scriptNewDLs.path} -m`,
    "Get recent mods from script",
  ),
  getNewFiles: cmdEntry(
    `${PATHS.scriptNewDLs.path} -c`,
    "Get new files from script",
  ),
};

const App_Specific = {
  wordPrint: cmdEntry(
    `${subCommands.getWordDocPath} && ${subCommands.callSendKeys} -c "<c:p:command>"`,
    "get file path and print in word",
  ),
};

const Misc_Scripts = {
  screenshot_to_md: cmdEntry(
    `'${PATHS.binSharedVenv.path}' '${PATHS.dirScripts.path}/ui/screenshot_to_md/shot_to_md.py'`,
    "Take screenshot and convert to markdown",
  ),
  showPopclip: cmdEntry(
    `osascript -e 'tell application "Popclip" to appear'`,
    "Show Popclip at cursor position",
  ),
};

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

export const CMDS = {
  ...Passwords_Privileges,
  ...Kill_Apps,
  ...Hs_Functions,
  ...Typinator_Scripts,
  ...Spotify,
  ...Text_Processor,
  ...Windows,
  ...Get_Recents,
  ...App_Specific,
  ...Misc_Scripts,
} as const;

export type { CommandSpec };
