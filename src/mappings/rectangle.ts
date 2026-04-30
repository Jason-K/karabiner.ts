import type { ToEvent } from "karabiner.ts";

export const rectangleActions = [
  "almost-maximize",
  "app-left-half",
  "app-next-display",
  "app-prev-display",
  "app-right-half",
  "bottom-center-left-eighth",
  "bottom-center-ninth",
  "bottom-center-right-eighth",
  "bottom-center-sixth",
  "bottom-half",
  "bottom-left-eighth",
  "bottom-left-ninth",
  "bottom-left-sixth",
  "bottom-left-third",
  "bottom-left",
  "bottom-right-eighth",
  "bottom-right-ninth",
  "bottom-right-sixth",
  "bottom-right-third",
  "bottom-right",
  "cascade-all",
  "cascade-app",
  "center-half",
  "center-third",
  "center-two-thirds",
  "center",
  "close",
  "cycle-stashed",
  "fill-bottom-left",
  "fill-bottom-right",
  "fill-left",
  "fill-right",
  "fill-top-left",
  "fill-top-right",
  "first-fourth",
  "first-sixth",
  "first-third",
  "first-three-fourths",
  "first-two-thirds",
  "fullscreen",
  "hide-app",
  "larger",
  "last-fourth",
  "last-sixth",
  "last-third",
  "last-three-fourths",
  "last-two-thirds",
  "last",
  "left-half",
  "maximize-height",
  "maximize",
  "middle-center-ninth",
  "middle-left-ninth",
  "middle-right-ninth",
  "minimize",
  "move-down",
  "move-left",
  "move-right",
  "move-up",
  "next-display-ratio",
  "next-display",
  "next-space",
  "nudge-down",
  "nudge-left",
  "nudge-right",
  "nudge-up",
  "prev-display-ratio",
  "prev-space",
  "previous-display",
  "quit-app",
  "reflow-pin",
  "restore",
  "reveal-desktop-edge",
  "right-half",
  "second-fourth",
  "smaller",
  "snap-bottom-left",
  "snap-bottom-right",
  "snap-top-left",
  "snap-top-right",
  "stash-all-but-front",
  "stash-all",
  "stash-down",
  "stash-left",
  "stash-right",
  "stash-up",
  "third-fourth",
  "tile2x2",
  "tile2x3",
  "toggle-stashed",
  "top-center-left-eighth",
  "top-center-ninth",
  "top-center-right-eighth",
  "top-center-sixth",
  "top-half",
  "top-left-eighth",
  "top-left-ninth",
  "top-left-sixth",
  "top-left-third",
  "top-left",
  "top-right-eighth",
  "top-right-ninth",
  "top-right-sixth",
  "top-right-third",
  "top-right",
  "unstash-all",
  "unstash",
  "upper-center",
] as const;

export type RectangleAction = (typeof rectangleActions)[number];

export function rectangleActionUrl(action: RectangleAction): string {
  return `rectangle-pro://execute-action?name=${action}`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `"'"'`)}'`;
}

export function rectangleActionByFocusedWindowOrientationCommand(
  landscapeAction: RectangleAction,
  portraitAction: RectangleAction,
): string {
  const landscapeUrl = rectangleActionUrl(landscapeAction);
  const portraitUrl = rectangleActionUrl(portraitAction);
  const script = [
    "local win = hs.window.focusedWindow()",
    "local screen = (win and win:screen()) or hs.screen.mainScreen()",
    "local frame = screen:frame()",
    `local url = (frame.w >= frame.h) and [[${landscapeUrl}]] or [[${portraitUrl}]]`,
    "hs.urlevent.openURL(url)",
  ].join("; ");

  return `/opt/homebrew/bin/hs -c ${shellSingleQuote(script)}`;
}

export function rectangleActionByFocusedWindowOrientationEvent(
  landscapeAction: RectangleAction,
  portraitAction: RectangleAction,
): ToEvent {
  return {
    shell_command: rectangleActionByFocusedWindowOrientationCommand(
      landscapeAction,
      portraitAction,
    ),
  };
}

export function rectangleMaxOrRestoreCommand(): string {
  const maximizeUrl = rectangleActionUrl("maximize");
  const restoreUrl = rectangleActionUrl("restore");
  const script = [
    "local win = hs.window.focusedWindow()",
    "local screen = (win and win:screen()) or hs.screen.mainScreen()",
    "local screenFrame = screen:frame()",
    "local winFrame = win and win:frame() or screenFrame",
    "local positionTolerance = 24",
    "local widthCoverage = screenFrame.w > 0 and (winFrame.w / screenFrame.w) or 0",
    "local heightCoverage = screenFrame.h > 0 and (winFrame.h / screenFrame.h) or 0",
    "local leftAligned = math.abs(winFrame.x - screenFrame.x) <= positionTolerance",
    "local topAligned = math.abs(winFrame.y - screenFrame.y) <= positionTolerance",
    "local isMaximized = leftAligned and topAligned and widthCoverage >= 0.97 and heightCoverage >= 0.9",
    `local url = isMaximized and [[${restoreUrl}]] or [[${maximizeUrl}]]`,
    "hs.urlevent.openURL(url)",
  ].join("; ");

  return `/opt/homebrew/bin/hs -c ${shellSingleQuote(script)}`;
}

export function rectangleMaxOrRestoreEvents(): ToEvent[] {
  return [
    {
      shell_command: rectangleMaxOrRestoreCommand(),
    },
  ];
}
