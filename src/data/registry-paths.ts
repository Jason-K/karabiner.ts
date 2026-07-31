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

// Paths for export as PATHS.*
// ---------------------------------------------------------

// DIRS
const ENV_DIRS = {
  dirHome: path(`${HOME_DIR}`, "Home directory"),
  dirXdgConfig: path(`${runtimeProcess.process?.env?.XDG_CONFIG_HOME ?? `${HOME_DIR}/.config`}`, "XDG Config dir"),
  dirXdgData: path(`${runtimeProcess.process?.env?.XDG_DATA_HOME ?? `${HOME_DIR}/.local/share`}`, "XDG Data dir"),
  dirXdgCache: path(`${runtimeProcess.process?.env?.XDG_CACHE_HOME ?? `${HOME_DIR}/.cache`}`, "XDG Cache dir"),
  dirXdgBin: path(`${runtimeProcess.process?.env?.XDG_BIN_HOME ?? `${HOME_DIR}/.local/bin`}`, "XDG Bin dir"),
  dirXdgState: path(`${runtimeProcess.process?.env?.XDG_STATE_HOME ?? `${HOME_DIR}/.local/state`}`, "XDG State dir"),
  dirZDot: path(`${runtimeProcess.process?.env?.ZDOTDIR ?? `${HOME_DIR}/.config/zsh`}`, "ZSH home dir"),
  dirChezmoi: path(`${HOME_DIR}/.local/share/chezmoi`, "chezmoi"),
  dirBrew: path(`/opt/homebrew`, "Brew home dir"),
  dirScripts: path(`${HOME_DIR}/Scripts`, "Scripts folder"),
  dirDls: path(`${HOME_DIR}/Downloads`, "DLs"),
  dirDocuments: path(`${HOME_DIR}/Documents`, "Documents folder"),
  dirGApps: path(`/Applications`, "Global applications folder"),
  dirUApps: path(`${HOME_DIR}/Applications`, "User applications folder"),
  cloudWorkOneDrive: path(`${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP`, "work OneDrive"),
  cloudMyOneDrive: path(`${HOME_DIR}/Library/CloudStorage/OneDrive-Personal`, "my OneDrive"),
  venvShared: path(`${HOME_DIR}/Scripts/.venv/shared_venv`, "shared venv"),
  venvTypinator: path(`${HOME_DIR}/.venv/typinator`, "Typinator venv"),
};

const DL_DIRS = {
  dirDls3dPrinting: path(
    `${ENV_DIRS.dirDls.name}/3dPrinting`,
    "downloaded 3D models",
  ),
  dirDlsArchives: path(
    `${ENV_DIRS.dirDls.name}/Archives`,
    "downloaded archives",
  ),
  dirDlsInstalls: path(
    `${ENV_DIRS.dirDls.name}/Installs`,
    "downloaded installers",
  ),
  dirDlsOffice: path(`${ENV_DIRS.dirDls.name}/Office`, "work downloads"),
  dirDlsPdfs: path(`${ENV_DIRS.dirDls.name}/PDFs/`, "pdf downloads"),
};

const BIN_DIRS = {
  dirBrewBins: path(`${ENV_DIRS.dirBrew.name}/bin`, "Brew bins"),
};

const SCRIPT_DIR = {
  dirTextProcessor: path(
    `${ENV_DIRS.dirScripts.name}/strings/text_processor`,
    "Text Processor script folder",
  ),
  dirGits: path(`${HOME_DIR}/gits`, "Gits"),
  dirWorkspaces: path(`${HOME_DIR}/Scripts/workspaces`, "VSC workspaces folder"),
};

const WORK_DIRS = {
  dirCases: path(
    `${ENV_DIRS.cloudWorkOneDrive.name}/Documents/0-myCases`,
    "my cases",
  ),
  dirLibrary: path(
    `${ENV_DIRS.cloudWorkOneDrive.name}/Documents/1-firmLibrary`,
    "work library",
  ),
};

const SCRIPT_FILES = {
  scriptHere2There: path(
    `${ENV_DIRS.dirScripts.name}/active_process/take_action_here/take_action_here.sh`,
    "Here2There script",
  ),
  scriptNewDLs: path(
    `${ENV_DIRS.dirScripts.name}/filesystem/recent_changes/recent_dl.sh`,
    "Recent Dls script",
  ),
  scriptTextProcessorCLI: path(
    `${ENV_DIRS.dirScripts.name}/strings/text_processor/interfaces/cli.py`,
    "Text Processor CLI entrypoint",
  ),
  scriptTypinatorLastRule: path(
    `${ENV_DIRS.dirScripts.name}/apps/Typinator/Edit_Last_Typinator_Expansion.applescript`,
    "edit the last Typinator rule",
  ),
  scriptTypinatorNewRule: path(
    `${ENV_DIRS.dirScripts.name}/apps/Typinator/new_rule/new_rule.py`,
    "create a new Typinator rule",
  ),
  scriptWordGetDocPath: path(
    `${ENV_DIRS.dirScripts.name}/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript`,
    "get path to active word document",
  ),
};

const CONFIG_FILES = {
  configKarabiner: path(
    `${ENV_DIRS.dirXdgConfig.name}/karabiner/karabiner.json`,
    "Karabiner configuration file",
  ),
};

const BIN_FILES = {
  binCliClick: path(`${ENV_DIRS.dirXdgBin.name}/binCliClick`, "Cliclick binary"),
  binHSBridge: path(`${HOME_DIR}/Hammer-Console/cli/hammer`, "Hammer CLI bin"),
  binAppKill: path(`${ENV_DIRS.dirXdgBin.name}/kill-app`, "Kill App binary"),
  binAppOpen: path(`${ENV_DIRS.dirXdgBin.name}/open-app`, "Open App binary"),
  binPrivCLI: path(
    `/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI`,
    "PrivilegesCLI",
  ),
  binHS: path(`${BIN_DIRS.dirBrewBins.name}/hs`, "Hammerspoon binary"),
  binSendKeys: path(`${BIN_DIRS.dirBrewBins.name}/SendKeys`, "Sendkeys"),
  binSharedVenv: path(`${ENV_DIRS.venvShared.name}/bin/python`, "shared venv python"),
  binTypinatorVenv: path(
    `${ENV_DIRS.venvTypinator.name}/bin/python`,
    "python bin for Typinator",
  ),
  binUV: path(`${ENV_DIRS.dirXdgBin.name}/uv`, "UV binary"),
};

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

export const PATHS = {
  ...ENV_DIRS,
  ...DL_DIRS,
  ...BIN_DIRS,
  ...SCRIPT_DIR,
  ...WORK_DIRS,
  ...SCRIPT_FILES,
  ...CONFIG_FILES,
  ...BIN_FILES,
} as const;

export type { PathRef };
