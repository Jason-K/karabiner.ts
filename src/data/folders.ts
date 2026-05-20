import { HOME_DIR } from "./environment";

export const folderRegistry = {
	applications: "/Applications/",
	cases: `${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/`,
	chezmoi: `${HOME_DIR}/.local/share/chezmoi/`,
	downloads: `${HOME_DIR}/Downloads/`,
	downloads3dPrinting: `${HOME_DIR}/Downloads/3dPrinting`,
	downloadsArchives: `${HOME_DIR}/Downloads/Archives`,
	downloadsInstalls: `${HOME_DIR}/Downloads/Installs`,
	downloadsOffice: `${HOME_DIR}/Downloads/Office`,
	downloadsPdfs: `${HOME_DIR}/Downloads/PDFs/`,
	gits: `${HOME_DIR}/gits/`,
	home: `${HOME_DIR}/`,
	library: `${HOME_DIR}/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/`,
	scripts: `${HOME_DIR}/Scripts/`,
	workspaces: `${HOME_DIR}/Scripts/workspaces/`,
} as const;

export type FolderRef = keyof typeof folderRegistry;
