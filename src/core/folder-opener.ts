/** Folder-open strategy: a Finder replacement app, or plain Finder. */
export type FolderOpener = "bloom" | "qspace" | "finder";

/**
 * Generate a shell command to open a folder, using the given opener app.
 * Defaults to the system Finder when no opener is specified.
 */
export const getOpenFolderCommand = (
  folderPath: string,
  opener: FolderOpener = "finder",
): string => {
  if (opener === "bloom") {
    const escapedPath = folderPath.replace(/ /g, "\\ ");
    return `open -a Bloom '${escapedPath}'`;
  }
  if (opener === "qspace") {
    return `open -b com.jinghaoshe.qspace.pro '${folderPath}'`;
  }
  return `open '${folderPath}'`;
};
