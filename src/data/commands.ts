import { pathRegistry } from "./paths";
import { TIMINGS } from "./timings";

const cmdEntry = (name: string, refDesc: string) => ({
  type: "command" as const,
  name,
  refDesc,
});

const subCommands = {
  revokePriv: `${pathRegistry.privCLI.name} -r`,
  addPriv: `${pathRegistry.privCLI.name} -a`,
  callSendKeys: `${pathRegistry.sendkeys.name} --initial-delay 0 --delay 0.005`,
  hsQueryScreenOrientation: `local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local frame = screen:frame(); local url = (frame.w >= frame.h)`,
  hsGetWinScreenData: `${pathRegistry.hs.name} -c 'local win = hs.window.focusedWindow(); local screen = (win and win:screen()) or hs.screen.mainScreen(); local screenFrame = screen:frame()`,
};

export const commandRegistry = {
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
  typinatorNewRule: cmdEntry(
    `${pathRegistry.typinatorPythonBin.name} ${pathRegistry.typinatorNewRuleScript.name}`,
    "Create new Typinator rule",
  ),
  typinatorEditLastRule: cmdEntry(
    `osascript '${pathRegistry.typinatorEditLastRule.name}'`,
    "Edit last Typinator expansion",
  ),
} as const;

export type CommandRef = import("./refs").CommandRef;
