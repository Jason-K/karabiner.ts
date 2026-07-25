import { HOME_DIR } from "./environment";

const path = (name: string, refDesc: string) => ({
  type: "path" as const,
  name,
  refDesc,
});

export const Paths = {
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
    "edit last Typinator rule",
  ),
  typinatorNewRuleScript: path(
    `${HOME_DIR}/Scripts/apps/Typinator/new_rule/new_rule.py`,
    "create new Typinator rule",
  ),
  wordDocumentPathAppleScript: path(
    `${HOME_DIR}/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
    "get path to active word document",
  ),
  // binaries
  cliclick: path(`/opt/homebrew/bin/cliclick`, "Cliclick binary"),
  hsBridge: path(`${HOME_DIR}/Hammer-Console/cli/hammer`, "Hammer CLI bin"),
  killAppBin: path(`${HOME_DIR}/.local/bin/kill-app`, "Kill App binary"),
  openAppBin: path(`${HOME_DIR}/.local/bin/open-app`, "Open App binary"),
  privCLI: path(
    `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
    "Privileges binary",
  ),
  hs: path(`/opt/homebrew/bin/hs`, "Hammerspoon binary"),
  sendkeys: path(`/opt/homebrew/bin/sendkeys`, "Sendkeys"),
  typinatorPythonBin: path(
    `${HOME_DIR}/.venv/typinator/bin/python`,
    "python bin for Typinator",
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
