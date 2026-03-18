import type { ToEvent } from 'karabiner.ts';
import { ifVar, map, rule, toKey, toNone, toSetVar, toStickyModifier } from 'karabiner.ts';

import { cmd, openApp, setVarExpr } from '../builders';
import { L } from '../mods';
import { buildSpaceLayerDebugLogCommand, getAllSublayerVars } from './runtime';
import type { LayerMappingConfig, SpaceLayerRuleOptions, SubLayerConfig } from './types';

function buildLayerInfo(layerKey: string, spaceLayers: SubLayerConfig[]): string {
  return `space_${layerKey.toUpperCase()}`;
}

function buildSpaceModInfo(spaceLayers: SubLayerConfig[]): string {
  // Return the space layer name for URL scheme
  return 'space';
}

function buildSublayerManipulators(
  mappings: Record<string, LayerMappingConfig>,
  activeVar: string,
  releaseLayer: boolean
): any[] {
  const manipulators: any[] = [];

  Object.entries(mappings).forEach(([key, config]) => {
    const events: ToEvent[] = [];

    // Support new actions array (multiple sequential actions)
    if (config.actions && config.actions.length > 0) {
      config.actions.forEach((action) => {
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
      events.push(toSetVar(activeVar, 0));
    }

    const mappingBuilder = (config.passModifiers
      ? (map as any)(key as any, '??' as any)
      : map(key as any)
    ).condition(ifVar(activeVar, 1)).to(events);

    manipulators.push(
      ...mappingBuilder.build()
    );
  });

  return manipulators;
}

export function generateSpaceLayerRules(
  spaceLayers: SubLayerConfig[],
  options: SpaceLayerRuleOptions = {}
): any[] {
  const rules: any[] = [];
  const spaceModVar = 'space_mod';
  const allSublayerVars = getAllSublayerVars(spaceLayers);
  const debugSwallowedKeys = options.debugSwallowedKeys ?? false;
  const debugLogPath = options.debugLogPath ?? '~/.config/hammerspoon/logs/space_layer.log';

  // Build layer info for space_mod (list of sublayers)
  const spaceModInfo = buildSpaceModInfo(spaceLayers);

  // Space key activates the layer
  const spaceManipulator = map('spacebar')
    .toIfAlone([
      toKey('spacebar', [], { halt: true }),
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map((v) => toSetVar(v, 0)),
    ])
    .toIfHeldDown([
      toSetVar(spaceModVar, 1),
      cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=space'`)
    ])
    .toAfterKeyUp([
      toSetVar(spaceModVar, 0),
      ...allSublayerVars.map((v) => toSetVar(v, 0)),
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
        ...allSublayerVars.map((v) => toSetVar(v, 0)),
      ]
    )
    .parameters({
      'basic.to_if_alone_timeout_milliseconds': 200,
      'basic.to_if_held_down_threshold_milliseconds': 200,
    });

  rules.push(rule('SPACE - tap for space, hold for layer').manipulators(spaceManipulator.build()));

  // Generate sublayer rules
  spaceLayers.forEach(({ layerKey, layerName, mappings, releaseLayer = true, subLayers }) => {
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
    allManipulators.push(
      ...buildSublayerManipulators(mappings, sublayerVar, releaseLayer)
    );

    // Add single rule with all manipulators for this sublayer
    rules.push(
      rule(`SPACE+${layerKey.toUpperCase()} - ${layerName} layer`).manipulators(allManipulators)
    );

    // Nested sublayers (second-level)
    (subLayers || []).forEach((subLayer) => {
      const nestedVar = `space_${layerKey}_${subLayer.layerKey}_sublayer`;
      const nestedActivateTimeVar = `space_${layerKey}_${subLayer.layerKey}_activate_ms`;
      const nestedManipulators: any[] = [];

      nestedManipulators.push(
        ...map(subLayer.layerKey as any)
          .condition(ifVar(sublayerVar, 1))
          .to([
            toSetVar(nestedVar, 1),
            toSetVar(sublayerVar, 0),
            setVarExpr(nestedActivateTimeVar, '{{ system.now.milliseconds }}'),
            cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=space_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}'`)
          ])
          .build()
      );

      nestedManipulators.push(
        ...buildSublayerManipulators(
          subLayer.mappings,
          nestedVar,
          subLayer.releaseLayer ?? true
        )
      );

      rules.push(
        rule(`SPACE+${layerKey.toUpperCase()}+${subLayer.layerKey.toUpperCase()} - ${subLayer.layerName} layer`).manipulators(nestedManipulators)
      );
    });
  });

  // Swallow any unmapped keystrokes while space mode is active.
  // This prevents accidental input from leaking through to the frontmost app.
  const escapeResetEvents: ToEvent[] = [
    toKey('escape'),
    toSetVar(spaceModVar, 0),
    ...allSublayerVars.map((v) => toSetVar(v, 0)),
    toSetVar('caps_lock_pressed', 0),
    toSetVar('command_q_pressed', 0),
    toSetVar('ctrl_opt_esc_first', 0),
    toSetVar('cmd_d_ready', 0),
    toStickyModifier(L.shift, 'off'),
    toStickyModifier(L.opt, 'off'),
    toStickyModifier(L.cmd, 'off'),
    toStickyModifier(L.ctrl, 'off'),
  ];

  const buildSwallowUnmappedEvents = (stateName: string): ToEvent[] => {
    if (!debugSwallowedKeys) {
      return [toNone()];
    }

    return [
      cmd(buildSpaceLayerDebugLogCommand(`[space-layer] swallowed unmapped key in ${stateName}`, debugLogPath)),
      toNone(),
    ];
  };

  const swallowUnmappedManipulators: any[] = [
    ...map('escape')
      .condition(ifVar(spaceModVar, 1))
      .to(escapeResetEvents)
      .build(),
    ...allSublayerVars.flatMap((sublayerVar) =>
      map('escape')
        .condition(ifVar(sublayerVar, 1))
        .to(escapeResetEvents)
        .build()
    ),
    ...map({
      any: 'key_code',
      modifiers: { optional: ['any'] },
    })
      .condition(ifVar(spaceModVar, 1))
      .to(buildSwallowUnmappedEvents('space_mod'))
      .build(),
    ...allSublayerVars.flatMap((sublayerVar) =>
      map({
        any: 'key_code',
        modifiers: { optional: ['any'] },
      })
        .condition(ifVar(sublayerVar, 1))
        .to(buildSwallowUnmappedEvents(sublayerVar))
        .build()
    ),
  ];

  rules.push(
    rule('SPACE layers - swallow unmapped keys').manipulators(swallowUnmappedManipulators)
  );

  return rules;
}
