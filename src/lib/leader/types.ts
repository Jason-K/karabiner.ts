import type { ToEvent } from 'karabiner.ts';

import type { OpenAppOpts } from '../builders';

export type LayerMappingConfig = {
  // Single action (legacy support)
  path?: string;            // Folder/file path to open
  command?: string;         // Shell command to execute
  key?: string;             // Key to send
  stickyModifier?: 'shift' | 'option' | 'command' | 'control'; // Toggle sticky modifier state
  passModifiers?: boolean;  // If true, pass through modifiers from the source key (e.g., shift+h -> shift+left_arrow)
  openAppOpts?: OpenAppOpts; // Use native open_application (preferred over command for apps)
  toEvents?: ToEvent[];      // Directly supply ToEvents (advanced usage, Phase 4)
  usageCounterVar?: string;  // Variable to increment each time this mapping runs (Phase 3)

  // Multiple actions (new)
  actions?: Array<{
    type: 'path' | 'command' | 'key' | 'copy' | 'paste' | 'cut';
    value?: string;         // For path, command, or key types
    modifiers?: string[];   // For key type
    passModifiers?: boolean; // For key type
  }>;

  description: string;      // Description for this action
};

export type NestedLayerConfig = {
  layerKey: string;           // Key to activate this nested sublayer (e.g., 'w' for Work)
  layerName: string;          // Human-readable name for documentation
  releaseLayer?: boolean;     // If true (default), clear layer after each action
  mappings: Record<string, LayerMappingConfig>; // Key mappings within this nested sublayer
};

export type SubLayerConfig = {
  layerKey: string;           // Key to activate this sublayer (e.g., 'd' for Downloads)
  layerName: string;          // Human-readable name for documentation
  releaseLayer?: boolean;     // If true (default), clear layer after each action. If false, layer stays active until leader key is released.
  mappings: Record<string, LayerMappingConfig>; // Key mappings within this sublayer
  subLayers?: NestedLayerConfig[]; // Optional nested sublayers (second-level)
};

export type LayerRuleOptions = {
  leaderKey?: string;           // Physical key used to activate leader mode
  layerPrefix?: string;         // Prefix for state variables and indicator layer IDs
  leaderLabel?: string;         // Label used in generated rule descriptions
  indicatorRootLayer?: string;  // Root layer ID sent to hammerspoon://layer_indicator
  resetVars?: string[];         // Additional variables to reset on escape while leader mode is active
  debugSwallowedKeys?: boolean; // If true, logs swallowed unmapped key events
  debugLogPath?: string;        // Where swallowed-key debug events are written
};
