import { HOME_DIR } from "./environment";

const path = (name: string, refDesc: string) => ({
  type: "path" as const,
  name,
  refDesc,
});

export const pathRegistry = {
  // scripts
  actHereScript: path(
    `${HOME_DIR}/Scripts/active_process/take_action_here/take_action_here.sh`,
    "Take Action Here script",
  ),
  recentDownloadsScript: path(
    `${HOME_DIR}/Scripts/filesystem/recent_changes/recent_dl.sh`,
    "Recent Downloads script",
  ),
  textProcessorEntrypoint: path(
    "interfaces/cli.py",
    "Text Processor entrypoint",
  ),
  typinatorEditLastRule: path(
    `${HOME_DIR}/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion-original.scpt`,
    "Typinator Edit Last Rule script",
  ),
  typinatorNewRuleScript: path(
    `${HOME_DIR}/Scripts/apps/Typinator/new_rule/new_rule.py`,
    "Typinator New Rule script",
  ),
  wordDocumentPathAppleScript: path(
    `${HOME_DIR}/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
    "Get Word Document Path AppleScript",
  ),
  // binaries
  cliclick: path(`/opt/homebrew/bin/cliclick`, "Cliclick binary"),
  hsBridge: path(
    `${HOME_DIR}/Hammer-Console/cli/hammer`,
    "Hammer Console CLI binary",
  ),
  killAppBin: path(`${HOME_DIR}/.local/bin/kill-app`, "Kill App binary"),
  openAppBin: path(`${HOME_DIR}/.local/bin/open-app`, "Open App binary"),
  privCLI: path(
    `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
    "Privileges CLI binary",
  ),
  sendkeys: path(`/opt/homebrew/bin/sendkeys`, "Sendkeys"),
  typinatorPythonBin: path(
    `${HOME_DIR}/.venv/typinator/bin/python`,
    "Typinator Python binary",
  ),
  uvBin: path(`${HOME_DIR}/.local/bin/uv`, "UV binary"),
  // files
  karabinerConfig: path(
    `${HOME_DIR}/.config/karabiner/karabiner.json`,
    "Karabiner configuration file",
  ),
  // directories
  textProcessorDir: path(
    `${HOME_DIR}/Scripts/strings/text_processor`,
    "Text Processor directory",
  ),
} as const;

export type PathRef = import("./refs").PathRef;

export const PATHS = {
  // scripts
  actHereScript: `${HOME_DIR}/Scripts/active_process/take_action_here/take_action_here.sh`,
  recentDownloadsScript: `${HOME_DIR}/Scripts/filesystem/recent_changes/recent_dl.sh`,
  textProcessorEntrypoint: "interfaces/cli.py",
  typinatorEditLastRule: `${HOME_DIR}/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion-original.scpt`,
  typinatorNewRuleScript: `${HOME_DIR}/Scripts/apps/Typinator/new_rule/new_rule.py`,
  wordDocumentPathAppleScript: `${HOME_DIR}/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
  // binaries
  cliclick: `/opt/homebrew/bin/cliclick`,
  hsBridge: `${HOME_DIR}/Hammer-Console/cli/hammer`,
  killAppBin: `${HOME_DIR}/.local/bin/kill-app`,
  openAppBin: `${HOME_DIR}/.local/bin/open-app`,
  privCLI: `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
  sendkeys: `/opt/homebrew/bin/sendkeys`,
  typinatorPythonBin: `${HOME_DIR}/.venv/typinator/bin/python`,
  uvBin: `${HOME_DIR}/.local/bin/uv`,
  // files
  karabinerConfig: `${HOME_DIR}/.config/karabiner/karabiner.json`,
  // directories
  textProcessorDir: `${HOME_DIR}/Scripts/strings/text_processor`,
} as const;
