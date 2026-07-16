import { ifApp, ifDevice, map, rule } from "karabiner.ts";
import {
    mouseTapHold,
    mouseVarTapTapHold,
    resolveMouseButton,
} from "../core/mouse";
import type {
  MouseCondition,
  MouseDeviceConfig,
  MouseDoubleTapMapping,
  mouseRemap,
  MouseMapping,
  MouseSimultaneousMapping,
  MouseTapHoldMapping,
} from "../data/mouse";

function applyDeviceScope(
  manipulators: any[],
  device: MouseDeviceConfig,
  description: string,
) {
  manipulators.forEach((manipulator: any) => {
    manipulator.conditions = [
      ...(manipulator.conditions ?? []),
      ifDevice(device.identifiers).build(),
    ];
    manipulator.description = `${device.name}: ${description}`;
  });
}

function buildMouseRemapManipulators(
  device: MouseDeviceConfig,
  mapping: mouseRemap,
) {
  const pointingButton = resolveMouseButton(mapping.from, device.buttonMap);
  const manipulator = map({ pointing_button: pointingButton });
  mapping.to.forEach((e) => manipulator.to(e));
  if (mapping.eventOptions?.halt) {
    manipulator.toDelayedAction({
      ifInvoked: [],
      ifCanceled: [],
    });
  }
  if (mapping.eventOptions?.repeat) {
    manipulator.parameters({
      "basic.to_if_alone_timeout_milliseconds": 1000,
      "basic.to_if_held_down_threshold_milliseconds": 1000,
    });
  }
  return manipulator.build();
}

function buildSimultaneousManipulators(
  device: MouseDeviceConfig,
  mapping: MouseSimultaneousMapping,
) {
  const buttons = mapping.buttons.map((b) =>
    resolveMouseButton(b, device.buttonMap),
  );
  const manipulator = map({
    simultaneous: buttons.map((b) => ({ pointing_button: b })),
    simultaneous_options: {
      key_down_order: "insensitive" as const,
      key_up_order: "insensitive" as const,
    },
  }).parameters({
    "basic.simultaneous_threshold_milliseconds": mapping.thresholdMs ?? 500,
  });
  mapping.to.forEach((e) => manipulator.to(e));
  return manipulator.build();
}

function overrideCondition(condition: MouseCondition): any {
  if ("app" in condition) {
    return condition.unless
      ? ifApp(condition.app).unless()
      : ifApp(condition.app);
  }
  return {
    type: condition.match === "if" ? "variable_if" : "variable_unless",
    name: condition.variable,
    value: condition.value,
  };
}

function buildOverrideManipulators(
  device: MouseDeviceConfig,
  mapping: MouseTapHoldMapping,
): any[] {
  if (!mapping.overrides?.length) return [];
  const pointingButton = resolveMouseButton(mapping.button, device.buttonMap);
  return mapping.overrides.flatMap((override) => {
    const builder = map({ pointing_button: pointingButton });
    override.to.forEach((event) => builder.to(event));
    override.when
      .map(overrideCondition)
      .forEach((condition) => builder.condition(condition));
    return builder.build();
  });
}

function buildTapHoldManipulators(
  device: MouseDeviceConfig,
  mapping: MouseTapHoldMapping,
) {
  const manipulators = mouseTapHold({
    button: mapping.button,
    buttonMap: device.buttonMap,
    alone: mapping.alone,
    hold: mapping.hold,
    eventOptions: mapping.eventOptions,
    variable: mapping.variable,
    thresholdMs: mapping.thresholdMs,
    timeoutMs: mapping.timeoutMs,
  }).build();

  // Use right button as a pure chord modifier when combined with wheel events.
  // Keep tap-to-right-click via to_if_alone, but suppress cancel fallback clicks.
  if (mapping.button === "right") {
    manipulators.forEach((m: any) => {
      if (m.to_delayed_action?.to_if_canceled) {
        m.to_delayed_action.to_if_canceled = [];
      }
    });
  }

  // Guard against wheel_left/right firing while middle or right_button is pressed.
  if (mapping.button === "wheel_left" || mapping.button === "wheel_right") {
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions ?? [];
      m.conditions.push({
        type: "variable_unless",
        name: "wheel_down",
        value: 1,
      });
      m.conditions.push({
        type: "variable_unless",
        name: "right_button_pressed",
        value: 1,
      });
    });
  }

  // App/variable-conditional overrides, declared as data on the mapping. Built
  // as standalone manipulators and prepended *after* the wheel guard above, so
  // an override that targets a chord (e.g. right_button held) is not suppressed
  // by the guard's variable_unless on that same variable.
  buildOverrideManipulators(device, mapping).forEach((manipulator) =>
    manipulators.unshift(manipulator),
  );

  return manipulators;
}

function buildDoubleTapManipulators(
  device: MouseDeviceConfig,
  mapping: MouseDoubleTapMapping,
) {
  return mouseVarTapTapHold({
    button: mapping.button,
    buttonMap: device.buttonMap,
    firstVar: mapping.firstVar,
    aloneEvents: mapping.aloneEvents,
    holdEvents: mapping.holdEvents,
    tapTapEvents: mapping.tapTapEvents,
    tapTapHoldEvents: mapping.tapTapHoldEvents,
    allowPassThrough: mapping.allowPassThrough,
    thresholdMs: mapping.thresholdMs,
  });
}

function buildManipulatorsForMapping(
  device: MouseDeviceConfig,
  mapping: MouseMapping,
) {
    if (mapping.type === "mouseRemap") {
    return buildMouseRemapManipulators(device, mapping);
  }
  if (mapping.type === "doubleTap") {
    return buildDoubleTapManipulators(device, mapping);
  }
  if (mapping.type === "simultaneous") {
    return buildSimultaneousManipulators(device, mapping);
  }
  return buildTapHoldManipulators(device, mapping);
}

export function buildMouseDeviceRules(device: MouseDeviceConfig) {
  return device.mappings.map((mapping) => {
    const manipulators = buildManipulatorsForMapping(device, mapping);
    applyDeviceScope(manipulators, device, mapping.description);

    return rule(`${device.name}: ${mapping.description}`).manipulators(
      manipulators,
    );
  });
}

export function buildMouseRules(devices: MouseDeviceConfig[]) {
  return devices.flatMap((device) => buildMouseDeviceRules(device));
}
