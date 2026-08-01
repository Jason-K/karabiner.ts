import type { UrlSpec } from "../primitives/urls";

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a URL action.
 *  @param urlStr   - the URL string to open (e.g. "raycast-x://extensions/...")
 *  @param refDesc  - human label used in descriptions
 *  @param category - optional integration category
 */
const url = (urlStr: string, refDesc: string, category?: string): UrlSpec => ({
  type: "url",
  url: urlStr,
  refDesc,
  ...(category ? { category } : {}),
});

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

const SidenotesUrls = {
  newClientNote: url("sidenotes://add-note-with-text/DATE%3A%20%0ACLIENT%3A%20%0ATOPIC%3A%20%0A%0A", "new client note template")
};

const RaycastUrls = {
  rayClipboard: url(
    "raycast-x://extensions/raycast/clipboard-history/clipboard-history",
    "open Raycast clipboard manager",
    "raycast",
  ),
  rayHere2There: url(
    "raycast-x://extensions/Jason/here-to-there/activeToTarget",
    "call Raycast Here2There",
    "raycast",
  ),
  rayRecentApps: url(
    "raycast-x://extensions/jason/recents/recentApplications",
    "show recent applications",
    "raycast",
  ),
  rayRecentCustom: url(
    "raycast-x://extensions/jason/recents/recentCustom",
    "show recent files",
    "raycast",
  ),
  rayRecentDownloads: url(
    "raycast-x://extensions/jason/recents/recentDownloads",
    "show recent downloads",
    "raycast",
  ),
  rayRecentFiles: url(
    "raycast-x://extensions/jason/recents/recents",
    "show recent files",
    "raycast",
  ),
  rayRecentFolders: url(
    "raycast-x://extensions/jason/recents/recentFolders",
    "show recent folders",
    "raycast",
  ),
  raySpotifyPlayPause: url(
    "raycast-x://extensions/mattisssa/spotify-player/togglePlayPause",
    "toggle Spotify",
    "raycast",
  ),
  raySpotifySearch: url(
    "raycast-x://extensions/mattisssa/spotify-player/search",
    "search Spotify",
    "raycast",
  ),
  rayZoxideSearchDirs: url(
    "raycast-x://extensions/mrpunkin/raycast-zoxide/search-directories",
    "search directories using zoxide",
    "raycast",
  ),
};

