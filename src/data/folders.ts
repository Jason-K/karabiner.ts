import { HOME_DIR } from "./environment";

const folder = (name: string, refDesc: string) => ({
  type: "folder" as const,
  name,
  refDesc,
});

export const Folders = {
  applications: folder("/Applications/", "Apps (global)"),
  cases: folder(
    `${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/0-myCases/`,
    "My Cases",
  ),
  chezmoi: folder(`${HOME_DIR}/.local/share/chezmoi/`, "chezmoi"),
  dotConfig: folder(`${HOME_DIR}/.config/`, ".config"),
  dotLocal: folder(`${HOME_DIR}/.local/`, ".local"),
  dotBin: folder(`${HOME_DIR}/.local/bin/`, ".bin"),
  dotState: folder(`${HOME_DIR}/.local/state/`, ".state"),
  downloads: folder(`${HOME_DIR}/Downloads/`, "D/Ls"),
  downloads3dPrinting: folder(
    `${HOME_DIR}/Downloads/3dPrinting`,
    "D/Ls - 3d printing",
  ),
  downloadsArchives: folder(
    `${HOME_DIR}/Downloads/Archives`,
    "D/Ls - Archives",
  ),
  downloadsInstalls: folder(
    `${HOME_DIR}/Downloads/Installs`,
    "D/Ls - Installs",
  ),
  downloadsOffice: folder(`${HOME_DIR}/Downloads/Office`, "D/Ls - work"),
  downloadsPdfs: folder(`${HOME_DIR}/Downloads/PDFs/`, "D/Ls - PDFs"),
  gits: folder(`${HOME_DIR}/gits/`, "Gits"),
  home: folder(`${HOME_DIR}/`, "Home"),
  library: folder(
    `${HOME_DIR}/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/`,
    "My Library",
  ),
  scripts: folder(`${HOME_DIR}/Scripts/`, "Scripts"),
  workspaces: folder(`${HOME_DIR}/Scripts/workspaces/`, "Workspaces"),
} as const;

export type FolderRef = import("./refs").FolderRef;
