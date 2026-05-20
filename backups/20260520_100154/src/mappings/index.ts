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
export { folderRegistry } from "./folders";
export { raycastRegistry } from "./raycast";
export { spaceLayerDefinitions } from "./space-layers";
export { tapHoldMappings } from "./tap-hold";
