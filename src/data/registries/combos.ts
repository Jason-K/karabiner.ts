import { APP_ID } from "./apps";
import { VMOD } from "../constants/keys";
import type { MapSpec, Map } from "../primitives/maps";
import { mapSpec, type ComboOpts, type HkInput } from "../../engine/resolve-to-action/resolve-map";

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

const HK_REGISTRY = {
  focusWinBottom: mapSpec("down_arrow", VMOD.COC_, "focus window to the bottom", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinLeft: mapSpec("left_arrow", VMOD.COC_, "focus window to the left", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinRight: mapSpec("right_arrow", VMOD.COC_, "focus window to the right", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinTop: mapSpec("up_arrow", VMOD.COC_, "focus window to the top", { app: APP_ID.onePiece, options: { repeat: false } }),
  raycastHere2This: mapSpec("h", VMOD.COCS, "raycast here2this", { app: APP_ID.raycast, options: { repeat: false } }),
  restoreMinimizedWindow: mapSpec("m", VMOD._OC_, "restore minimized windows", { app: APP_ID.onePiece, options: { repeat: false } }),
  showBusyCal: mapSpec("7", VMOD.CO_S, "show busycal popup", { app: "com.busymac.busycal-setapp", options: { repeat: false } }),
  showKittyQuakeTerm: mapSpec("f11", VMOD._OCS, "show kitty quake terminal", { app: APP_ID.kitty, options: { repeat: false } }),
  showMissionControl: mapSpec(["vk_mission_control", "vk_none"], "show mission control"),
  showPopclip: mapSpec("f9", VMOD.COCS, "show showPopclip", { app: "com.pilotmoon.showPopclip", options: { repeat: false } }),
  showSidenotes: mapSpec("f10", VMOD.CO_S, "show sidenotes", { app: APP_ID.sidenotes }),
  skimHighlight: mapSpec("h", VMOD.C_C_, "highlight in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  skimUnderline: mapSpec("u", VMOD.C_C_, "underline in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  wordPrint: mapSpec("p", ["left_command"], "print in word", { app: APP_ID.word, activeAppOnly: true, options: { repeat: false } }),
  zenNextTab: mapSpec("open_bracket", VMOD.C__S, "activate next tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: true } }),
  zenPreviousTab: mapSpec("close_bracket", VMOD.C__S, "activate previous tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: false } }),
};

export const COMBOS: { [key: string]: MapSpec } = {
  ...HK_REGISTRY,
};

export { mapSpec, mapSpec as map };
export type { MapSpec, Map, ComboOpts, HkInput };
