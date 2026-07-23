import { HOME_DIR } from "./environment";

const folder = (name: string, refDesc: string) => ({
  type: "folder" as const,
  name,
  refDesc,
});

export const folderRegistry = {
  applications: folder("/Applications/", "Applications"),
  cases: folder(
    `${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/`,
    "Cases",
  ),
  chezmoi: folder(`${HOME_DIR}/.local/share/chezmoi/`, "chezmoi"),
  dotConfig: folder(`${HOME_DIR}/.config/`, "~/.config"),
  dotLocal: folder(`${HOME_DIR}/.local/`, "~/.local"),
  dotBin: folder(`${HOME_DIR}/.local/bin/`, "~/.local/bin"),
  dotState: folder(`${HOME_DIR}/.local/state/`, "~/.local/state"),
  downloads: folder(`${HOME_DIR}/Downloads/`, "Downloads"),
  downloads3dPrinting: folder(`${HOME_DIR}/Downloads/3dPrinting`, "3D Printing downloads"),
  downloadsArchives: folder(`${HOME_DIR}/Downloads/Archives`, "Archives"),
  downloadsInstalls: folder(`${HOME_DIR}/Downloads/Installs`, "Installs"),
  downloadsOffice: folder(`${HOME_DIR}/Downloads/Office`, "Office downloads"),
  downloadsPdfs: folder(`${HOME_DIR}/Downloads/PDFs/`, "PDFs"),
  gits: folder(`${HOME_DIR}/gits/`, "~/gits"),
  home: folder(`${HOME_DIR}/`, "Home"),
  library: folder(
    `${HOME_DIR}/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/`,
    "Library",
  ),
  scripts: folder(`${HOME_DIR}/Scripts/`, "~/Scripts"),
  workspaces: folder(`${HOME_DIR}/Scripts/workspaces/`, "Workspaces"),
} as const;

export type FolderRef = import("./refs").FolderRef;
