export const raycastRegistry = {
  hereToThereActiveToTarget: "Jason/here-to-there/activeToTarget",
  recentApplications: "jason/recents/recentApplications",
  recentCustom: "jason/recents/recentCustom",
  recentDownloads: "jason/recents/recentDownloads",
  recentFiles: "jason/recents/recents",
  recentFolders: "jason/recents/recentFolders",
  spotifySearch: "mattisssa/spotify-player/search",
  zoxideSearchDirectories: "mrpunkin/raycast-zoxide/search-directories",
} as const;

export type RaycastRef = keyof typeof raycastRegistry;
