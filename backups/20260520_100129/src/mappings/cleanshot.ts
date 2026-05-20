export const cleanShotRegistry = {
  captureArea: "capture-area",
  captureFullscreen: "capture-fullscreen",
  captureTextNoLinebreaks: "capture-text?linebreaks=false",
  captureWindow: "capture-window",
  recordScreen: "record-screen",
} as const;

export type CleanShotRef = keyof typeof cleanShotRegistry;
