/**
 * Helper functions for generating Karabiner rules
 */

import type { ToEvent } from 'karabiner.ts';
import { ifVar, map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import { cmd, tapHold } from './builders';
import { L } from './mods';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TapHoldConfig = {
  hold: ToEvent[];           // Actions to perform when key is held
  description: string;        // Human-readable description for the rule
  timeoutMs?: number;        // How long to wait before considering it "alone" (default: 400)
  thresholdMs?: number;      // How long to hold before triggering hold action (default: 400)
};

export type SubLayerConfig = {
  layerKey: string;           // Key to activate this sublayer (e.g., 'd' for Downloads)
  layerName: string;          // Human-readable name for documentation
  releaseLayer?: boolean;     // If true (default), clear layer after each action. If false, layer stays active until space released.
  mappings: Record<string, {  // Key mappings within this sublayer
    path?: string;            // Folder/file path to open
    command?: string;         // Shell command to execute
    key?: string;             // Key to send
    stickyModifier?: 'shift' | 'option' | 'command' | 'control'; // Toggle sticky modifier state
    passModifiers?: boolean;  // If true, pass through modifiers from the source key (e.g., shift+h → shift+left_arrow)
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

  // Space key activates the layer
  const spaceManipulator = map('spacebar')
    .toIfAlone([
      toKey('spacebar', [], { halt: true }),
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map(v => toSetVar(v, 0))
    ])
    .toIfHeldDown(toSetVar(spaceModVar, 1))
    .toAfterKeyUp([
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map(v => toSetVar(v, 0)),
      // Ensure sticky modifiers are cleared when leaving space mode
      toStickyModifier(L.shift, 'off'),
      toStickyModifier(L.opt, 'off'),
      toStickyModifier(L.cmd, 'off'),
      toStickyModifier(L.ctrl, 'off'),
    ])
    .toDelayedAction(
      [],
      [
        toKey('spacebar'),
        toSetVar(spaceModVar, 0),
        ...allSublayerVars.map(v => toSetVar(v, 0))
      ]
    )
    .parameters({
      'basic.to_if_alone_timeout_milliseconds': 200,
      'basic.to_if_held_down_threshold_milliseconds': 200,
    });

  rules.push(rule('SPACE - tap for space, hold for layer').manipulators(spaceManipulator.build()));

  // Generate sublayer rules
  spaceLayers.forEach(({ layerKey, layerName, mappings, releaseLayer = true }) => {
    const sublayerVar = `space_${layerKey}_sublayer`;
    const allManipulators: any[] = [];

    // Sublayer activation - pressing layerKey while space is held
    allManipulators.push(
      ...map(layerKey as any)
        .condition(ifVar(spaceModVar, 1))
        .to([
          toSetVar(sublayerVar, 1),
          toSetVar(spaceModVar, 0)
        ])
        .build()
    );

    // Sublayer key mappings
    Object.entries(mappings).forEach(([key, config]) => {
      const events: ToEvent[] = [];

      if (config.path) {
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
            // Add or update the devices section
            profile.devices = deviceConfigs.map(device => ({
              identifiers: device.identifiers,
              simple_modifications: device.simple_modifications,
            }));

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
