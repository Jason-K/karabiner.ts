export type FolderOpener = "bloom" | "qspace";

/**
 * Folder/Finder replacement app selection.
 */
export const FOLDER_OPENER: FolderOpener = "bloom";

export const getOpenFolderCommandFor = (
  opener: FolderOpener,
  folderPath: string,
): string => {
  if (opener === "bloom") {
    const escapedPath = folderPath.replace(/ /g, "\\ ");
    return `open -a Bloom ${escapedPath}`;
  }

  return `open -b com.jinghaoshe.qspace.pro '${folderPath}'`;
};

export const getFolderOpenerBundleIdFor = (_opener: FolderOpener): string => {
  return "com.jinghaoshe.qspace.pro";
};

/**
 * Generate an open command for the selected folder opener app.
 */
export const getOpenFolderCommand = (folderPath: string): string => {
  return getOpenFolderCommandFor(FOLDER_OPENER, folderPath);
};

/**
 * Bundle ID used for open_application events.
 */
export const getFolderOpenerBundleId = (): string => {
  return getFolderOpenerBundleIdFor(FOLDER_OPENER);
};
