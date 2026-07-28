import { PATHS } from "./paths";
import { TIMINGS } from "./timings";

const cmdEntry = (name: string, refDesc: string) => ({
  type: "command" as const,
  name,
  refDesc,
});

const subCommands = {
  // PRIVILEGES
  revokePriv: `${PATHS.privCLI.name} -r`,
  addPriv: `${PATHS.privCLI.name} -a`,

  // UTILITIES
  callSendKeys: `${PATHS.sendkeys.name} --initial-delay 0 --delay 0.005`,

  // SCRIPTS
  getWordDocPath: `osascript '${PATHS.wordDocumentPathAppleScript.name}'`,

  // HAMMERSPOON
  callHammerspoon: `${PATHS.hs.name} -c`,
  hsQueryScreenOrientation: `local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local frame = screen:frame(); local url = (frame.w >= frame.h)`,
  hsGetWinScreenData: `${PATHS.hs.name} -c 'local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local screenFrame = screen:frame()`,

  // TEXT PROCESSOR
  callTextProcessor: `${PATHS.uvBin.name} --directory ${PATHS.textProcessorDir.name} run python ${PATHS.textProcessorEntrypoint.name}`,
};

export const CMDS = {
  // PASSWORDS AND PRIVILEGES
  getPrivileges: cmdEntry(
    `${subCommands.revokePriv} && ${subCommands.addPriv} && sleep ${TIMINGS.privDelaySec}`,
    "Get privileges",
  ),
  fillPassword: cmdEntry(
    `${subCommands.revokePriv} && sleep ${TIMINGS.privDelaySec} && ${subCommands.addPriv} && sleep ${TIMINGS.privDelaySec} && ${subCommands.callSendKeys} --characters "<c:/:command,option,control>"`,
    "Fill password",
  ),
  fillUsernameAndPassword: cmdEntry(
    `${subCommands.revokePriv} && ${subCommands.addPriv} && sleep 0.1 && ${subCommands.callSendKeys} --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`,
    "Fill username and password",
  ),
  getWordDocPathAndPrivileges: cmdEntry(
    `${subCommands.getWordDocPath} && sleep ${TIMINGS.privDelaySec} && ${subCommands.revokePriv} && ${subCommands.addPriv} && sleep ${TIMINGS.privDelaySec} && ${subCommands.callSendKeys} --characters "<c:/:command,option,control>"`,
    "Get privileges and path to active Word document",
  ),

  // KILL APPS
  killForegroundApp: cmdEntry(
    `${PATHS.killAppBin.name} --foreground`,
    "Kill foreground application",
  ),
  killAllApps: cmdEntry(
    `${PATHS.killAppBin.name} --all`,
    "Kill all applications",
  ),

  // HAMMERSPOON
  hsFormatSelection: cmdEntry(
    `${subCommands.callHammerspoon} 'FormatSelection()'`,
    "Format selection using hsStringEval",
  ),
  hsFormatCutSeed: cmdEntry(
    `${subCommands.callHammerspoon} 'FormatCutSeed()'`,
    "Format substrings within selection",
  ),

  // TYPINATOR
  typinatorNewRule: cmdEntry(
    `${PATHS.typinatorPythonBin.name} ${PATHS.typinatorNewRuleScript.name}`,
    "Create new Typinator rule",
  ),
  typinatorEditLastRule: cmdEntry(
    `osascript '${PATHS.typinatorEditLastRule.name}'`,
    "Edit last Typinator expansion",
  ),

  // SPOTIFY
  spotifyToggle: cmdEntry(
    "if pgrep -x 'Spotify' > /dev/null; then open 'raycast://extensions/mattisssa/spotify-player/togglePlayPause'; else ~/.local/bin/open-app -b 'com.spotify.client'; fi; echo 'Spotify toggled'",
    "open Spotify or toggle play/pause",
  ),

  // STRING EVALUATION
  tpQuickDate: cmdEntry(
    `${subCommands.callTextProcessor} quick_date --source clipboard --dest paste`,
    "Insert today's date in yyyy-mm-dd format at the cursor.",
  ),

  // WINDOW NAVIGATION AND MOVEMENT
  winRightOrBottom: cmdEntry(
    `${subCommands.hsGetWinScreenData}; local url = (screenFrame.w >= screenFrame.h) and [[rectangle-pro://execute-action?name=right-half]] or [[rectangle-pro://execute-action?name=bottom-half]]; hs.urlevent.openURL(url)'`,
    "Move window to right or bottom half",
  ),
  winLeftOrTop: cmdEntry(
    `${subCommands.hsGetWinScreenData}; local url = (screenFrame.w >= screenFrame.h) and [[rectangle-pro://execute-action?name=left-half]] or [[rectangle-pro://execute-action?name=top-half]]; hs.urlevent.openURL(url)'`,
    "Move window to left or top half",
  ),
  winMaxOrRestore: cmdEntry(
    `${subCommands.hsGetWinScreenData}; local winFrame = win and win:frame() or screenFrame; local positionTolerance = 24; local widthCoverage = screenFrame.w > 0 and (winFrame.w / screenFrame.w) or 0; local heightCoverage = screenFrame.h > 0 and (winFrame.h / screenFrame.h) or 0; local leftAligned = math.abs(winFrame.x - screenFrame.x) <= positionTolerance; local topAligned = math.abs(winFrame.y - screenFrame.y) <= positionTolerance; local isMaximized = leftAligned and topAligned and widthCoverage >= 0.97 and heightCoverage >= 0.9; local url = isMaximized and [[rectangle-pro://execute-action?name=restore]] or [[rectangle-pro://execute-action?name=maximize]]; hs.urlevent.openURL(url)'`,
    "Maximize or restore window",
  ),
} as const;

export type CommandRef = import("./refs").CommandRef;
