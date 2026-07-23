const r = (name: string, refDesc: string) => ({
  type: "raycast" as const,
  name,
  refDesc,
});

export const raycastRegistry = {
  clipboardHistory: r("raycast/clipboard-history/clipboard-history", "Clipboard history"),
  hereToThereActiveToTarget: r(
    "Jason/here-to-there/activeToTarget",
    "Here2There (active to target)",
  ),
  recentApplications: r("jason/recents/recentApplications", "Recent applications"),
  recentCustom: r("jason/recents/recentCustom", "Recent custom"),
  recentDownloads: r("jason/recents/recentDownloads", "Recent downloads"),
  recentFiles: r("jason/recents/recents", "Recent files"),
  recentFolders: r("jason/recents/recentFolders", "Recent folders"),
  spotifySearch: r("mattisssa/spotify-player/search", "Spotify search"),
  zoxideSearchDirectories: r(
    "mrpunkin/raycast-zoxide/search-directories",
    "zoxide search directories",
  ),
} as const;

export type RaycastRef = import("./refs").RaycastRef;
