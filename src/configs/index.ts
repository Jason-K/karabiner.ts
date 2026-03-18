/**
 * Barrel export for configs module
 *
 * Re-exports all declarative mappings and configuration constants
 * from this directory for easy centralized imports in src/index.ts.
 */

export {
    getFolderOpenerBundleId,
    getOpenFolderCommand
} from "./folder-opener";

export {
    SPACE_LAYER_DEBUG,
    SPACE_LAYER_DEBUG_LOG_PATH,
    SPACE_LAYER_INDICATOR_ROOT,
    SPACE_LAYER_LABEL,
    SPACE_LAYER_LEADER_KEY,
    SPACE_LAYER_PREFIX
} from "./space-layer";

export { buildSpaceLayers } from "./space-layers";
export { tapHoldKeys } from "./tap-hold-keys";
