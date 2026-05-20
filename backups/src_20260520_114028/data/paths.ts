import { HOME_DIR } from "./environment";

export const PATHS = {
  karabinerConfig: `${HOME_DIR}/.config/karabiner/karabiner.json`,
  killAppBin: "~/.local/bin/kill-app",
  openAppBin: "~/.local/bin/open-app",
  recentDownloadsScript: `${HOME_DIR}/Scripts/filesystem/recent_changes/recent_dl.sh`,
  takeActionHereScript: "~/Scripts/active_process/take_action_here/take_action_here.sh",
  textProcessorDir: "~/Scripts/strings/text_processor",
  textProcessorEntrypoint: "interfaces/cli.py",
  textProcessorUvBin: "~/.local/bin/uv",
  typinatorEditLastAppleScript: "~/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.applescript",
  typinatorPythonBin: "~/.venv/typinator/bin/python",
  typinatorNewRuleScript: "~/Scripts/apps/Typinator/new_rule.py",
  wordDocumentPathAppleScript:
    "~/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript",
} as const;
