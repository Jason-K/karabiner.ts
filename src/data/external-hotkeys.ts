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
 */
const external_hk = (
  key: string,
  modifiers: string[],
  refDesc: string,
  opts?: { app?: RefSpec | string; activeAppOnly?: boolean },
): ExternalHkRef => ({
  type: "external_hk" as const,
  name: key,
  modifiers,
  refDesc,
  ...(opts?.app !== undefined ? { app: opts.app } : {}),
  ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
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
};

export const EXTERNAL_HKS: { [key: string]: ExternalHkRef } = {
  ...HK_REGISTRY,
};

export type { ExternalHkRef, HkRef };