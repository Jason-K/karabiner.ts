/**
 * @file functions.ts
 * @description Generator functions for complex rule patterns.
 *
 * ⚠️ LOCAL EXTENSION: This file contains high-level rule generators.
 * - Upstream equivalent: None (custom rule generation logic)
 * - Safe to modify: YES - customize your space layers and tap-hold system
 * - Takes precedence: YES - wraps upstream builders with your patterns
 *
 * Key functions:
 * - generateTapHoldRules(): Batch-generate tap-hold manipulators with app overrides
 * - generateSpaceLayerRules(): Multi-sublayer system with sticky modifiers
 * - generateEscapeRule(): Variable reset on escape
 * - updateDeviceConfigurations(): Device-specific simple_modifications
 *
 * These generators keep src/index.ts clean and declarative.
 */

import fs from 'fs';
import type { ToEvent } from 'karabiner.ts';
import { map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import path from 'path';
import { tapHold } from './builders';
import { getAllSublayerVars } from './leader/runtime';
import type { SubLayerConfig } from './leader/types';
import { L } from './mods';

export { generateLayerRules, generateSpaceLayerRules } from './leader';
export type {
    LayerMappingConfig, LayerRuleOptions, NestedLayerConfig,
    SpaceLayerRuleOptions,
    SubLayerConfig
} from './leader';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TapHoldConfig = {
  alone?: ToEvent[];          // Optional custom tap behavior (defaults to sending original key)
  hold: ToEvent[];           // Actions to perform when key is held
  description: string;        // Human-readable description for the rule
  timeoutMs?: number;        // How long to wait before considering it "alone" (default: 400)
  thresholdMs?: number;      // How long to hold before triggering hold action (default: 400)
  // Optional app-specific overrides. Each entry can specify an app matcher (string or RegExp)
  // and alternate `alone` / `hold` event arrays or timing overrides. These are forwarded
  // to the `tapHold` builder which will emit per-app manipulators using
  // `foremost_application_if` / `foremost_application_unless` conditions.
  appOverrides?: Array<{
    // Bundle ID string (e.g., 'net.sourceforge.skim-app.skim')
    app: string;
    unless?: boolean;
    alone?: ToEvent[];
    hold?: ToEvent[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ToEvent[];
    invoked?: ToEvent[];
  }>;
};

export type SimpleModification = {
  from: { key_code: string };
  to: Array<{ key_code: string }>;
};

export type DeviceConfig = {
  identifiers: {
    vendor_id: number;
    product_id: number;
    is_keyboard?: boolean;
  };
  simple_modifications: SimpleModification[];
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Emit space layer definitions to JSON file for Hammerspoon consumption
 *
 * This function generates a JSON file containing all space layer definitions,
 * allowing Hammerspoon to dynamically build its layer indicator display without
 * needing manual synchronization when layers change.
 *
 * @param spaceLayers - Array of space layer configurations
 * @param outputPath - Path where JSON should be written (defaults to hammerspoon directory)
 * @param debugMode - If true, logs detailed information about the emission process
 */
export function emitLayerDefinitions(
  spaceLayers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false
): void {
  try {
    // Default output path: /Users/jason/.config/hammerspoon/karabiner_layer_gui/space_layers.json
    const finalPath = outputPath || path.join(
      process.env.HOME || '/Users/jason',
      '.config/hammerspoon/karabiner_layer_gui/space_layers.json'
    );

    if (debugMode) {
      console.log(`[LayerEmit Debug] Starting emission to: ${finalPath}`);
    }

    // Build layer definitions object
    const layers: Record<string, any> = {};

    // Add main space layer
    layers['space'] = {
      label: '␣',
      keys: spaceLayers.map(layer => ({
        key: layer.layerKey.toUpperCase(),
        desc: layer.layerName,
      })),
      widthHintPx: 235,
    };

    // Add each sublayer with its mappings (and any nested sublayers)
    spaceLayers.forEach(({ layerKey, layerName, mappings, subLayers }) => {
      const layerId = `space_${layerKey.toUpperCase()}`;
      const keys = Object.entries(mappings).map(([key, config]) => ({
        key: key.toUpperCase(),
        desc: config.description,
      }));

      (subLayers || []).forEach((subLayer) => {
        keys.push({
          key: subLayer.layerKey.toUpperCase(),
          desc: subLayer.layerName,
        });
      });

      layers[layerId] = {
        label: layerKey.toUpperCase(),
        keys,
        widthHintPx: 235,
      };

      if (debugMode) {
        console.log(
          `[LayerEmit Debug] Emitted layer ${layerId} with ${keys.length} keys`
        );
      }

      (subLayers || []).forEach((subLayer) => {
        const nestedId = `space_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}`;
        const nestedKeys = Object.entries(subLayer.mappings).map(([key, config]) => ({
          key: key.toUpperCase(),
          desc: config.description,
        }));

        layers[nestedId] = {
          label: `${layerKey.toUpperCase()}${subLayer.layerKey.toUpperCase()}`,
          keys: nestedKeys,
          widthHintPx: 235,
        };

        if (debugMode) {
          console.log(
            `[LayerEmit Debug] Emitted layer ${nestedId} with ${nestedKeys.length} keys`
          );
        }
      });
    });

    // Ensure directory exists
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      if (debugMode) {
        console.log(`[LayerEmit Debug] Creating directory: ${dir}`);
      }
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write JSON file
    fs.writeFileSync(finalPath, JSON.stringify(layers, null, 2));

    console.log(
      `✓ Emitted ${Object.keys(layers).length} layer definitions to ${finalPath}`
    );

    if (debugMode) {
      console.log(`[LayerEmit Debug] Emission complete. Layers:`, Object.keys(layers));
    }
  } catch (error) {
    console.error('✗ Failed to emit layer definitions:', error);
    if (debugMode) {
      console.error('[LayerEmit Debug] Full error:', error);
    }
  }
}

// ============================================================================
// TAP-HOLD RULE GENERATION
// ============================================================================

/**
 * Generate tap-hold rules with automatic conflict prevention for space layers
 */
/**
 * Parse a key string that may include modifiers
 * Format: "modifier+modifier+key" or just "key"
 * Examples: "command+b", "right_command+s", "left_shift+k", "a"
 * Returns: { key: string, modifiers: string[] }
 *
 * MODIFIER HANDLING:
 * - Preserves left/right distinctions: "left_command", "right_command" stay as-is
 * - Shortcuts expand to generic: "cmd" → "command", "opt" → "option"
 * - Generic modifiers stay generic: "command", "shift", etc.
 */
function parseKeyWithModifiers(keyString: string): { key: string; modifiers: string[] } {
  const parts = keyString.split('+').map(p => p.trim());
  if (parts.length === 1) {
    return { key: parts[0], modifiers: [] };
  }

  // Last part is the key, everything else is modifiers
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Normalize ONLY shortcuts, preserve left/right distinctions
  const normalizedModifiers = modifiers.map(mod => {
    const lower = mod.toLowerCase();

    // Preserve explicit left/right modifiers
    if (lower.startsWith('left_') || lower.startsWith('right_')) {
      return lower;
    }

    // Normalize shortcuts to generic forms
    switch (lower) {
      case 'cmd':
        return 'command';
      case 'opt':
      case 'alt':
        return 'option';
      case 'ctrl':
        return 'control';
      // Generic forms pass through unchanged
      case 'command':
      case 'option':
      case 'control':
      case 'shift':
        return lower;
      default:
        return mod;
    }
  });

  return { key, modifiers: normalizedModifiers };
}

export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  spaceLayers: SubLayerConfig[]
): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = getAllSublayerVars(spaceLayers);

  return Object.entries(tapHoldKeys).map(([keyString, config]) => {
    // Parse key string to extract base key and modifiers
    const { key, modifiers } = parseKeyWithModifiers(keyString);

    const manipulators = tapHold({
      key,
      alone: config.alone ?? [toKey(key as any, modifiers as any[], { halt: true })],
      hold: config.hold,
      timeoutMs: config.timeoutMs,
      thresholdMs: config.thresholdMs,
      appOverrides: config.appOverrides,
    }).build();

    // Add mandatory modifiers to the from field if specified
    if (modifiers.length > 0) {
      manipulators.forEach((m: any) => {
        m.from.modifiers = m.from.modifiers || {};
        m.from.modifiers.mandatory = modifiers;
      });
    }

    // Add conditions to prevent conflict with space layer
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];

      // Disable tap-hold when space_mod is active
      m.conditions.push({
        type: 'variable_unless',
        name: spaceModVar,
        value: 1
      });

      // Disable tap-hold when any sublayer is active
      allSublayerVars.forEach(sublayerVar => {
        m.conditions.push({
          type: 'variable_unless',
          name: sublayerVar,
          value: 1
        });
      });
    });

    return rule(`${keyString.toUpperCase()} hold -> ${config.description}`).manipulators(manipulators);
  });
}

