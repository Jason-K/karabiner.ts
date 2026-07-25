const url = (name: string, refDesc: string) => ({
  type: "url" as const,
  name,
  refDesc,
});

export const Urls = {
  // Raycast URLs
  rayClipboard: url(
    "raycast-x://extensions/raycast/clipboard-history/clipboard-history",
    "open Raycast clipboard manager",
  ),
  rayHere2There: url(
    "raycast-x://extensions/Jason/here-to-there/activeToTarget",
    "Here2There",
  ),
  rayRecentApps: url(
    "raycast-x://extensions/jason/recents/recentApplications",
    "Recent applications",
  ),
  rayRecentCustom: url(
    "raycast-x://extensions/jason/recents/recentCustom",
    "Recent custom",
  ),
  rayRecentDownloads: url(
    "raycast-x://extensions/jason/recents/recentDownloads",
    "Recent downloads",
  ),
  rayRecentFiles: url(
    "raycast-x://extensions/jason/recents/recents",
    "Recent files",
  ),
  rayRecentFolders: url(
    "raycast-x://extensions/jason/recents/recentFolders",
    "Recent folders",
  ),
  raySpotifyPlayPause: url(
    "raycast-x://extensions/mattisssa/spotify-player/togglePlayPause",
    "Spotify play/pause",
  ),
  raySpotifySearch: url(
    "raycast-x://extensions/mattisssa/spotify-player/search",
    "Spotify search",
  ),
  rayZoxideSearchDirs: url(
    "raycast-x://extensions/mrpunkin/raycast-zoxide/search-directories",
    "zoxide search directories",
  ),
  // Rectangle URLs
  rectAppLeftHalf: url(
    "rectangle-pro://execute-action?name=app-left-half",
    "App to ◧",
  ),
  rectAppNextDisplay: url(
    "rectangle-pro://execute-action?name=app-next-display",
    "App to display →",
  ),
  rectAppPrevDisplay: url(
    "rectangle-pro://execute-action?name=app-prev-display",
    "App to display ←",
  ),
  rectAppRightHalf: url(
    "rectangle-pro://execute-action?name=app-right-half",
    "App to ◨",
  ),
  rectCascadeAll: url(
    "rectangle-pro://execute-action?name=cascade-all",
    "Cascade all windows",
  ),
  rectCascadeApp: url(
    "rectangle-pro://execute-action?name=cascade-app",
    "Cascade app windows",
  ),
  rectCenterHalf: url(
    "rectangle-pro://execute-action?name=center-half",
    "Window center 1/2",
  ),
  rectCycleStashed: url(
    "rectangle-pro://execute-action?name=cycle-stashed",
    "Cycle stashed windows",
  ),
  rectDisplayNext: url(
    "rectangle-pro://execute-action?name=next-display",
    "Display →",
  ),
  rectDisplayPrev: url(
    "rectangle-pro://execute-action?name=previous-display",
    "Display ←",
  ),
  rectFullscreen: url(
    "rectangle-pro://execute-action?name=fullscreen",
    "Fullscreen",
  ),
  rectHideApp: url("rectangle-pro://execute-action?name=hide-app", "Hide app"),
  rectSpaceNext: url(
    "rectangle-pro://execute-action?name=next-space",
    "Space →",
  ),
  rectSpacePrev: url(
    "rectangle-pro://execute-action?name=prev-space",
    "Last space",
  ),
  rectWinBottomHalf: url(
    "rectangle-pro://execute-action?name=bottom-half",
    "Window to ⬓",
  ),
  rectWinBottomLeft: url(
    "rectangle-pro://execute-action?name=bottom-left",
    "Window ◱",
  ),
  rectWinBottomLeftSixth: url(
    "rectangle-pro://execute-action?name=bottom-left-sixth",
    "Window ↓← 1/6",
  ),
  rectWinBottomLeftThird: url(
    "rectangle-pro://execute-action?name=bottom-left-third",
    "Window ↓← 1/3",
  ),
  rectWinBottomRight: url(
    "rectangle-pro://execute-action?name=bottom-right",
    "Window ◲",
  ),
  rectWinBottomRightSixth: url(
    "rectangle-pro://execute-action?name=bottom-right-sixth",
    "Window ↓→ 1/6",
  ),
  rectWinBottomRightThird: url(
    "rectangle-pro://execute-action?name=bottom-right-third",
    "Window ↓→ 1/3",
  ),
  rectWinCenter: url(
    "rectangle-pro://execute-action?name=center",
    "Center window",
  ),
  rectWinCenterThird: url(
    "rectangle-pro://execute-action?name=center-third",
    "Window center 1/3",
  ),
  rectWinCenterTwoThirds: url(
    "rectangle-pro://execute-action?name=center-two-thirds",
    "Window center 2/3",
  ),
  rectWinClose: url(
    "rectangle-pro://execute-action?name=close",
    "Close window",
  ),
  rectWinFillBottomLeft: url(
    "rectangle-pro://execute-action?name=fill-bottom-left",
    "Window fill ◲",
  ),
  rectWinFillBottomRight: url(
    "rectangle-pro://execute-action?name=fill-bottom-right",
    "Window fill ◲",
  ),
  rectWinFillLeft: url(
    "rectangle-pro://execute-action?name=fill-left",
    "Window fill ←",
  ),
  rectWinFillRight: url(
    "rectangle-pro://execute-action?name=fill-right",
    "Window fill →",
  ),
  rectWinFillTopLeft: url(
    "rectangle-pro://execute-action?name=fill-top-left",
    "Window fill ◰",
  ),
  rectWinFillTopRight: url(
    "rectangle-pro://execute-action?name=fill-top-right",
    "Window fill ◱",
  ),
  rectWinFirstFourth: url(
    "rectangle-pro://execute-action?name=first-fourth",
    "Window to ◰",
  ),
  rectWinFirstSixth: url(
    "rectangle-pro://execute-action?name=first-sixth",
    "Window first 1/6",
  ),
  rectWinFirstThird: url(
    "rectangle-pro://execute-action?name=first-third",
    "Window first 1/3",
  ),
  rectWinFirstThreeFourths: url(
    "rectangle-pro://execute-action?name=first-three-fourths",
    "Window first 3/4",
  ),
  rectWinFirstTwoThirds: url(
    "rectangle-pro://execute-action?name=first-two-thirds",
    "Window first 2/3",
  ),
  rectWinLarger: url(
    "rectangle-pro://execute-action?name=larger",
    "Make window larger",
  ),
  rectWinLast: url(
    "rectangle-pro://execute-action?name=last",
    "Go to last window",
  ),
  rectWinLastFourth: url(
    "rectangle-pro://execute-action?name=last-fourth",
    "Window ◲",
  ),
  rectWinLastSixth: url(
    "rectangle-pro://execute-action?name=last-sixth",
    "Window last 1/6",
  ),
  rectWinLastThird: url(
    "rectangle-pro://execute-action?name=last-third",
    "Window last 1/3",
  ),
  rectWinLastThreeFourths: url(
    "rectangle-pro://execute-action?name=last-three-fourths",
    "Window last 3/4",
  ),
  rectWinLastTwoThirds: url(
    "rectangle-pro://execute-action?name=last-two-thirds",
    "Window last 2/3",
  ),
  rectWinLeftHalf: url(
    "rectangle-pro://execute-action?name=left-half",
    "Window ◨",
  ),
  rectWinMaximize: url(
    "rectangle-pro://execute-action?name=maximize",
    "Window ✥",
  ),
  rectWinMaximizeHeight: url(
    "rectangle-pro://execute-action?name=maximize-height",
    "Max window height",
  ),
  rectWinMinimize: url(
    "rectangle-pro://execute-action?name=minimize",
    "Window ⇣",
  ),
  rectWinMoveDown: url(
    "rectangle-pro://execute-action?name=move-down",
    "Move window ↓",
  ),
  rectWinMoveLeft: url(
    "rectangle-pro://execute-action?name=move-left",
    "Move window ←",
  ),
  rectWinMoveRight: url(
    "rectangle-pro://execute-action?name=move-right",
    "Move window →",
  ),
  rectWinMoveUp: url(
    "rectangle-pro://execute-action?name=move-up",
    "Move window ↑",
  ),
  rectWinNudgeDown: url(
    "rectangle-pro://execute-action?name=nudge-down",
    "Nudge window ↓",
  ),
  rectWinNudgeLeft: url(
    "rectangle-pro://execute-action?name=nudge-left",
    "Nudge window ←",
  ),
  rectWinNudgeRight: url(
    "rectangle-pro://execute-action?name=nudge-right",
    "Nudge window →",
  ),
  rectWinNudgeUp: url(
    "rectangle-pro://execute-action?name=nudge-up",
    "Nudge window ↑",
  ),
  rectWinPin: url("rectangle-pro://execute-action?name=pin", "Pin window"),
  rectWinRestore: url(
    "rectangle-pro://execute-action?name=restore",
    "Restore window",
  ),
  rectWinRightHalf: url(
    "rectangle-pro://execute-action?name=right-half",
    "Window ◧",
  ),
  rectWinSecondFourth: url(
    "rectangle-pro://execute-action?name=second-fourth",
    "Window ◳",
  ),
  rectWinSmaller: url(
    "rectangle-pro://execute-action?name=smaller",
    "Make window smaller",
  ),
  rectWinSnapBottomLeft: url(
    "rectangle-pro://execute-action?name=snap-bottom-left",
    "Snap window ◱",
  ),
  rectWinSnapBottomRight: url(
    "rectangle-pro://execute-action?name=snap-bottom-right",
    "Snap window to ◲",
  ),
  rectWinSnapTopLeft: url(
    "rectangle-pro://execute-action?name=snap-top-left",
    "Snap window to ◰",
  ),
  rectWinSnapTopRight: url(
    "rectangle-pro://execute-action?name=snap-top-right",
    "Snap window to ◳",
  ),
  rectWinsReflowPin: url(
    "rectangle-pro://execute-action?name=reflow-pin",
    "Reflow pin",
  ),
  rectWinsStashAllButFront: url(
    "rectangle-pro://execute-action?name=stash-all-but-front",
    "Stash all but front",
  ),
  rectWinStashAll: url(
    "rectangle-pro://execute-action?name=stash-all",
    "Stash all",
  ),
  rectWinStashDown: url(
    "rectangle-pro://execute-action?name=stash-down",
    "Stash ↓",
  ),
  rectWinStashLeft: url(
    "rectangle-pro://execute-action?name=stash-left",
    "Stash ←",
  ),
  rectWinStashRight: url(
    "rectangle-pro://execute-action?name=stash-right",
    "Stash →",
  ),
  rectWinStashUp: url(
    "rectangle-pro://execute-action?name=stash-up",
    "Stash ↑",
  ),
  rectWinsTile2x2: url("rectangle-pro://execute-action?name=tile2x2", "Tile ⊞"),
  rectWinsTile2x3: url(
    "rectangle-pro://execute-action?name=tile2x3",
    "Tile 2x3",
  ),
  rectWinsToggleStashed: url(
    "rectangle-pro://execute-action?name=toggle-stashed",
    "Toggle stashed",
  ),
  rectWinsUnstash: url(
    "rectangle-pro://execute-action?name=unstash",
    "Unstash",
  ),
  rectWinsUnstashAll: url(
    "rectangle-pro://execute-action?name=unstash-all",
    "Unstash all",
  ),
  rectWinThirdFourth: url(
    "rectangle-pro://execute-action?name=third-fourth",
    "Window to ◳",
  ),
  rectWinTopCenterSixth: url(
    "rectangle-pro://execute-action?name=top-center-sixth",
    "Window to top center 1/6",
  ),
  rectWinTopHalf: url(
    "rectangle-pro://execute-action?name=top-half",
    "Window ⬒",
  ),
  rectWinTopLeft: url(
    "rectangle-pro://execute-action?name=top-left",
    "Window to ◰",
  ),
  rectWinTopLeftSixth: url(
    "rectangle-pro://execute-action?name=top-left-sixth",
    "Window to ↑← 1/6",
  ),
  rectWinTopLeftThird: url(
    "rectangle-pro://execute-action?name=top-left-third",
    "Window to ↑← 1/3",
  ),
  rectWinTopRight: url(
    "rectangle-pro://execute-action?name=top-right",
    "Window to ◳",
  ),
  rectWinTopRightSixth: url(
    "rectangle-pro://execute-action?name=top-right-sixth",
    "Window to ↑→ 1/6",
  ),
  rectWinTopRightThird: url(
    "rectangle-pro://execute-action?name=top-right-third",
    "Window to ↑→ 1/3",
  ),
  rectWinUpperCenter: url(
    "rectangle-pro://execute-action?name=upper-center",
    "Window to upper center",
  ),
  rectWinBottomRightEighth: url(
    "rectangle-pro://execute-action?name=bottom-right-eighth",
    "Window to bottom right 1/8",
  ),
  rectWinBottomLeftEighth: url(
    "rectangle-pro://execute-action?name=bottom-left-eighth",
    "Window to bottom left 1/8",
  ),
  rectWinTopRightEighth: url(
    "rectangle-pro://execute-action?name=top-right-eighth",
    "Window to top right 1/8",
  ),
  rectWinTopLeftEighth: url(
    "rectangle-pro://execute-action?name=top-left-eighth",
    "Window to top left 1/8",
  ),
  // CleanShot URLs
  csxCaptureArea: url("cleanshot://capture-area", "Capture area"),
  csxCaptureFullscreen: url("cleanshot://capture-fullscreen", "Capture fullscreen"),
  csxCaptureTextNoLinebreaks: url(
    "cleanshot://capture-text?linebreaks=false",
    "Capture text (no line breaks)",
  ),
  csxCaptureWindow: url("cleanshot://capture-window", "Capture window"),
  csxRecordScreen: url("cleanshot://record-screen", "Record screen"),
};

export type UrlRef = import("./refs").UrlRef;

