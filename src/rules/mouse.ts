import { ifDevice, rule } from "karabiner.ts";
import { mouseTapHold, mouseVarTapTapHold } from "../lib/mouse";
import type {
    MouseDeviceConfig,
    MouseDoubleTapMapping,
    MouseMapping,
    MouseTapHoldMapping,
} from "../mappings/mouse";

function applyDeviceScope(manipulators: any[], device: MouseDeviceConfig, description: string) {
  manipulators.forEach((manipulator: any) => {
    manipulator.conditions = [
      ...(manipulator.conditions ?? []),
      ifDevice(device.identifiers).build(),
    ];
    manipulator.description = `${device.name}: ${description}`;
  });
}

function buildTapHoldManipulators(device: MouseDeviceConfig, mapping: MouseTapHoldMapping) {
  return mouseTapHold({
    button: mapping.button,
    buttonMap: device.buttonMap,
    alone: mapping.alone,
    hold: mapping.hold,
    thresholdMs: mapping.thresholdMs,
    timeoutMs: mapping.timeoutMs,
  }).build();
}

function buildDoubleTapManipulators(device: MouseDeviceConfig, mapping: MouseDoubleTapMapping) {
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

function buildManipulatorsForMapping(device: MouseDeviceConfig, mapping: MouseMapping) {
  if (mapping.type === "doubleTap") {
    return buildDoubleTapManipulators(device, mapping);
  }
  return buildTapHoldManipulators(device, mapping);
}

export function buildMouseDeviceRules(device: MouseDeviceConfig) {
  return device.mappings.map((mapping) => {
    const manipulators = buildManipulatorsForMapping(device, mapping);
    applyDeviceScope(manipulators, device, mapping.description);

    return rule(`${device.name}: ${mapping.description}`).manipulators(manipulators);
  });
}

export function buildMouseRules(devices: MouseDeviceConfig[]) {
  return devices.flatMap((device) => buildMouseDeviceRules(device));
}
