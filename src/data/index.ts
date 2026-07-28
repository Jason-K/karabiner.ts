/**
 * Barrel export for split data/config modules.
 *
 * Re-exports shared registries/constants consumed by core/engine/definitions.
 */

export { DEVICE_IDS, karabinerDeviceId, NUMPAD_REMAPS } from "./devices";
export { KE_VAR_VALUES, KE_VARS, type VarRef } from "./ke-vars";

export { APP_BUNDLES, PW_BUNDLES, type AppRef } from "./app_bundles";
export { CMDS, type CommandRef } from "./commands";
export { HOME_DIR, PATHS, type PathRef } from "./paths";
export { DEFAULT_PROFILE_NAME, PREFERRED_PROFILE_NAME } from "./profiles";
export type { DeviceSpec, RefSpec, RefSpecType, VarSpec } from "./refs";
export { TIMINGS } from "./timings";
export { DESCRIPTION_SEPARATOR, KEY_SYMBOLS } from "./ui-labels";
export { URLS, type UrlRef } from "./urls";
