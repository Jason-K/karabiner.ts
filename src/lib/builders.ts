/**
 * @file builders.ts
 * @description Helper functions for constructing Karabiner-Elements manipulators.
 *
 * This module provides reusable patterns that eliminate boilerplate in rule definitions:
 * - tapHold(): Standard tap-hold behavior with to_delayed_action support
 * - varTapTapHold(): Complex double-tap-hold patterns using variables
 * - cmd(): Convenient wrapper for shell_command events
 *
 * These abstractions make the main configuration file more readable and maintainable.
 */

import type { BasicManipulator, Modifier, ToEvent } from 'karabiner.ts';
import { ifApp, ifVar, map, toSetVar } from 'karabiner.ts';

/**
 * Configuration for basic tap-hold behavior
 */
interface TapHoldOpts {
  key: string;
  alone?: ToEvent[];          // Events if tapped alone
  hold?: ToEvent[];           // Events if held
  timeoutMs?: number;         // to_if_alone_timeout
  thresholdMs?: number;       // to_if_held_down_threshold
  description?: string;
  cancel?: ToEvent[];         // to_if_canceled
  invoked?: ToEvent[];        // to_if_invoked
  variable?: string;          // optional variable to set while held
  // App-specific overrides. Each entry can specify an app matcher (string or regex)
  // and optional negation. If present, a separate manipulator will be generated
  // that applies only when the foremost application matches (or does not match)
  // the provided matcher.
  appOverrides?: Array<{
    app: string | RegExp;
    unless?: boolean; // if true, use foremost_application_unless
    alone?: ToEvent[];
    hold?: ToEvent[];
    timeoutMs?: number;
    thresholdMs?: number;
    cancel?: ToEvent[];
    invoked?: ToEvent[];
  }>;
}

/**
 * Creates a tap-hold manipulator with proper to_delayed_action support.
 *
 * BEHAVIOR:
 * - Tap (quick press): Execute 'alone' events
 * - Hold (press and wait): Execute 'hold' events
 * - to_delayed_action: Ensures clean state transitions
 *
 * TIMING:
 * - timeoutMs: How long before "alone" is considered (default: 400ms)
 * - thresholdMs: How long before "hold" activates (default: 400ms)
 *
 * USAGE:
 * ```typescript
 * tapHold({
 *   key: 'd',
 *   alone: [toKey('d')],
 *   hold: [toKey('left_arrow', ['option'])],
 *   timeoutMs: 200,
 *   thresholdMs: 200
 * })
 * ```
 *
 * @param opts Configuration object
 * @returns map() builder with tap-hold configuration applied
 */
export function tapHold({ key, alone, hold, timeoutMs = 300, thresholdMs = 300, description, cancel, invoked, appOverrides }: TapHoldOpts) {
  // We'll build one or more map builders (one per override + the default)
  const builders: any[] = [];

  const makeBuilder = (opts: { alone?: ToEvent[]; hold?: ToEvent[]; timeoutMs?: number; thresholdMs?: number; cancel?: ToEvent[]; invoked?: ToEvent[]; cond?: any }) => {
    const m = map(key).parameters({
      'basic.to_if_alone_timeout_milliseconds': opts.timeoutMs ?? timeoutMs,
      'basic.to_if_held_down_threshold_milliseconds': opts.thresholdMs ?? thresholdMs,
    });
    if (opts.cond) m.condition(opts.cond);
    if (opts.alone) opts.alone.forEach((e: ToEvent) => m.toIfAlone(e));
    if (opts.hold) opts.hold.forEach((e: ToEvent) => m.toIfHeldDown(e));

    const cancelEvents = opts.cancel ?? cancel ?? alone ?? [];
    const invokedEvents = opts.invoked ?? invoked ?? [];
    m.toDelayedAction(invokedEvents, cancelEvents);
    return m;
  };

  // App-specific overrides (generate builders with app conditions)
  if (appOverrides && Array.isArray(appOverrides)) {
    appOverrides.forEach(ov => {
      const matcher = ov.app;
      // ifApp accepts string or regex; use it directly
      let cond = ifApp(matcher as any);
      if (ov.unless) cond = cond.unless();
      builders.push(makeBuilder({ alone: ov.alone, hold: ov.hold, timeoutMs: ov.timeoutMs, thresholdMs: ov.thresholdMs, cancel: ov.cancel, invoked: ov.invoked, cond }));
    });
  }

  // Default builder (no app condition)
  builders.push(makeBuilder({ alone, hold }));

  // Return an object compatible with existing usage: .build() should return all manipulators
  return {
    build: () => builders.flatMap(b => b.build()),
  };
}

/**
 * Configuration for double-tap-hold patterns with variables
 */
interface VarTapTapHoldOpts extends Omit<TapHoldOpts, 'alone' | 'hold'> {
  key: string;
  firstVar: string; // variable marking first tap
  holdEvents: ToEvent[]; // events when held
  aloneEvents: ToEvent[]; // events when alone
  holdMods?: Modifier[]; // optional modifiers for hold using key repeat
}

/**
 * Creates a complex double-tap-hold pattern using variable tracking.
 *
 * BEHAVIOR:
 * 1. First tap: Sets firstVar=1 for thresholdMs window
 * 2. Second tap within window: Executes different behavior
 * 3. Hold: Executes hold events
 *
 * This pattern is used for advanced sequences like the original "M" rule
 * where tapping once vs twice vs holding all have different behaviors.
 *
 * NOTE: This is kept for reference but not currently used in the main config.
 * The simpler tapHold() function handles most use cases more cleanly.
 *
 * @param opts Configuration object with variable tracking
 * @returns Array of BasicManipulator objects
 */
export function varTapTapHold({ key, firstVar, holdEvents, aloneEvents, holdMods, thresholdMs = 300, description }: VarTapTapHoldOpts) {
  const manip: BasicManipulator[] = [];
  // First condition manipulator (when variable==1)
  manip.push(
    ...map(key)
      .condition(ifVar(firstVar, 1))
      .to(toSetVar(firstVar, 0))
      .toIfAlone(aloneEvents)
      .toIfHeldDown(holdEvents)
      .description(description || `${key} varTapTapHold active`)
      .build()
  );
  // Basic tap/hold (variable independent)
  manip.push(
    ...map(key)
      .toIfAlone(aloneEvents)
      .toIfHeldDown(holdEvents)
      .build()
  );
  // Delayed action setting/resetting variable
  manip.push(
    ...map(key)
      .parameters({ 'basic.to_delayed_action_delay_milliseconds': thresholdMs })
      .to(toSetVar(firstVar, 1))
      .toDelayedAction([toSetVar(firstVar, 0)], [toSetVar(firstVar, 0)])
      .build()
  );
  return manip;
}

/**
 * Creates a shell_command ToEvent.
 *
 * USAGE:
 * ```typescript
 * cmd('open ~/Downloads')
 * cmd('/opt/homebrew/bin/hs -c "doSomething()"')
 * ```
 *
 * This is just a convenience wrapper to make shell commands more readable
 * in rule definitions.
 *
 * @param shell Shell command to execute
 * @returns ToEvent object with shell_command
 */
export function cmd(shell: string): ToEvent {
  return { shell_command: shell } as ToEvent;
}