// ============================================================================
// ESCAPE RULE GENERATION
// ============================================================================

/**
 * Generate escape rule that clears all layer variables
 */
export function generateEscapeRule(spaceLayers: SubLayerConfig[]): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = getAllSublayerVars(spaceLayers);

  // Static variables used elsewhere (caps lock, double-tap protection)
  const otherVars = [
    'caps_lock_pressed',
    'command_q_pressed',
    'ctrl_opt_esc_first',
    'cmd_d_ready',
  ];

  return [
    rule('ESCAPE - reset all variables').manipulators([
      ...map('escape')
        .to([
          toKey('escape'),
          toSetVar(spaceModVar, 0),
          ...allSublayerVars.map(v => toSetVar(v, 0)),
          ...otherVars.map(v => toSetVar(v, 0)),
          // Also clear sticky modifiers
          toStickyModifier(L.shift, 'off'),
          toStickyModifier(L.opt, 'off'),
          toStickyModifier(L.cmd, 'off'),
          toStickyModifier(L.ctrl, 'off'),
        ])
        .build(),
    ])
  ];
}

// ============================================================================
// DEVICE CONFIGURATION
// ============================================================================

/**
 * Update device-specific simple modifications in karabiner.json
 */
export function updateDeviceConfigurations(profileName: string, deviceConfigs: DeviceConfig[]): void {
  import('fs').then(fs => {
    import('os').then(os => {
      import('path').then(path => {
        try {
          const configPath = path.join(os.homedir(), '.config', 'karabiner', 'karabiner.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

          // Find the profile
          const profile = config.profiles.find((p: any) => p.name === profileName);
          if (profile) {
            // Get all existing devices from the config
            const existingDevices = profile.devices || [];

            // Create a Set of defined device identifiers for quick lookup
            const definedDeviceKeys = new Set(
              deviceConfigs.map(d =>
                `${d.identifiers.vendor_id}_${d.identifiers.product_id}`
              )
            );

            // Build new devices array:
            // 1. Include explicitly configured devices with their modifications
            // 2. For all other existing devices, preserve existing settings but ensure modify_events is false
            profile.devices = [
              // Add explicitly configured devices with modify_events explicitly enabled
              ...deviceConfigs.map(device => ({
                identifiers: device.identifiers,
                simple_modifications: device.simple_modifications,
                ignore: false,
                manipulate_caps_lock_led: false,
                disable_built_in_keyboard_if_exists: false,
              })),
              // Add existing devices that aren't explicitly configured, preserving their settings but forcing modify_events to false
              ...existingDevices
                .filter((d: any) => {
                  const key = `${d.identifiers.vendor_id}_${d.identifiers.product_id}`;
                  return !definedDeviceKeys.has(key);
                })
                .map((d: any) => ({
                  ...d, // Preserve all existing settings
                  // Explicitly disable event modification for unspecified devices
                  modify_events: false,
                }))
            ];

            // Write back to file
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            console.log('✓ Device-specific simple_modifications updated.');
          } else {
            console.error(`✗ ${profileName} profile not found`);
          }
        } catch (error) {
          console.error('Error updating device configurations:', error);
        }
      });
    });
  });
}
