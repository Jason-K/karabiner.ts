import { APP_BUNDLES } from "./app_bundles";
import { MOD_COMBO } from "./key-aliases";
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
  restoreMinimizedWindow: external_hk("m", MOD_COMBO.vm_OC_, "restore minimized windows", { app: APP_BUNDLES.onePiece, options: { repeat: false } }),
  showBusyCal: external_hk("7", MOD_COMBO.vmCO_S, "show busycal popup", { app: "com.busymac.busycal-setapp", options: { repeat: false } }),
  showPopclip: external_hk("f9", MOD_COMBO.vmCOCS, "show popclip", { app: "com.pilotmoon.popclip", options: { repeat: false } }),
  skimHighlight: external_hk("h", MOD_COMBO.vmC_C_, "highlight in skim", { app: APP_BUNDLES.skim, activeAppOnly: true, options: { repeat: false } }),
  skimUnderline: external_hk("u", MOD_COMBO.vmC_C_, "underline in skim", { app: APP_BUNDLES.skim, activeAppOnly: true, options: { repeat: false } }),
  showKittyQuakeTerm: external_hk("f11", MOD_COMBO.vm_OCS, "show kitty quake terminal", { app: APP_BUNDLES.kitty, options: { repeat: false } }),
  focusWinLeft: external_hk("left_arrow", MOD_COMBO.vmCOC_, "focus window to the left", { app: APP_BUNDLES.onePiece, options: { repeat: false } }),
  focusWinRight: external_hk("right_arrow", MOD_COMBO.vmCOC_, "focus window to the right", { app: APP_BUNDLES.onePiece, options: { repeat: false } }),
  focusWinTop: external_hk("up_arrow", MOD_COMBO.vmCOC_, "focus window to the top", { app: APP_BUNDLES.onePiece, options: { repeat: false } }),
  focusWinBottom: external_hk("down_arrow", MOD_COMBO.vmCOC_, "focus window to the bottom", { app: APP_BUNDLES.onePiece, options: { repeat: false } }),
  zenNextTab: external_hk("open_bracket", MOD_COMBO.vmC__S, "activate next tab in Zen", { app: APP_BUNDLES.zen, activeAppOnly: true, options: { repeat: true } }),
  zenPreviousTab: external_hk("close_bracket", MOD_COMBO.vmC__S, "activate previous tab in Zen", { app: APP_BUNDLES.zen, activeAppOnly: true, options: { repeat: false } }),
  raycastHere2This: external_hk("h", MOD_COMBO.vmCOCS, "raycast here2this", { app: APP_BUNDLES.raycast, options: { repeat: false } }),
  popclip: external_hk("p", MOD_COMBO.vmCOC_, "show Popclip toolbar", { app: "com.pilotmoon.popclip", options: { repeat: false } }),
  wordPrint: external_hk("p", ["left_command"], "print in word", { app: APP_BUNDLES.word, activeAppOnly: true, options: { repeat: false } }),
};

export const EXTERNAL_HKS: { [key: string]: ExternalHkRef } = {
  ...HK_REGISTRY,
};

export type { ExternalHkRef, HkRef };