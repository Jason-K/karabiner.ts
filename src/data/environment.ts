const runtimeProcess = globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export const HOME_DIR = runtimeProcess.process?.env?.HOME ?? "/Users/jason";
export const XDG_CONFIG_HOME = runtimeProcess.process?.env?.XDG_CONFIG_HOME ?? `${HOME_DIR}/.config`;
export const XDG_DATA_HOME = runtimeProcess.process?.env?.XDG_DATA_HOME ?? `${HOME_DIR}/.local/share`;
export const XDG_CACHE_HOME = runtimeProcess.process?.env?.XDG_CACHE_HOME ?? `${HOME_DIR}/.cache`;
export const XDG_BIN_HOME = runtimeProcess.process?.env?.XDG_BIN_HOME ?? `${HOME_DIR}/.local/bin`;
export const XDG_STATE_HOME = runtimeProcess.process?.env?.XDG_STATE_HOME ?? `${HOME_DIR}/.local/state`;
export const ZDOTDIR = runtimeProcess.process?.env?.ZDOTDIR ?? `${HOME_DIR}/.config/zsh`;
export const BREW_DIR = runtimeProcess.process?.env?.BREW_DIR ?? "/opt/homebrew";

export const SCRIPTS_DIR = `${HOME_DIR}/Scripts`;
export const CHEZMOI_DIR = `${XDG_DATA_HOME}/.chezmoi`;
