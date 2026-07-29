import type { PathRef } from "./refs";

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a file-system path.
 *  @param name    - absolute file or directory path (e.g. "/opt/homebrew")
 *  @param refDesc - human label used in descriptions
 */
const path = (name: string, refDesc: string) => ({
  type: "path" as const,
  name,
  refDesc,
});

// ---------------------------------------------------------
// Environment helpers (kept at top of registry section)
// ---------------------------------------------------------
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
const BREW_BIN_DIR =
  runtimeProcess.process?.env?.BREW_BIN_DIR ?? `${BREW_DIR}/bin`;
const SCRIPTS_DIR = `${HOME_DIR}/Scripts`;
const DL_DIR = `${HOME_DIR}/Downloads`;
const CHEZMOI_DIR = `${XDG_DATA_HOME}/.chezmoi`;
const ONEDRIVE_WORK = `${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP`;
const ONEDRIVE_PERSONAL = `${HOME_DIR}/Library/CloudStorage/OneDrive-Personal`;

// Paths for export as PATHS.*
// ---------------------------------------------------------

// DIRS
const ENV_DIRS = {
  dirHome: path(`${HOME_DIR}`, "Home directory"),
  dirXdgConfig: path(`${XDG_CONFIG_HOME}`, "XDG Config dir"),
  dirXdgData: path(`${XDG_DATA_HOME}`, "XDG Data dir"),
  dirXdgCache: path(`${XDG_CACHE_HOME}`, "XDG Cache dir"),
  dirXdgBin: path(`${XDG_BIN_HOME}`, "XDG Bin dir"),
  dirXdgState: path(`${XDG_STATE_HOME}`, "XDG State dir"),
  dirZDot: path(`${ZDOTDIR}`, "ZSH home dir"),
  dirChezmoi: path(`${CHEZMOI_DIR}`, "chezmoi"),
  dirBrew: path(`${BREW_DIR}`, "Brew home dir"),
};

const DL_DIRS = {
  dirDls: path(`${DL_DIR}`, "DLs"),
  dirDls3dPrinting: path(
    `${DL_DIR}/3dPrinting`,
    "downloaded 3D models",
  ),
  dirDlsArchives: path(
    `${DL_DIR}/Archives`,
    "downloaded archives",
  ),
  dirDlsInstalls: path(
    `${DL_DIR}/Installs`,
    "downloaded installers",
  ),
  dirDlsOffice: path(`${DL_DIR}/Office`, "work downloads"),
  dirDlsPdfs: path(`${DL_DIR}/PDFs/`, "pdf downloads"),
};

const BIN_DIRS = {
  dirBrewBins: path(`${BREW_BIN_DIR}`, "Brew bins"),
  dirApplications: path("/Applications", "APPS (global)"),
};

const SCRIPTING_DIRS = {
  dirScripts: path(`${SCRIPTS_DIR}`, "Scripts folder"),
  dirTextProcessor: path(
    `${SCRIPTS_DIR}/strings/text_processor`,
    "Text Processor script folder",
  ),
  dirGits: path(`${HOME_DIR}/gits`, "Gits"),
  dirWorkspaces: path(`${HOME_DIR}/Scripts/workspaces`, "VSC workspaces folder"),
};

const CLOUD_DIRS = {
  dirOneDrivePersonal: path(`${ONEDRIVE_PERSONAL}`, "my OneDrive"),
  dirOneDriveWork: path(`${ONEDRIVE_WORK}`, "work OneDrive"),
};

const WORK_DIRS = {
  dirCases: path(
    `${ONEDRIVE_WORK}/Documents/0-myCases`,
    "my cases",
  ),
  dirLibrary: path(
    `${ONEDRIVE_WORK}/Documents/1-firmLibrary`,
    "work library",
  ),
};

const SCRIPT_FILES = {
  scriptHere2There: path(
    `${SCRIPTS_DIR}/active_process/take_action_here/take_action_here.sh`,
    "Here2There script",
  ),
  scriptNewDLs: path(
    `${SCRIPTS_DIR}/filesystem/recent_changes/recent_dl.sh`,
    "Recent Dls script",
  ),
  scriptTextProcessorCLI: path(
    `${SCRIPTS_DIR}/strings/text_processor/interfaces/cli.py`,
    "Text Processor CLI entrypoint",
  ),
  scriptTypinatorLastRule: path(
    `${SCRIPTS_DIR}/apps/Typinator/Edit_Last_Typinator_Expansion.applescript`,
    "edit the last Typinator rule",
  ),
  scriptTypinatorNewRule: path(
    `${SCRIPTS_DIR}/apps/Typinator/new_rule/new_rule.py`,
    "create a new Typinator rule",
  ),
  scriptWordGetDocPath: path(
    `${SCRIPTS_DIR}/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
    "get path to active word document",
  ),
};

const CONFIG_FILES = {
  configKarabiner: path(
    `${XDG_CONFIG_HOME}/karabiner/karabiner.json`,
    "Karabiner configuration file",
  ),
};

const BIN_FILES = {
  binCliClick: path(`${BREW_BIN_DIR}/binCliClick`, "Cliclick binary"),
  binHSBridge: path(`${HOME_DIR}/Hammer-Console/cli/hammer`, "Hammer CLI bin"),
  binAppKill: path(`${XDG_BIN_HOME}/kill-app`, "Kill App binary"),
  binAppOpen: path(`${XDG_BIN_HOME}/open-app`, "Open App binary"),
  binPrivCLI: path(
    `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
    "PrivilegesCLI",
  ),
  binHS: path(`${BREW_BIN_DIR}/hs`, "Hammerspoon binary"),
  binSendKeys: path(`${BREW_BIN_DIR}/SendKeys`, "Sendkeys"),
  binPythonTypinator: path(
    `${HOME_DIR}/.venv/typinator/bin/python`,
    "python bin for Typinator",
  ),
  binUV: path(`${XDG_BIN_HOME}/uv`, "UV binary"),
};

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

export const PATHS = {
  ...ENV_DIRS,
  ...DL_DIRS,
  ...BIN_DIRS,
  ...SCRIPTING_DIRS,
  ...CLOUD_DIRS,
  ...WORK_DIRS,
  ...SCRIPT_FILES,
  ...CONFIG_FILES,
  ...BIN_FILES,
} as const;

export type { PathRef };
