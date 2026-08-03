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
  rmPriv: `${PATHS.binPrivCLI.path} -r`,
  addPriv: `${PATHS.binPrivCLI.path} -a`,
  getPriv: `${PATHS.binPrivCLI.path} -r && sleep ${TIMINGS.privDelaySec} && ${PATHS.binPrivCLI.path} -a && sleep ${TIMINGS.privDelaySec}`,

  // 1PASSWORD
  fillPw: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control,shift>"`,
  fillUnAndPw: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control,shift>"`,

  // UTILITIES
  callSendKeys: `'${PATHS.binSendKeys.path}' --initial-delay 0 --delay 0.005`,

  // SCRIPTS
  getDocxPath: `osascript '${PATHS.getDocPath.path}'`,

  // HAMMERSPOON
  callHs: `'${PATHS.binHS.path}' -c`,

  hsGetDisplayInfo: `'${PATHS.binHS.path}' -c 'local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local screenFrame = screen:frame()`,

  // RAYCAST
  raycastExt: `open -u raycast-x://extensions`,

  // TEXT PROCESSOR
  stringThings: `'${PATHS.binUV.path}' --directory '${PATHS.stringThingsDir.path}' run python '${PATHS.stringThings.path}'`,
};

const Passwords_Privileges = {
  // PASSWORDS AND PRIVILEGES
  getPrivileges: cmdEntry(`${subCommands.getPriv}`, "Get privileges"),
  fillPw: cmdEntry(`${subCommands.getPriv} && ${subCommands.fillPw}`, "Fill password"),
  fillUnPw: cmdEntry(`${subCommands.getPriv} && ${subCommands.fillUnAndPw}`, "Fill username and password"),
  getDocPathAndPrivileges: cmdEntry(
    `${subCommands.getDocxPath} && ${subCommands.getPriv} && ${subCommands.fillPw}`,
    "Get privileges and path to active Word document",
  ),
};

const Kill_Apps = {
  killForegroundApp: cmdEntry(`${PATHS.binAppKill.path} --foreground`, "Kill front app",),
  killAllApps: cmdEntry(`${PATHS.binAppKill.path}`, "Kill all applications"),
};

const Hs_Functions = {
  evalSelection: cmdEntry(`${subCommands.callHs} 'FormatSelection()'`, "Format selection using hsStringEval",),
  evalSelectionPart: cmdEntry(`${subCommands.callHs} 'FormatCutSeed()'`, "Format substrings within selection",),
};

const Typinator_Scripts = {
  newTypinatorRule: cmdEntry(
    `'${PATHS.binTypinatorVenv.path}' '${PATHS.newTypinatorRule.path}'`,
    "Create new Typinator rule",
  ),
  lastTypinatorRule: cmdEntry(
    `osascript '${PATHS.lastTypinatorRule.path}'`,
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
    `${subCommands.stringThings} quick_date --source cut --dest paste`,
    "Insert today's date in yyyy-mm-dd format at the cursor.",
  ),
  toUpper: cmdEntry(
    `${subCommands.stringThings} uppercase --source clipboard --dest paste`,
    "Convert clipboard to uppercase.",
  ),
  toLower: cmdEntry(
    `${subCommands.stringThings} lower_case --source clipboard --dest paste`,
    "Convert clipboard to lowercase.",
  ),
  toTitle: cmdEntry(
    `${subCommands.stringThings} title_case --source clipboard --dest paste`,
    "Convert clipboard to title case.",
  ),
  wrapQuotes: cmdEntry(
    `${subCommands.stringThings} wrap_quotes --source clipboard --dest paste`,
    "Wrap clipboard in quotes.",
  ),
  wrapSingleQuotes: cmdEntry(
    `${subCommands.stringThings} wrap_single_quotes --source clipboard --dest paste`,
    "Wrap clipboard in single quotes.",
  ),
  wrapParens: cmdEntry(
    `${subCommands.stringThings} wrap_parentheses --source clipboard --dest paste`,
    "Wrap clipboard in parentheses.",
  ),
  wrapBrackets: cmdEntry(
    `${subCommands.stringThings} wrap_brackets --source clipboard --dest paste`,
    "Wrap clipboard in brackets.",
  ),
  wrapBraces: cmdEntry(
    `${subCommands.stringThings} wrap_braces --source clipboard --dest paste`,
    "Wrap clipboard in braces.",
  ),
  wrapAngleBrackets: cmdEntry(
    `${subCommands.stringThings} wrap_angle_brackets --source clipboard --dest paste`,
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
  winMaxToggle: cmdEntry(
    `${subCommands.hsGetDisplayInfo}; local winFrame = win and win:frame() or screenFrame; local positionTolerance = 24; local widthCoverage = screenFrame.w > 0 and (winFrame.w / screenFrame.w) or 0; local heightCoverage = screenFrame.h > 0 and (winFrame.h / screenFrame.h) or 0; local leftAligned = math.abs(winFrame.x - screenFrame.x) <= positionTolerance; local topAligned = math.abs(winFrame.y - screenFrame.y) <= positionTolerance; local isMaximized = leftAligned and topAligned and widthCoverage >= 0.97 and heightCoverage >= 0.9; local url = isMaximized and [[rectangle-pro://execute-action?name=restore]] or [[rectangle-pro://execute-action?name=maximize]]; hs.urlevent.openURL(url)'`,
    "Maximize or restore window",
  ),
};

const Get_Recents = {
  getRecentRaycast: cmdEntry(
    `${subCommands.raycastExt}/jason/recents/recentCustom`,
    "Get recent items from Raycast",
  ),
  getRecentAdditions: cmdEntry(
    `${PATHS.recentDls.path} -a`,
    "Get recent items from script",
  ),
  getRecentMods: cmdEntry(
    `${PATHS.recentDls.path} -m`,
    "Get recent mods from script",
  ),
  getRecentCreations: cmdEntry(
    `${PATHS.recentDls.path} -c`,
    "Get new files from script",
  ),
};

const App_Specific = {
  wordPrint: cmdEntry(
    `${subCommands.getDocxPath} && ${subCommands.callSendKeys} -c "<c:p:command>"`,
    "get file path and print in word",
  ),
};

const Misc_Scripts = {
  ocrToMd: cmdEntry(
    `'${PATHS.binSharedVenv.path}' '${PATHS.scriptsDir.path}/ui/ocrToMd/shot_to_md.py'`,
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
