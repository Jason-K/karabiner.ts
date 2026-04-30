import { ifDevice, map, rule } from "karabiner.ts";
import {
  mouseTapHold,
  mouseVarTapTapHold,
  resolveMouseButton,
} from "../lib/mouse";
import type {
  MouseDeviceConfig,
  MouseDoubleTapMapping,
  MouseMapping,
  MouseSimultaneousMapping,
  MouseTapHoldMapping,
} from "../mappings/mouse";

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

function buildTapHoldManipulators(
  device: MouseDeviceConfig,
  mapping: MouseTapHoldMapping,
) {
  const manipulators = mouseTapHold({
    button: mapping.button,
    buttonMap: device.buttonMap,
    alone: mapping.alone,
    hold: mapping.hold,
    variable: mapping.variable,
    thresholdMs: mapping.thresholdMs,
    timeoutMs: mapping.timeoutMs,
  }).build();

  // Guard against devices that emit wheel_left/right while middle_front is pressed.
  if (mapping.button === "wheel_left" || mapping.button === "wheel_right") {
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions ?? [];
      m.conditions.push({
        type: "variable_unless",
        name: "middle_front_pressed",
        value: 1,
      });
    });
  }

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
