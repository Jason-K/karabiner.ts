export const folderRegistry = {
  applications: "/Applications/",
  cases: "/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/",
  chezmoi: "/Users/jason/.local/share/chezmoi/",
  downloads: "/Users/jason/Downloads/",
  downloads3dPrinting: "/Users/jason/Downloads/3dPrinting",
  downloadsArchives: "/Users/jason/Downloads/Archives",
  downloadsInstalls: "/Users/jason/Downloads/Installs",
  downloadsOffice: "/Users/jason/Downloads/Office",
  downloadsPdfs: "/Users/jason/Downloads/PDFs/",
  gits: "/Users/jason/gits/",
  home: "/Users/jason/",
  library: "/Users/jason/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/",
  scripts: "/Users/jason/Scripts/",
  workspaces: "/Users/jason/Scripts/workspaces/",
} as const;

export type FolderRef = keyof typeof folderRegistry;