const rectangleUrls = {
  rectAppLeftHalf: url(
    "rectangle-pro://execute-action?name=app-left-half",
    "App to ◧",
    "rectangle",
  ),
  rectAppNextDisplay: url(
    "rectangle-pro://execute-action?name=app-next-display",
    "App to display →",
    "rectangle",
  ),
  rectAppPrevDisplay: url(
    "rectangle-pro://execute-action?name=app-prev-display",
    "App to display ←",
    "rectangle",
  ),
  rectAppRightHalf: url(
    "rectangle-pro://execute-action?name=app-right-half",
    "App to ◨",
    "rectangle",
  ),
  rectCascadeAll: url(
    "rectangle-pro://execute-action?name=cascade-all",
    "Cascade all windows",
    "rectangle",
  ),
  rectCascadeApp: url(
    "rectangle-pro://execute-action?name=cascade-app",
    "Cascade app windows",
    "rectangle",
  ),
  rectCenterHalf: url(
    "rectangle-pro://execute-action?name=center-half",
    "Window center 1/2",
    "rectangle",
  ),
  rectCycleStashed: url(
    "rectangle-pro://execute-action?name=cycle-stashed",
    "Cycle stashed windows",
    "rectangle",
  ),
  rectDisplayNext: url(
    "rectangle-pro://execute-action?name=next-display",
    "Display →",
    "rectangle",
  ),
  rectDisplayPrev: url(
    "rectangle-pro://execute-action?name=previous-display",
    "Display ←",
    "rectangle",
  ),
  rectFullscreen: url(
    "rectangle-pro://execute-action?name=fullscreen",
    "Fullscreen",
    "rectangle",
  ),
  rectHideApp: url("rectangle-pro://execute-action?name=hide-app", "Hide app", "rectangle"),
  rectSpaceNext: url(
    "rectangle-pro://execute-action?name=next-space",
    "Space →",
    "rectangle",
  ),
  rectSpacePrev: url(
    "rectangle-pro://execute-action?name=prev-space",
    "Last space",
    "rectangle",
  ),
  winBottomHalf: url(
    "rectangle-pro://execute-action?name=bottom-half",
    "Window to ⬓",
    "rectangle",
  ),
  winBottomLeft: url(
    "rectangle-pro://execute-action?name=bottom-left",
    "Window ◱",
    "rectangle",
  ),
  winBottomLeftSixth: url(
    "rectangle-pro://execute-action?name=bottom-left-sixth",
    "Window ↓← 1/6",
    "rectangle",
  ),
  winBottomLeftThird: url(
    "rectangle-pro://execute-action?name=bottom-left-third",
    "Window ↓← 1/3",
    "rectangle",
  ),
  winBottomRight: url(
    "rectangle-pro://execute-action?name=bottom-right",
    "Window ◲",
    "rectangle",
  ),
  winBottomRightSixth: url(
    "rectangle-pro://execute-action?name=bottom-right-sixth",
    "Window ↓→ 1/6",
    "rectangle",
  ),
  winBottomRightThird: url(
    "rectangle-pro://execute-action?name=bottom-right-third",
    "Window ↓→ 1/3",
    "rectangle",
  ),
  winCenter: url(
    "rectangle-pro://execute-action?name=center",
    "Center window",
    "rectangle",
  ),
  winCenterThird: url(
    "rectangle-pro://execute-action?name=center-third",
    "Window center 1/3",
    "rectangle",
  ),
  winCenterTwoThirds: url(
    "rectangle-pro://execute-action?name=center-two-thirds",
    "Window center 2/3",
    "rectangle",
  ),
  winClose: url(
    "rectangle-pro://execute-action?name=close",
    "Close window",
    "rectangle",
  ),
  winFillBottomLeft: url(
    "rectangle-pro://execute-action?name=fill-bottom-left",
    "Window fill ◲",
    "rectangle",
  ),
  winFillBottomRight: url(
    "rectangle-pro://execute-action?name=fill-bottom-right",
    "Window fill ◲",
    "rectangle",
  ),
  winFillLeft: url(
    "rectangle-pro://execute-action?name=fill-left",
    "Window fill ←",
    "rectangle",
  ),
  winFillRight: url(
    "rectangle-pro://execute-action?name=fill-right",
    "Window fill →",
    "rectangle",
  ),
  winFillTopLeft: url(
    "rectangle-pro://execute-action?name=fill-top-left",
    "Window fill ◰",
    "rectangle",
  ),
  winFillTopRight: url(
    "rectangle-pro://execute-action?name=fill-top-right",
    "Window fill ◱",
    "rectangle",
  ),
  winFirstFourth: url(
    "rectangle-pro://execute-action?name=first-fourth",
    "Window to ◰",
    "rectangle",
  ),
  winFirstSixth: url(
    "rectangle-pro://execute-action?name=first-sixth",
    "Window first 1/6",
    "rectangle",
  ),
  winFirstThird: url(
    "rectangle-pro://execute-action?name=first-third",
    "Window first 1/3",
    "rectangle",
  ),
  winFirstThreeFourths: url(
    "rectangle-pro://execute-action?name=first-three-fourths",
    "Window first 3/4",
    "rectangle",
  ),
  winFirstTwoThirds: url(
    "rectangle-pro://execute-action?name=first-two-thirds",
    "Window first 2/3",
    "rectangle",
  ),
  winLarger: url(
    "rectangle-pro://execute-action?name=larger",
    "Make window larger",
    "rectangle",
  ),
  winLast: url(
    "rectangle-pro://execute-action?name=last",
    "Go to last window",
    "rectangle",
  ),
  winLastFourth: url(
    "rectangle-pro://execute-action?name=last-fourth",
    "Window ◲",
    "rectangle",
  ),
  winLastSixth: url(
    "rectangle-pro://execute-action?name=last-sixth",
    "Window last 1/6",
    "rectangle",
  ),
  winLastThird: url(
    "rectangle-pro://execute-action?name=last-third",
    "Window last 1/3",
    "rectangle",
  ),
  winLastThreeFourths: url(
    "rectangle-pro://execute-action?name=last-three-fourths",
    "Window last 3/4",
    "rectangle",
  ),
  winLastTwoThirds: url(
    "rectangle-pro://execute-action?name=last-two-thirds",
    "Window last 2/3",
    "rectangle",
  ),
  winLeftHalf: url(
    "rectangle-pro://execute-action?name=left-half",
    "Window ◨",
    "rectangle",
  ),
  winMaximize: url(
    "rectangle-pro://execute-action?name=maximize",
    "Window ✥",
    "rectangle",
  ),
  winMaximizeHeight: url(
    "rectangle-pro://execute-action?name=maximize-height",
    "Max window height",
    "rectangle",
  ),
  winMinimize: url(
    "rectangle-pro://execute-action?name=minimize",
    "Window ⇣",
    "rectangle",
  ),
  winMoveDown: url(
    "rectangle-pro://execute-action?name=move-down",
    "Move window ↓",
    "rectangle",
  ),
  winMoveLeft: url(
    "rectangle-pro://execute-action?name=move-left",
    "Move window ←",
    "rectangle",
  ),
  winMoveRight: url(
    "rectangle-pro://execute-action?name=move-right",
    "Move window →",
    "rectangle",
  ),
  winMoveUp: url(
    "rectangle-pro://execute-action?name=move-up",
    "Move window ↑",
    "rectangle",
  ),
  winNudgeDown: url(
    "rectangle-pro://execute-action?name=nudge-down",
    "Nudge window ↓",
    "rectangle",
  ),
  winNudgeLeft: url(
    "rectangle-pro://execute-action?name=nudge-left",
    "Nudge window ←",
    "rectangle",
  ),
  winNudgeRight: url(
    "rectangle-pro://execute-action?name=nudge-right",
    "Nudge window →",
    "rectangle",
  ),
  winNudgeUp: url(
    "rectangle-pro://execute-action?name=nudge-up",
    "Nudge window ↑",
    "rectangle",
  ),
  winPin: url("rectangle-pro://execute-action?name=pin", "Pin window", "rectangle"),
  winRestore: url(
    "rectangle-pro://execute-action?name=restore",
    "Restore window",
    "rectangle",
  ),
  winRightHalf: url(
    "rectangle-pro://execute-action?name=right-half",
    "Window ◧",
    "rectangle",
  ),
  winSecondFourth: url(
    "rectangle-pro://execute-action?name=second-fourth",
    "Window ◳",
    "rectangle",
  ),
  winSmaller: url(
    "rectangle-pro://execute-action?name=smaller",
    "Make window smaller",
    "rectangle",
  ),
  winSnapBottomLeft: url(
    "rectangle-pro://execute-action?name=snap-bottom-left",
    "Snap window ◱",
    "rectangle",
  ),
  winSnapBottomRight: url(
    "rectangle-pro://execute-action?name=snap-bottom-right",
    "Snap window to ◲",
    "rectangle",
  ),
  winSnapTopLeft: url(
    "rectangle-pro://execute-action?name=snap-top-left",
    "Snap window to ◰",
    "rectangle",
  ),
  winSnapTopRight: url(
    "rectangle-pro://execute-action?name=snap-top-right",
    "Snap window to ◳",
    "rectangle",
  ),
  winsReflowPin: url(
    "rectangle-pro://execute-action?name=reflow-pin",
    "Reflow pin",
    "rectangle",
  ),
  winsStashAllButFront: url(
    "rectangle-pro://execute-action?name=stash-all-but-front",
    "Stash all but front",
    "rectangle",
  ),
  winStashAll: url(
    "rectangle-pro://execute-action?name=stash-all",
    "Stash all",
    "rectangle",
  ),
  winStashDown: url(
    "rectangle-pro://execute-action?name=stash-down",
    "Stash ↓",
    "rectangle",
  ),
  winStashLeft: url(
    "rectangle-pro://execute-action?name=stash-left",
    "Stash ←",
    "rectangle",
  ),
  winStashRight: url(
    "rectangle-pro://execute-action?name=stash-right",
    "Stash →",
    "rectangle",
  ),
  winStashUp: url(
    "rectangle-pro://execute-action?name=stash-up",
    "Stash ↑",
    "rectangle",
  ),
  winsTile2x2: url("rectangle-pro://execute-action?name=tile2x2", "Tile ⊞", "rectangle"),
  winsTile2x3: url(
    "rectangle-pro://execute-action?name=tile2x3",
    "Tile 2x3",
    "rectangle",
  ),
  winsToggleStashed: url(
    "rectangle-pro://execute-action?name=toggle-stashed",
    "Toggle stashed",
    "rectangle",
  ),
  winsUnstash: url(
    "rectangle-pro://execute-action?name=unstash",
    "Unstash",
    "rectangle",
  ),
  winsUnstashAll: url(
    "rectangle-pro://execute-action?name=unstash-all",
    "Unstash all",
    "rectangle",
  ),
  winThirdFourth: url(
    "rectangle-pro://execute-action?name=third-fourth",
    "Window to ◳",
    "rectangle",
  ),
  winTopCenterSixth: url(
    "rectangle-pro://execute-action?name=top-center-sixth",
    "Window to top center 1/6",
    "rectangle",
  ),
  winTopHalf: url(
    "rectangle-pro://execute-action?name=top-half",
    "Window ⬒",
    "rectangle",
  ),
  winTopLeft: url(
    "rectangle-pro://execute-action?name=top-left",
    "Window to ◰",
    "rectangle",
  ),
  winTopLeftSixth: url(
    "rectangle-pro://execute-action?name=top-left-sixth",
    "Window to ↑← 1/6",
    "rectangle",
  ),
  winTopLeftThird: url(
    "rectangle-pro://execute-action?name=top-left-third",
    "Window to ↑← 1/3",
    "rectangle",
  ),
  winTopRight: url(
    "rectangle-pro://execute-action?name=top-right",
    "Window to ◳",
    "rectangle",
  ),
  winTopRightSixth: url(
    "rectangle-pro://execute-action?name=top-right-sixth",
    "Window to ↑→ 1/6",
    "rectangle",
  ),
  winTopRightThird: url(
    "rectangle-pro://execute-action?name=top-right-third",
    "Window to ↑→ 1/3",
    "rectangle",
  ),
  winUpperCenter: url(
    "rectangle-pro://execute-action?name=upper-center",
    "Window to upper center",
    "rectangle",
  ),
  winBottomRightEighth: url(
    "rectangle-pro://execute-action?name=bottom-right-eighth",
    "Window to bottom right 1/8",
    "rectangle",
  ),
  winBottomLeftEighth: url(
    "rectangle-pro://execute-action?name=bottom-left-eighth",
    "Window to bottom left 1/8",
    "rectangle",
  ),
  winTopRightEighth: url(
    "rectangle-pro://execute-action?name=top-right-eighth",
    "Window to top right 1/8",
    "rectangle",
  ),
  winTopLeftEighth: url(
    "rectangle-pro://execute-action?name=top-left-eighth",
    "Window to top left 1/8",
    "rectangle",
  ),
};

const CsxUrls = {
  csxCaptureArea: url("cleanshot://capture-area", "Capture area", "cleanshot"),
  csxCaptureFullscreen: url(
    "cleanshot://capture-fullscreen",
    "Capture fullscreen",
    "cleanshot",
  ),
  csxOcr: url("cleanshot://capture-text", "OCR text", "cleanshot"),
  csxOcrNoLinebreaks: url(
    "cleanshot://capture-text?linebreaks=false",
    "OCR text (no line breaks)",
    "cleanshot",
  ),
  csxCaptureWindow: url("cleanshot://capture-window", "Capture window", "cleanshot"),
  csxRecordScreen: url("cleanshot://record-screen", "Record screen", "cleanshot"),
};

const AntiNoteUrls = {
  antinote: url("antinote://", "Open AntiNote"),
  antinoteNewNote: url("antinote://new-note", "Create new note"),
  antinoteNewNoteInBackground: url(
    "antinote://new-note?background=true",
    "Create new note in background",
  ),
};

// EXPORTS

export const URLS = {
  ...SidenotesUrls,
  ...RaycastUrls,
  ...rectangleUrls,
  ...CsxUrls,
  ...AntiNoteUrls,
};

export type { UrlSpec };
