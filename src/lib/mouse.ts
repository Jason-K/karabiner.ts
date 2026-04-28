import type { PointingButton, ToEvent } from "karabiner.ts";
import { toPointingButton } from "karabiner.ts";
import { tapHoldFrom, varTapTapHoldFrom } from "./tap-hold";

export type MouseButtonMap = Record<string, PointingButton>;

export const g502xButtons = {
  back: "button4",
  forward: "button6",
  left: "button1",
  left_back: "button11",
  left_forward: "button10",
  left_front: "button10",
  middle_back: "button9",
  middle_front: "button3",
  right: "button2",
  shift: "button5",
  wheel_left: "button7",
  wheel_right: "button8",
} as const satisfies MouseButtonMap;

export type MouseButtonAlias = keyof typeof g502xButtons;
export type MouseButtonRef = string | PointingButton;

function isPointingButton(value: MouseButtonRef): value is PointingButton {
  return /^button([1-9]|[12][0-9]|3[0-2])$/.test(value);
}

export function resolveMouseButton(
  button: MouseButtonRef,
  buttonMap: MouseButtonMap = g502xButtons,
): PointingButton {
  if (isPointingButton(button)) return button;
  const resolved = buttonMap[button];
  if (!resolved) {
    throw new Error(`Unknown mouse button alias: ${button}`);
  }
  return resolved;
}

type MouseTapHoldOpts = {
  button: MouseButtonRef;
  buttonMap?: MouseButtonMap;
  alone?: ToEvent[];
  hold?: ToEvent[];
  timeoutMs?: number;
  thresholdMs?: number;
  description?: string;
  cancel?: ToEvent[];
  invoked?: ToEvent[];
  appOverrides?: Array<{
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

type MouseVarTapTapHoldOpts = {
  button: MouseButtonRef;
  buttonMap?: MouseButtonMap;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  thresholdMs?: number;
  description?: string;
  allowPassThrough?: boolean;
};

export function mouseTapHold({ button, buttonMap = g502xButtons, ...opts }: MouseTapHoldOpts) {
  const pointingButton = resolveMouseButton(button, buttonMap);
  return tapHoldFrom({
    from: { pointing_button: pointingButton },
    ...opts,
  });
}

export function mouseVarTapTapHold({ button, buttonMap = g502xButtons, allowPassThrough, ...opts }: MouseVarTapTapHoldOpts) {
  const pointingButton = resolveMouseButton(button, buttonMap);
  return varTapTapHoldFrom({
    from: { pointing_button: pointingButton },
    passThrough: allowPassThrough
      ? toPointingButton(pointingButton, undefined, { lazy: true })
      : undefined,
    allowPassThrough,
    ...opts,
  });
}
