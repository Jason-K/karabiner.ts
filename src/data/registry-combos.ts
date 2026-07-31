import { APP_ID } from "./registry-app-ids";
import { VMOD } from "./settings-keys";
import type { RefSpec, MapRef } from "./refs";

export type Map = {
  key: string;
  modifiers: string[];
};

export type ComboOpts = {
  app?: RefSpec | string;
  activeAppOnly?: boolean;
  options?: { repeat?: boolean; halt?: boolean; lazy?: boolean };
};

export type HkInput =
  | string
  | [string, string[]]
  | { key?: string; name?: string; modifiers?: string[] };

function normalizeCombo(input: HkInput): Map {
  if (typeof input === "string") {
    return { key: input, modifiers: [] };
  }
  if (Array.isArray(input)) {
    return { key: input[0], modifiers: input[1] ?? [] };
  }
  return {
    key: input.key ?? input.name ?? "",
    modifiers: input.modifiers ?? [],
  };
}

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for a hotkey combo or sequence.
 *  @param key       - key_code to emit (e.g. "f", "space", "return")
 *  @param modifiers - modifier keys (e.g. ["command", "option"])
 *  @param refDesc   - human label used in descriptions
 *  @param opts      - optional app constraint and key-event options
 */
/* eslint-disable no-redeclare */
export function map(
  key: string,
  modifiers: string[],
  refDesc: string,
  opts?: ComboOpts,
): MapRef;

/** Create a registry entry for a hotkey sequence.
 *  @param combos    - sequence of key combos (tuples, objects, or key strings)
 *  @param refDesc   - human label used in descriptions
 *  @param opts      - optional app constraint and key-event options
 */
export function map(
  combos: HkInput[],
  refDesc: string,
  opts?: ComboOpts,
): MapRef;

export function map(
  keyOrCombos: string | HkInput[],
  modifiersOrRefDesc: string[] | string,
  refDescOrOpts?: string | ComboOpts,
  optsParam?: ComboOpts,
): MapRef {
  /* eslint-enable no-redeclare */
  if (Array.isArray(keyOrCombos)) {
    const combos = keyOrCombos.map(normalizeCombo);
    const refDesc = modifiersOrRefDesc as string;
    const opts = refDescOrOpts as ComboOpts | undefined;
    const first = combos[0] ?? { key: "", modifiers: [] };
    return {
      type: "map" as const,
      name: first.key,
      modifiers: first.modifiers,
      combos,
      refDesc,
      ...(opts?.app !== undefined ? { app: opts.app } : {}),
      ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
      ...(opts?.options ? { options: opts.options } : {}),
    };
  }
  const key = keyOrCombos;
  const modifiers = modifiersOrRefDesc as string[];
  const refDesc = refDescOrOpts as string;
  const opts = optsParam;
  return {
    type: "map" as const,
    name: key,
    modifiers,
    refDesc,
    ...(opts?.app !== undefined ? { app: opts.app } : {}),
    ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
    ...(opts?.options ? { options: opts.options } : {}),
  };
}

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

const HK_REGISTRY = {
  // Example: a global hotkey (no app constraint)
  // myGlobalHotkey: map("f", ["command", "option"], "My Global Hotkey"),

  // Example: a hotkey scoped to a specific app
  // myAppHotkey: map("p", ["command"], "Print in MyApp", {
  //   app: "com.example.myapp",
  //   activeAppOnly: true,
  // }),
  focusWinBottom: map("down_arrow", VMOD.COC_, "focus window to the bottom", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinLeft: map("left_arrow", VMOD.COC_, "focus window to the left", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinRight: map("right_arrow", VMOD.COC_, "focus window to the right", { app: APP_ID.onePiece, options: { repeat: false } }),
  focusWinTop: map("up_arrow", VMOD.COC_, "focus window to the top", { app: APP_ID.onePiece, options: { repeat: false } }),
  raycastHere2This: map("h", VMOD.COCS, "raycast here2this", { app: APP_ID.raycast, options: { repeat: false } }),
  restoreMinimizedWindow: map("m", VMOD._OC_, "restore minimized windows", { app: APP_ID.onePiece, options: { repeat: false } }),
  showBusyCal: map("7", VMOD.CO_S, "show busycal popup", { app: "com.busymac.busycal-setapp", options: { repeat: false } }),
  showKittyQuakeTerm: map("f11", VMOD._OCS, "show kitty quake terminal", { app: APP_ID.kitty, options: { repeat: false } }),
  showMissionControl: map(["vk_mission_control", "vk_none"], "show mission control"),
  showPopclip: map("f9", VMOD.COCS, "show showPopclip", { app: "com.pilotmoon.showPopclip", options: { repeat: false } }),
  showSidenotes: map("f10", VMOD.CO_S, "show sidenotes", { app: APP_ID.sidenotes }),
  skimHighlight: map("h", VMOD.C_C_, "highlight in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  skimUnderline: map("u", VMOD.C_C_, "underline in skim", { app: APP_ID.skim, activeAppOnly: true, options: { repeat: false } }),
  wordPrint: map("p", ["left_command"], "print in word", { app: APP_ID.word, activeAppOnly: true, options: { repeat: false } }),
  zenNextTab: map("open_bracket", VMOD.C__S, "activate next tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: true } }),
  zenPreviousTab: map("close_bracket", VMOD.C__S, "activate previous tab in Zen", { app: APP_ID.zen, activeAppOnly: true, options: { repeat: false } }),
};

export const COMBOS: { [key: string]: MapRef } = {
  ...HK_REGISTRY,
};

export type { MapRef };