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
import { ifApp, map, toKey, toSetVar } from 'karabiner.ts';

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
    const m = map(key as any).parameters({
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
  // New implementation matches requested JSON exactly:
  // Two manipulators:
  // 1. Second tap (variable_if firstVar=1) with to_if_alone / to_if_held_down ordering: clear var then action
  // 2. First tap (no variable yet) sets variable then passes through key, with delayed action resetting var

  const secondTap: BasicManipulator = {
    type: 'basic',
    from: {
      key_code: key as any,
      modifiers: { optional: ['any'] },
    },
    conditions: [
      { type: 'variable_if', name: firstVar, value: 1 },
    ],
    parameters: {
      'basic.to_if_alone_timeout_milliseconds': thresholdMs,
      'basic.to_if_held_down_threshold_milliseconds': thresholdMs,
    },
    description: description || `${key} tap-tap active`,
    to_if_alone: [
      toSetVar(firstVar, 0),
      ...aloneEvents,
    ],
    to_if_held_down: [
      toSetVar(firstVar, 0),
      ...holdEvents,
    ],
  } as any;

  const firstTap: BasicManipulator = {
    type: 'basic',
    from: {
      key_code: key as any,
      modifiers: { optional: ['any'] },
    },
    parameters: {
      'basic.to_delayed_action_delay_milliseconds': thresholdMs,
    },
    description: description || `${key} tap-tap prime`,
    to: [
      toSetVar(firstVar, 1),
      toKey(key as any),
    ],
    to_delayed_action: {
      to_if_invoked: [toSetVar(firstVar, 0)],
      to_if_canceled: [toSetVar(firstVar, 0)],
    },
  } as any;

  return [secondTap, firstTap];
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

/**
 * Configuration for open_application software function
 */
export interface OpenAppOpts {
  bundleIdentifier?: string;              // Bundle ID (e.g., 'com.apple.Safari')
  filePath?: string;                      // File path (e.g., '/Applications/Safari.app')
  historyIndex?: number;                  // Frontmost app history index (1 = most recent)
  exclusionBundleIdentifiers?: string[];  // Regex patterns to exclude (with historyIndex)
  exclusionFilePaths?: string[];          // Regex patterns to exclude (with historyIndex)
}

/**
 * Creates an open_application software_function ToEvent.
 *
 * Opens an application or brings it to focus using Karabiner's native function.
 * This is faster and more reliable than using shell commands.
 *
 * USAGE:
 * ```typescript
 * // Open by bundle ID
 * openApp({ bundleIdentifier: 'com.apple.Safari' })
 *
 * // Open by file path
 * openApp({ filePath: '/Applications/Safari.app' })
 *
 * // Switch to most recently used app
 * openApp({ historyIndex: 1 })
 *
 * // Switch to most recent app excluding certain apps
 * openApp({
 *   historyIndex: 1,
 *   exclusionBundleIdentifiers: ['^com\\.apple\\.Safari$', '^com\\.apple\\.Preview$']
 * })
 * ```
 *
 * NOTE: Either bundleIdentifier, filePath, or historyIndex must be specified.
 * When multiple are specified, the highest-priority one is used (bundleIdentifier > filePath > historyIndex).
 *
 * @param opts Configuration object
 * @returns ToEvent object with software_function.open_application
 */
export function openApp(opts: OpenAppOpts): ToEvent {
  const openAppConfig: any = {};

  if (opts.bundleIdentifier) {
    openAppConfig.bundle_identifier = opts.bundleIdentifier;
  }
  if (opts.filePath) {
    openAppConfig.file_path = opts.filePath;
  }
  if (opts.historyIndex !== undefined) {
    openAppConfig.frontmost_application_history_index = opts.historyIndex;
  }
  if (opts.exclusionBundleIdentifiers) {
    openAppConfig.frontmost_application_history_exclusion_bundle_identifiers = opts.exclusionBundleIdentifiers;
  }
  if (opts.exclusionFilePaths) {
    openAppConfig.frontmost_application_history_exclusion_file_paths = opts.exclusionFilePaths;
  }

  return {
    software_function: {
      open_application: openAppConfig
    }
  } as ToEvent;
}

/**
 * Configuration for notification messages
 */
interface NotifyOpts {
  message: string;  // Text to display in notification
  id?: string;      // Optional identifier for notification
}

/**
 * Creates a set_notification_message ToEvent to display native macOS notifications.
 *
 * Useful for providing feedback on mode changes, sticky modifier states, etc.
 *
 * USAGE:
 * ```typescript
 * notify({ message: 'Layer Active', id: 'layer_status' })
 * notify({ message: 'Caps Lock Enabled' })
 * ```
 *
 * @param opts Notification configuration
 * @returns ToEvent object with set_notification_message
 */
export function notify(opts: NotifyOpts): ToEvent {
  const config: any = { text: opts.message };
  if (opts.id) config.id = opts.id;
  return { set_notification_message: config } as ToEvent;
}

/**
 * Configuration for mouse cursor positioning
 */
interface MouseJumpOpts {
  x: number;        // X coordinate (pixels from left edge)
  y: number;        // Y coordinate (pixels from top edge)
  screen?: number;  // Screen index (0 = primary, 1 = secondary, etc.)
}

/**
 * Creates a set_mouse_cursor_position software_function ToEvent.
 *
 * Moves the mouse cursor to absolute screen coordinates.
 *
 * USAGE:
 * ```typescript
 * // Center of primary screen (assuming 1920x1080)
 * mouseJump({ x: 960, y: 540 })
 *
 * // Top-left corner of secondary screen
 * mouseJump({ x: 0, y: 0, screen: 1 })
 * ```
 *
 * @param opts Cursor position configuration
 * @returns ToEvent object with software_function.set_mouse_cursor_position
 */
export function mouseJump(opts: MouseJumpOpts): ToEvent {
  const config: any = { x: opts.x, y: opts.y };
  if (opts.screen !== undefined) config.screen = opts.screen;
  return {
    software_function: {
      set_mouse_cursor_position: config
    }
  } as ToEvent;
}

/**
 * Creates an iokit_power_management_sleep_system software_function ToEvent.
 *
 * Puts the Mac to sleep immediately.
 *
 * USAGE:
 * ```typescript
 * sleepSystem()
 * ```
 *
 * @returns ToEvent object with software_function.iokit_power_management_sleep_system
 */
export function sleepSystem(): ToEvent {
  return {
    software_function: {
      iokit_power_management_sleep_system: {}
    }
  } as ToEvent;
}

/**
 * Creates a cg_event_double_click software_function ToEvent.
 *
 * Triggers a system double-click at the current cursor position.
 * Useful for keyboard-driven file opening.
 *
 * USAGE:
 * ```typescript
 * doubleClick({ button: 0 })  // Left button (button 0)
 * ```
 *
 * @param button Mouse button number (0 = left, 1 = right, 2 = middle)
 * @returns ToEvent object with software_function.cg_event_double_click
 */
export function doubleClick(button: number = 0): ToEvent {
  return {
    software_function: {
      cg_event_double_click: { button }
    }
  } as ToEvent;
}

// ============================================================================
// EXPRESSION SUPPORT (Phase 3)
// ============================================================================
/**
 * Creates a set_variable event using expression-based assignment (Karabiner v15.6.0+).
 *
 * When expression mode is used, value is ignored and the expression string is evaluated
 * by Karabiner using the Mustache-like template syntax (e.g. {{ var + 1 }}).
 *
 * @param name Variable name to set
 * @param expression Expression string (without surrounding spaces requirement)
 * @param keyUpExpression Optional expression evaluated on key up
 */
export function setVarExpr(name: string, expression: string, keyUpExpression?: string): ToEvent {
  const payload: any = { name };
  if (expression) payload.expression = expression;
  if (keyUpExpression) payload.key_up_expression = keyUpExpression;
  return { set_variable: payload } as ToEvent;
}

/** Create an expression_if condition object */
export function exprIf(expression: string): any {
  return { type: 'expression_if', value: expression };
}
/** Create an expression_unless condition object */
export function exprUnless(expression: string): any {
  return { type: 'expression_unless', value: expression };
}

// ============================================================================
// PER-TO EVENT CONDITIONS (Phase 4)
// ============================================================================
/**
 * Attach conditions to a key event (per-`to` conditional branching).
 * This helper wraps toKey and injects the `conditions` array directly on the returned event.
 */
export function toKeyCond(key: string, mods: Modifier[] = [], opts: any = {}, conditions: any[] = []): ToEvent {
  const ev = toKey(key as any, mods as any, opts);
  (ev as any).conditions = conditions;
  return ev as ToEvent;
}

/**
 * Generic helper to attach conditions to any ToEvent (non-key events).
 */
export function withConditions(event: ToEvent, conditions: any[] = []): ToEvent {
  const cloned: any = { ...event };
  if (conditions.length) cloned.conditions = conditions;
  return cloned as ToEvent;
}

