import { ifApp, ifDevice, map, rule, to$ } from "karabiner.ts";
import { appRegistry } from "../constants";
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

  // Guard against wheel_left/right firing while middle_front or right_button is pressed.
  if (mapping.button === "wheel_left" || mapping.button === "wheel_right") {
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions ?? [];
      m.conditions.push({
        type: "variable_unless",
        name: "middle_front_pressed",
        value: 1,
      });
      m.conditions.push({
        type: "variable_unless",
        name: "right_button_pressed",
        value: 1,
      });
    });
  }

  if (mapping.button === "wheel_left") {
    const zenWheelLeftOverride: any = map({
      pointing_button: resolveMouseButton("wheel_left", device.buttonMap),
    })
      .to(to$('osascript -e \'tell application "System Events" to key code 33 using {control down, shift down}\''))
      .condition(ifApp(appRegistry.browser))
      .build()[0];

    zenWheelLeftOverride.conditions = zenWheelLeftOverride.conditions ?? [];
    zenWheelLeftOverride.conditions.push({
      type: "variable_if",
      name: "right_button_pressed",
      value: 1,
    });

    manipulators.unshift(zenWheelLeftOverride);
  }

  if (mapping.button === "wheel_right") {
    const zenWheelRightOverride: any = map({
      pointing_button: resolveMouseButton("wheel_right", device.buttonMap),
    })
      .to(to$('osascript -e \'tell application "System Events" to key code 30 using {control down, shift down}\''))
      .condition(ifApp(appRegistry.browser))
      .build()[0];

    zenWheelRightOverride.conditions = zenWheelRightOverride.conditions ?? [];
    zenWheelRightOverride.conditions.push({
      type: "variable_if",
      name: "right_button_pressed",
      value: 1,
    });

    manipulators.unshift(zenWheelRightOverride);
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
