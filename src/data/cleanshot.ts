const cs = (name: string, refDesc: string) => ({
  type: "cleanShot" as const,
  name,
  refDesc,
});

export const cleanShotRegistry = {
  captureArea: cs("capture-area", "Capture area"),
  captureFullscreen: cs("capture-fullscreen", "Capture fullscreen"),
  captureTextNoLinebreaks: cs("capture-text?linebreaks=false", "Capture text (no line breaks)"),
  captureWindow: cs("capture-window", "Capture window"),
  recordScreen: cs("record-screen", "Record screen"),
} as const;

export type CleanShotRef = import("./refs").CleanShotRef;
