import { APP_ID } from "./registry-app-ids";
import { VMOD } from "./key-aliases";
import type { ExternalHkRef, HkRef, RefSpec } from "./refs";

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a hotkey owned by an external app.
 *  @param key       - key_code to emit (e.g. "f", "space", "return")
 *  @param modifiers - modifier keys (e.g. ["command", "option"])
 *  @param refDesc   - human label used in descriptions
 *  @param opts.app          - optional app that owns this hotkey (AppRef, PathRef, or bundle-id/path string)
 *  @param opts.activeAppOnly - when true, hotkey only works while `app` is frontmost (default false)
 *  @param opts.options      - default key-event flags (repeat/halt/lazy); individual do blocks may override
 */
const external_hk = (
  key: string,
  modifiers: string[],
  refDesc: string,
  opts?: {
    app?: RefSpec | string;
    activeAppOnly?: boolean;
    options?: { repeat?: boolean; halt?: boolean; lazy?: boolean };
  },
): ExternalHkRef => ({
  type: "external_hk" as const,
  name: key,
  modifiers,
  refDesc,
  ...(opts?.app !== undefined ? { app: opts.app } : {}),
  ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
  ...(opts?.options ? { options: opts.options } : {}),
});

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

const HK_REGISTRY = {
  // Example: a global hotkey (no app constraint)
  // myGlobalHotkey: external_hk("f", ["command", "option"], "My Global Hotkey"),

  // Example: a hotkey scoped to a specific app
  // myAppHotkey: external_hk("p", ["command"], "Print in MyApp", {
  //   app: "com.example.myapp",
  //   activeAppOnly: true,
  // }),
  restoreMinimizedWindow: external_hk("m", VMOD._OC_, "restore minimized windows", { app: APP_ID.onePiece, options: { repeat: false } }),
  showBusyCal: external_hk("7", VMOD.CO_S, "show busycal popup", { app: "com.busymac.busycal-setapp", options: { repeat: false } }),
  showPopclip: external_hk("f9", VMOD.COCS, "show popclip", { app: "com.pilotmoon.popclip", options: { repeat: false } }),
  skimHighlight: external_hk("h", VMOD.C_C_, "highlight in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  skimUnderline: external_hk("u", VMOD.C_C_, "underline in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  showKittyQuakeTerm: external_hk("f11", VMOD._OCS, "show kitty quake terminal", { app: APP_ID.kitty, options: { repeat: false } }),
  focusWinLeft: external_hk("left_arrow", VMOD.COC_, "focus window to the left", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinRight: external_hk("right_arrow", VMOD.COC_, "focus window to the right", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinTop: external_hk("up_arrow", VMOD.COC_, "focus window to the top", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinBottom: external_hk("down_arrow", VMOD.COC_, "focus window to the bottom", { app: APP_ID.onePiece, options: { repeat: false } }),
  zenNextTab: external_hk("open_bracket", VMOD.C__S, "activate next tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: true } }),
  zenPreviousTab: external_hk("close_bracket", VMOD.C__S, "activate previous tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: false } }),
  raycastHere2This: external_hk("h", VMOD.COCS, "raycast here2this", { app: APP_ID.raycast, options: { repeat: false } }),
  popclip: external_hk("p", VMOD.COC_, "show Popclip toolbar", { app: "com.pilotmoon.popclip", options: { repeat: false } }),
  wordPrint: external_hk("p", ["left_command"], "print in word", { app: APP_ID.word, activeAppOnly: true, options: { repeat: false } }),
  showSidenotes: external_hk("f10", VMOD.CO_S, "show sidenotes", { app: APP_ID.sidenotes })
};

export const COMBOS: { [key: string]: ExternalHkRef } = {
  ...HK_REGISTRY,
};

export type { ExternalHkRef, HkRef };