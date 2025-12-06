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

import type { ToEvent } from 'karabiner.ts';
import { ifVar, map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import { cmd, openApp, setVarExpr, tapHold, type OpenAppOpts } from './builders';
import { L } from './mods';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TapHoldConfig = {
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

export type SubLayerConfig = {
  layerKey: string;           // Key to activate this sublayer (e.g., 'd' for Downloads)
  layerName: string;          // Human-readable name for documentation
  releaseLayer?: boolean;     // If true (default), clear layer after each action. If false, layer stays active until space released.
  mappings: Record<string, {  // Key mappings within this sublayer
    // Single action (legacy support)
    path?: string;            // Folder/file path to open
    command?: string;         // Shell command to execute
    key?: string;             // Key to send
    stickyModifier?: 'shift' | 'option' | 'command' | 'control'; // Toggle sticky modifier state
    passModifiers?: boolean;  // If true, pass through modifiers from the source key (e.g., shift+h → shift+left_arrow)
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
 * Get the layer name for URL scheme
 */
function buildLayerInfo(layerKey: string, spaceLayers: SubLayerConfig[]): string {
  return `space_${layerKey.toUpperCase()}`;
}

/**
 * Build layer info for space_mod layer (shows available sublayers)
 */
function buildSpaceModInfo(spaceLayers: SubLayerConfig[]): string {
  // Return the space layer name for URL scheme
  return 'space';
}

// ============================================================================
// TAP-HOLD RULE GENERATION
// ============================================================================

/**
 * Generate tap-hold rules with automatic conflict prevention for space layers
 */
export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  spaceLayers: SubLayerConfig[]
): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

  return Object.entries(tapHoldKeys).map(([key, config]) => {
    const manipulators = tapHold({
      key,
      alone: [toKey(key as any, [], { halt: true })],
      hold: config.hold,
      timeoutMs: config.timeoutMs,
      thresholdMs: config.thresholdMs,
      appOverrides: config.appOverrides,
    }).build();

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

    return rule(`${key.toUpperCase()} hold -> ${config.description}`).manipulators(manipulators);
  });
}

// ============================================================================
// SPACE LAYER GENERATION
// ============================================================================

/**
 * Generate space layer rules with persistent sublayers
 */
export function generateSpaceLayerRules(spaceLayers: SubLayerConfig[]): any[] {
  const rules: any[] = [];
  const spaceModVar = 'space_mod';
  const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

  // Build layer info for space_mod (list of sublayers)
  const spaceModInfo = buildSpaceModInfo(spaceLayers);

  // Space key activates the layer
  const spaceManipulator = map('spacebar')
    .toIfAlone([
      toKey('spacebar', [], { halt: true }),
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map(v => toSetVar(v, 0)),
    ])
    .toIfHeldDown([
      toSetVar(spaceModVar, 1),
      cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=space'`)
    ])
    .toAfterKeyUp([
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map(v => toSetVar(v, 0)),
      // Ensure sticky modifiers are cleared when leaving space mode
      toStickyModifier(L.shift, 'off'),
      toStickyModifier(L.opt, 'off'),
      toStickyModifier(L.cmd, 'off'),
      toStickyModifier(L.ctrl, 'off'),
      cmd(`open -g 'hammerspoon://layer_indicator?action=hide'`)
    ])
    .toDelayedAction(
      [],
      [
        toKey('spacebar'),
        toSetVar(spaceModVar, 0),
        ...allSublayerVars.map(v => toSetVar(v, 0)),
      ]
    )
    .parameters({
      'basic.to_if_alone_timeout_milliseconds': 300,
      'basic.to_if_held_down_threshold_milliseconds': 300,
    });

  rules.push(rule('SPACE - tap for space, hold for layer').manipulators(spaceManipulator.build()));

  // Generate sublayer rules
  spaceLayers.forEach(({ layerKey, layerName, mappings, releaseLayer = true }) => {
    const sublayerVar = `space_${layerKey}_sublayer`;
    const sublayerActivateTimeVar = `space_${layerKey}_activate_ms`;
    const allManipulators: any[] = [];

    // Build layer info JSON for this layer
    const layerInfo = buildLayerInfo(layerKey, spaceLayers);

    // Sublayer activation - pressing layerKey while space is held
    allManipulators.push(
      ...map(layerKey as any)
        .condition(ifVar(spaceModVar, 1))
        .to([
          toSetVar(sublayerVar, 1),
          toSetVar(spaceModVar, 0),
          // Record activation timestamp (Phase 3 expression support)
          setVarExpr(sublayerActivateTimeVar, '{{ system.now.milliseconds }}'),
          cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=space_${layerKey.toUpperCase()}'`)
        ])
        .build()
    );

    // Sublayer key mappings
    Object.entries(mappings).forEach(([key, config]) => {
      const events: ToEvent[] = [];

      // Support new actions array (multiple sequential actions)
      if (config.actions && config.actions.length > 0) {
        config.actions.forEach(action => {
          switch (action.type) {
            case 'path':
              if (action.value) events.push(cmd(`open '${action.value}'`));
              break;
            case 'command':
              if (action.value) events.push(cmd(action.value));
              break;
            case 'key':
              if (action.value) {
                const mods = action.modifiers || [];
                if (action.passModifiers) {
                  events.push(toKey(action.value as any, 'any' as any));
                } else {
                  events.push(toKey(action.value as any, mods as any));
                }
              }
              break;
            case 'copy':
              events.push(toKey('c', ['left_command']));
              break;
            case 'paste':
              events.push(toKey('v', ['left_command']));
              break;
            case 'cut':
              events.push(toKey('x', ['left_command']));
              break;
          }
        });
      }
      // Legacy single action support (backward compatible)
      else if (config.openAppOpts) {
        events.push(openApp(config.openAppOpts));
      } else if (config.toEvents) {
        events.push(...config.toEvents);
      } else if (config.path) {
        events.push(cmd(`open '${config.path}'`));
      } else if (config.command) {
        events.push(cmd(config.command));
      } else if (config.stickyModifier) {
        // Toggle sticky modifier using a/s/d/f
        const modMap: Record<string, string> = {
          shift: L.shift,
          option: L.opt,
          command: L.cmd,
          control: L.ctrl,
        } as any;
        const stickyKey = modMap[config.stickyModifier];
        events.push(toStickyModifier(stickyKey as any, 'toggle'));
      } else if (config.key) {
        // If passModifiers is true, use 'any' modifiers to pass through from source key
        if (config.passModifiers) {
          events.push(toKey(config.key as any, 'any' as any));
        } else {
          events.push(toKey(config.key as any));
        }
      }

      // Increment usage counter if configured (Phase 3)
      if (config.usageCounterVar) {
        events.push(setVarExpr(config.usageCounterVar, `{{ ${config.usageCounterVar} + 1 }}`));
      }

      // Clear the sublayer variable after action only if releaseLayer is true and this is not a sticky toggle
      if (releaseLayer && !config.stickyModifier) {
        events.push(toSetVar(sublayerVar, 0));
      }

      const mappingBuilder = (config.passModifiers
        ? (map as any)(key as any, '??' as any)
        : map(key as any)
      ).condition(ifVar(sublayerVar, 1)).to(events);

      allManipulators.push(
        ...mappingBuilder.build()
      );
    });

    // Add single rule with all manipulators for this sublayer
    rules.push(
      rule(`SPACE+${layerKey.toUpperCase()} - ${layerName} layer`).manipulators(allManipulators)
    );
  });

  return rules;
}

// ============================================================================
// ESCAPE RULE GENERATION
// ============================================================================

/**
 * Generate escape rule that clears all layer variables
 */
export function generateEscapeRule(spaceLayers: SubLayerConfig[]): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

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

            // Add profile-level Fn↔Ctrl swap for built-in keyboard and others
            profile.simple_modifications = [
              { from: { key_code: 'left_control' }, to: [{ key_code: 'fn' }] },
              { from: { key_code: 'fn' }, to: [{ key_code: 'left_control' }] },
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
