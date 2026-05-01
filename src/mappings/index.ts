/**
 * Barrel export for mappings module.
 *
 * Re-exports declarative mappings and configuration constants
 * consumed by src/index.ts and the generic generators.
 */

export {
    SPACE_LAYER_DEBUG,
    SPACE_LAYER_DEBUG_LOG_PATH,
    SPACE_LAYER_INDICATOR_ROOT,
    SPACE_LAYER_LABEL,
    SPACE_LAYER_LEADER_KEY,
    SPACE_LAYER_PREFIX
} from "./space-layer";

export { appRegistry } from "./apps";
export { cleanShotRegistry } from "./cleanshot";
export { disabledShortcuts } from "./disabled-shortcuts";
export { folderRegistry } from "./folders";
export { mouseDeviceMappings } from "./mouse";
export { homeEndNavigationMappings } from "./navigation";
export { raycastRegistry } from "./raycast";
export { rightOptionLaunchers } from "./right-option-launchers";
export {
  scrollChordBrowserBundleIds,
  scrollChordTriggerKeys,
} from "./scroll-chords";
export { securitySlashActionMappings } from "./security-actions";
export { spaceLayerDefinitions } from "./space-layers";
export { enterKeyHoldMappings, equalsKeyHoldMappings } from "./special-key-holds";
export { tapHoldMappings } from "./tap-hold";
