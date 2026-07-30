export const TIMINGS = {
  holdMs: 400,
  aloneMs: 1000,
  delayedMs: 300,
  simultaneousMs: 50,
  delayLeaderHoldMs: 200,
  timeoutDoubleTapMs: 300,
  timeoutWheelChordMs: 200,
  privilegesPostElevationDelayMs: 1000,
  privDelaySec: 0.2,
} as const;

export const DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS = {
  aloneMs: 1000,
  holdMs: 400,
  delayedMs: 300,
} as const;

export const DEFAULT_MOUSE_MANIPULATOR_TIMINGS = {
  aloneMs: 1000,
  holdMs: 400,
  delayedMs: 300,
} as const;

