// Get env vars (keep at top)
const runtimeProcess = globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export const HOME_DIR = runtimeProcess.process?.env?.HOME ?? "/Users/jason";
const XDG_CONFIG_HOME =
  runtimeProcess.process?.env?.XDG_CONFIG_HOME ?? `${HOME_DIR}/.config`;
const XDG_DATA_HOME =
  runtimeProcess.process?.env?.XDG_DATA_HOME ?? `${HOME_DIR}/.local/share`;
const XDG_CACHE_HOME =
  runtimeProcess.process?.env?.XDG_CACHE_HOME ?? `${HOME_DIR}/.cache`;
const XDG_BIN_HOME =
  runtimeProcess.process?.env?.XDG_BIN_HOME ?? `${HOME_DIR}/.local/bin`;
const XDG_STATE_HOME =
  runtimeProcess.process?.env?.XDG_STATE_HOME ?? `${HOME_DIR}/.local/state`;
const ZDOTDIR =
  runtimeProcess.process?.env?.ZDOTDIR ?? `${HOME_DIR}/.config/zsh`;
const BREW_DIR = runtimeProcess.process?.env?.BREW_DIR ?? "/opt/homebrew";
const SCRIPTS_DIR = `${HOME_DIR}/Scripts`;
const CHEZMOI_DIR = `${XDG_DATA_HOME}/.chezmoi`;

// varSpec
const path = (name: string, refDesc: string) => ({
  type: "path" as const,
  name,
  refDesc,
});

// Paths for export as PATHS.*

const ENV = {
  dirHome: path(`${HOME_DIR}`, "Home directory"),
  dirXdgConfig: path(`${XDG_CONFIG_HOME}`, "XDG Config dir"),
  dirXdgData: path(`${XDG_DATA_HOME}`, "XDG Data dir"),
  dirXdgCache: path(`${XDG_CACHE_HOME}`, "XDG Cache dir"),
  dirXdgBin: path(`${XDG_BIN_HOME}`, "XDG Bin dir"),
  dirXdgState: path(`${XDG_STATE_HOME}`, "XDG State dir"),
};

const DIRS = {
  dirZDot: path(`${ZDOTDIR}`, "ZSH home dir"),
  dirBrew: path(`${BREW_DIR}`, "Brew home dir"),
  dirScripts: path(`${SCRIPTS_DIR}`, "Scripts home dir"),
  dirChezmoi: path(`${CHEZMOI_DIR}`, "ChezMoi home dir"),
  dirTextProcessor: path(
    `${SCRIPTS_DIR}/strings/text_processor`,
    "Text Processor directory",
  ),
};

const SCRIPTS = {
  scriptHere2There: path(
    `${SCRIPTS_DIR}/active_process/take_action_here/take_action_here.sh`,
    "Take Action Here script",
  ),
  scriptNewDLs: path(
    `${SCRIPTS_DIR}/filesystem/recent_changes/recent_dl.sh`,
    "Recent Downloads script",
  ),
  scriptTextProcessorCLI: path(
    `${SCRIPTS_DIR}/strings/text_processor/interfaces/cli.py`,
    "Text Processor entrypoint",
  ),
  scriptTypinatorLastRule: path(
    `${SCRIPTS_DIR}/apps/Typinator/Edit_Last_Typinator_Expansion.applescript`,
    "edit last Typinator rule",
  ),
  scriptTypinatorNewRule: path(
    `${SCRIPTS_DIR}/apps/Typinator/new_rule/new_rule.py`,
    "create new Typinator rule",
  ),
  scriptWordGetDocPath: path(
    `${SCRIPTS_DIR}/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
    "get path to active word document",
  ),
};

const CONFIGS = {
  configKarabiner: path(
    `${HOME_DIR}/.config/karabiner/karabiner.json`,
    "Karabiner configuration file",
  ),
};

const BINS = {
  binCliClick: path(`${BREW_DIR}/bin/binCliClick`, "Cliclick binary"),
  binHSBridge: path(`${HOME_DIR}/Hammer-Console/cli/hammer`, "Hammer CLI bin"),
  binAppKill: path(`${HOME_DIR}/.local/bin/kill-app`, "Kill App binary"),
  binAppOpen: path(`${HOME_DIR}/.local/bin/open-app`, "Open App binary"),
  binPrivCLI: path(
    `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
    "PrivilegesCLI",
  ),
  binHS: path(`${BREW_DIR}/bin/hs`, "Hammerspoon binary"),
  binSendKeys: path(`${BREW_DIR}/bin/binSendKeys`, "Sendkeys"),
  binPythonTypinator: path(
    `${HOME_DIR}/.venv/typinator/bin/python`,
    "python bin for Typinator",
  ),
  binUV: path(`${HOME_DIR}/.local/bin/uv`, "UV binary"),
};

export const PATHS = {
  ...ENV,
  ...DIRS,
  ...SCRIPTS,
  ...CONFIGS,
  ...BINS,
} as const;

export type PathRef = import("./refs").PathRef;
