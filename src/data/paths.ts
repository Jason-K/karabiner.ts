import { HOME_DIR } from "./environment";

export const PATHS = {
  actHereScript: `${HOME_DIR}/Scripts/active_process/take_action_here/take_action_here.sh`,
  karabinerConfig: `${HOME_DIR}/.config/karabiner/karabiner.json`,
  killAppBin: `${HOME_DIR}/.local/bin/kill-app`,
  openAppBin: `${HOME_DIR}/.local/bin/open-app`,
  recentDownloadsScript: `${HOME_DIR}/Scripts/filesystem/recent_changes/recent_dl.sh`,
  textProcessorDir: `${HOME_DIR}/Scripts/strings/text_processor`,
  textProcessorEntrypoint: "interfaces/cli.py",
  typinatorEditLastRule: `${HOME_DIR}/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion-original.scpt`,
  typinatorNewRuleScript: `${HOME_DIR}/Scripts/apps/Typinator/new_rule/new_rule.py`,
  typinatorPythonBin: `${HOME_DIR}/.venv/typinator/bin/python`,
  uvBin: `${HOME_DIR}/.local/bin/uv`,
  wordDocumentPathAppleScript: `${HOME_DIR}/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
} as const;
