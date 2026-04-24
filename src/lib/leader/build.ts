import type { ToEvent } from 'karabiner.ts';
import { ifVar, map, rule, toKey, toNone, toSetVar, toStickyModifier } from 'karabiner.ts';

import { resolveActionToEvents } from "../../generators/action-resolver";
import { setVarExpr } from '../conditions';
import { L } from '../mods';
import { formatRuleDescription } from "../rule-descriptions";
import { cmd, layerIndicatorCommand } from '../scripts';
import { openApp } from '../software';
import {
    buildLayerDebugLogCommand,
    getAllSublayerVars,
    getNestedSublayerVarName,
    getSublayerVarName,
} from './runtime';
import type { LayerMappingConfig, LayerRuleOptions, SubLayerConfig } from './types';

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
        events.push(...resolveActionToEvents(action));
      });
    } else if (config.action) {
      events.push(...resolveActionToEvents(config.action));
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
      events.push(toStickyModifier(stickyKey as any, "toggle"));
    } else if (config.key) {
      // If passModifiers is true, use 'any' modifiers to pass through from source key
      if (config.passModifiers) {
        events.push(toKey(config.key as any, "any" as any));
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

export function generateLayerRules(
  layerConfigs: SubLayerConfig[],
  options: LayerRuleOptions = {}
): any[] {
  const rules: any[] = [];
  const layerPrefix = options.layerPrefix ?? 'leader';
  const leaderLabel = options.leaderLabel ?? layerPrefix.toUpperCase();
  const leaderKey = options.leaderKey ?? 'f18';
  const indicatorRootLayer = options.indicatorRootLayer ?? layerPrefix;
  const leaderVar = `${layerPrefix}_mod`;
  const allSublayerVars = getAllSublayerVars(layerConfigs, layerPrefix);
  const leaderHoldEvents = options.leaderHoldEvents ?? [];
  const resetVars = options.resetVars ?? [
    'caps_lock_pressed',
    'command_q_pressed',
    'ctrl_opt_esc_first',
    'cmd_d_ready',
  ];
  const debugSwallowedKeys = options.debugSwallowedKeys ?? false;
  const debugLogPath = options.debugLogPath;

  // Leader key activates the layer
  const leaderManipulator = map(leaderKey as any)
    .toIfAlone([
      toKey(leaderKey as any, [], { halt: true }),
      toSetVar(leaderVar, 0),
      ...allSublayerVars.map((v) => toSetVar(v, 0)),
    ])
    .toIfHeldDown([
      ...leaderHoldEvents,
      toSetVar(leaderVar, 1),
      layerIndicatorCommand("show", indicatorRootLayer),
    ])
    .toAfterKeyUp([
      toSetVar(leaderVar, 0),
      ...allSublayerVars.map((v) => toSetVar(v, 0)),
      // Ensure sticky modifiers are cleared when leaving leader mode
      toStickyModifier(L.shift, "off"),
      toStickyModifier(L.opt, "off"),
      toStickyModifier(L.cmd, "off"),
      toStickyModifier(L.ctrl, "off"),
      layerIndicatorCommand("hide"),
    ])
    .toDelayedAction(
      [],
      [
        toKey(leaderKey as any),
        toSetVar(leaderVar, 0),
        ...allSublayerVars.map((v) => toSetVar(v, 0)),
      ],
    )
    .parameters({
      "basic.to_if_alone_timeout_milliseconds": 200,
      "basic.to_if_held_down_threshold_milliseconds": 200,
    });

  rules.push(
    rule(
      formatRuleDescription(leaderKey, `${leaderLabel} layer`, "hold"),
    ).manipulators(leaderManipulator.build()),
  );

  // Generate sublayer rules
  layerConfigs.forEach(({ layerKey, layerName, mappings, releaseLayer = true, subLayers }) => {
    const sublayerVar = getSublayerVarName(layerPrefix, layerKey);
    const sublayerActivateTimeVar = `${layerPrefix}_${layerKey}_activate_ms`;
    const allManipulators: any[] = [];

    // Sublayer activation - pressing layerKey while leader is held
    allManipulators.push(
      ...map(layerKey as any)
        .condition(ifVar(leaderVar, 1))
        .to([
          toSetVar(sublayerVar, 1),
          toSetVar(leaderVar, 0),
          // Record activation timestamp (Phase 3 expression support)
          setVarExpr(sublayerActivateTimeVar, '{{ system.now.milliseconds }}'),
          layerIndicatorCommand('show', `${indicatorRootLayer}_${layerKey.toUpperCase()}`)
        ])
        .build()
    );

    // Sublayer key mappings
    allManipulators.push(
      ...buildSublayerManipulators(mappings, sublayerVar, releaseLayer)
    );

    // Add single rule with all manipulators for this sublayer
    rules.push(
      rule(
        formatRuleDescription(
          [leaderKey, layerKey],
          `${layerName} layer`,
          "tap",
        ),
      ).manipulators(allManipulators),
    );

    // Nested sublayers (second-level)
    (subLayers || []).forEach((subLayer) => {
      const nestedVar = getNestedSublayerVarName(layerPrefix, layerKey, subLayer.layerKey);
      const nestedActivateTimeVar = `${layerPrefix}_${layerKey}_${subLayer.layerKey}_activate_ms`;
      const nestedManipulators: any[] = [];

      nestedManipulators.push(
        ...map(subLayer.layerKey as any)
          .condition(ifVar(sublayerVar, 1))
          .to([
            toSetVar(nestedVar, 1),
            toSetVar(sublayerVar, 0),
            setVarExpr(nestedActivateTimeVar, '{{ system.now.milliseconds }}'),
            layerIndicatorCommand('show', `${indicatorRootLayer}_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}`)
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
        rule(
          formatRuleDescription(
            [leaderKey, layerKey, subLayer.layerKey],
            `${subLayer.layerName} layer`,
            "tap",
          ),
        ).manipulators(nestedManipulators),
      );
    });
  });

  // Swallow any unmapped keystrokes while leader mode is active.
  // This prevents accidental input from leaking through to the frontmost app.
  const escapeResetEvents: ToEvent[] = [
    toKey('escape'),
    toSetVar(leaderVar, 0),
    ...allSublayerVars.map((v) => toSetVar(v, 0)),
    ...resetVars.map((resetVar) => toSetVar(resetVar, 0)),
    toStickyModifier(L.shift, 'off'),
    toStickyModifier(L.opt, 'off'),
    toStickyModifier(L.cmd, 'off'),
    toStickyModifier(L.ctrl, 'off'),
  ];

  const buildSwallowUnmappedEvents = (stateName: string): ToEvent[] => {
    if (!debugSwallowedKeys || !debugLogPath) {
      return [toNone()];
    }

    return [
      cmd(buildLayerDebugLogCommand(`[leader-layer] swallowed unmapped key in ${stateName}`, debugLogPath)),
      toNone(),
    ];
  };

  const swallowUnmappedManipulators: any[] = [
    ...map('escape')
      .condition(ifVar(leaderVar, 1))
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
      .condition(ifVar(leaderVar, 1))
      .to(buildSwallowUnmappedEvents(leaderVar))
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
    rule(
      formatRuleDescription(
        leaderKey,
        `${leaderLabel} unmapped-key guard`,
        "hold",
      ),
    ).manipulators(swallowUnmappedManipulators),
  );

  return rules;
}
