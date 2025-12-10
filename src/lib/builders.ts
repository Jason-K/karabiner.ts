/**
 * @file builders.ts
 * @description Helper functions for constructing Karabiner-Elements manipulators.
 *
 * ⚠️ LOCAL EXTENSION: This file contains custom builder functions.
 * - Upstream equivalent: None (these are convenience wrappers)
 * - Safe to modify: YES - add your own helpers as needed
 * - Takes precedence: YES - wraps upstream APIs for easier usage
 *
 * This module provides reusable patterns that eliminate boilerplate in rule definitions:
 * - tapHold(): Standard tap-hold behavior with to_delayed_action support
 * - varTapTapHold(): Complex double-tap-hold patterns using variables
 * - cmd(): Convenient wrapper for shell_command events
 * - openApp(): Native frontmost_application_if actions
 * - applescript(): Execute AppleScript files
 * - notify/mouseJump/sleepSystem/doubleClick: System integration helpers
 * - setVarExpr/exprIf/exprUnless: Expression-based conditions (Karabiner 15.6.0+)
 * - withConditions(): Attach conditions to individual to-events
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
    // Bundle ID string (e.g., 'net.sourceforge.skim-app.skim')
    app: string;
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
      // ifApp accepts bundle ID strings; use it directly
      let cond = ifApp(matcher);
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
  aloneEvents?: ToEvent[]; // events when tapped alone (tap)
  holdEvents?: ToEvent[]; // events when held after first tap or alone (tap-hold)
  tapTapEvents?: ToEvent[]; // events when tapped twice (tap-tap)
  tapTapHoldEvents?: ToEvent[]; // events when held after second tap (tap-tap-hold)
  holdMods?: Modifier[]; // optional modifiers for hold using key repeat
}

/**
 * Creates a complex double-tap-hold pattern using variable tracking.
 *
 * BEHAVIOR:
 * 1. First tap alone: Executes aloneEvents
 * 2. First tap held: Executes holdEvents
 * 3. Second tap (within thresholdMs): Executes tapTapEvents
 * 4. Second tap held: Executes tapTapHoldEvents
 *
 * This pattern is used for advanced sequences where tapping once vs twice
 * vs holding all have different behaviors.
 *
 * MANIPULATOR STRUCTURE:
 * - secondTap: Detects when variable is set; handles tap-tap and tap-tap-hold
 * - firstTap: Detects initial keystroke; sets variable and handles tap/tap-hold
 *
 * @param opts Configuration object with variable tracking
 * @returns Array of BasicManipulator objects
 */
export function varTapTapHold({ key, firstVar, aloneEvents, holdEvents, tapTapEvents, tapTapHoldEvents, holdMods, thresholdMs = 300, description }: VarTapTapHoldOpts) {
  // Two manipulators:
  // 1. secondTap (variable_if firstVar=1): Handles tap-tap and tap-tap-hold
  // 2. firstTap (no condition): Sets variable and passes through key with delayed action

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
    description: description || `${key} tap-tap/tap-tap-hold`,
    to_if_alone: [
      toSetVar(firstVar, 0),
      ...(tapTapEvents ?? []),
    ],
    to_if_held_down: [
      toSetVar(firstVar, 0),
      ...(tapTapHoldEvents ?? []),
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
    description: description || `${key} tap/tap-hold prime`,
    to: [
      toSetVar(firstVar, 1),
      toKey(key as any),
    ],
    to_delayed_action: {
      to_if_invoked: [toSetVar(firstVar, 0)],
      to_if_canceled: [toSetVar(firstVar, 0)],
    },
  } as any;

  // If aloneEvents or holdEvents are defined, add them via a separate manipulator
  // to avoid conflicts with the modifier passthrough behavior
  const manipulators: BasicManipulator[] = [secondTap, firstTap];

  if ((aloneEvents && aloneEvents.length > 0) || (holdEvents && holdEvents.length > 0)) {
    const tapHandlerTap: BasicManipulator = {
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
      description: description || `${key} tap/tap-hold handler`,
      to_if_alone: aloneEvents ?? [],
      to_if_held_down: holdEvents ?? [],
    } as any;
    // Insert before secondTap so it has higher priority
    manipulators.unshift(tapHandlerTap);
  }

  return manipulators;
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

// ----------------------------------------------------------------------------
// Script helper utilities
// ----------------------------------------------------------------------------

function shellSingleQuote(str: string): string {
  // Wrap in single quotes, escaping any single quotes inside using the POSIX pattern
  return `'${str.replace(/'/g, `'"'"'`)}'`;
}

function normalizePathForShell(path: string): string {
  // Expand leading ~/ to $HOME/ and wrap in double quotes to allow $HOME expansion
  if (path.startsWith('~/')) {
    return `"$HOME/${path.slice(2)}"`;
  }
  // If already contains $HOME or other vars, keep as-is but quote for spaces
  if (path.startsWith('$HOME/')) {
    return `"${path}"`;
  }
  // Default: quote in double quotes to preserve spaces
  return `"${path}"`;
}

/**
 * Run an AppleScript file via osascript.
 * Example: applescript('~/Scripts/foo.applescript', 'arg1', 'arg2')
 */
export function applescript(scriptPath: string, ...args: string[]): ToEvent {
  const p = normalizePathForShell(scriptPath);
  const parts = ['osascript', p, ...args.map(a => shellSingleQuote(a))];
  return cmd(parts.join(' '));
}

/**
 * Execute inline Hammerspoon Lua code using the hs CLI.
 * Example: hs("hs.openConsole()")
 */
export function hs(code: string): ToEvent {
  const codeQuoted = shellSingleQuote(code);
  return cmd(`/opt/homebrew/bin/hs -c ${codeQuoted}`);
}

/**
 * Run Python (python3) with provided script/arguments.
 * Example: python('~/Scripts/tool.py --flag value')
 */
export function python(spec: string | string[], opts?: { useEnv?: boolean; pythonBin?: string }): ToEvent {
  const pythonBin = opts?.pythonBin ?? 'python3';
  if (Array.isArray(spec)) {
    const joined = spec.map(s => s.includes(' ') ? shellSingleQuote(s) : s).join(' ');
    return cmd(`${pythonBin} ${joined}`);
  }
  // Pass through as-is to preserve things like ~ expansion and flags
  return cmd(`${pythonBin} ${spec}`);
}

/**
 * Run Lua code via the system lua interpreter (-e).
 * Example: lua('print("hello")')
 */
export function lua(code: string): ToEvent {
  const codeQuoted = shellSingleQuote(code);
  return cmd(`lua -e ${codeQuoted}`);
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

// ---------------------------------------------------------------------------
// Upstream-aligned helpers (naming compatibility)
// ---------------------------------------------------------------------------
/**
 * Upstream naming compatibility: withCondition(...conds)(manipulatorsOrEvents)
 * - If given Basic manipulators, append conditions to each.
 * - If given ToEvents, append conditions to those events.
 * Returns an object with build(): any[] for convenience.
 */
export function withCondition(...conditions: any[]) {
  return (items: any | any[]) => {
    const list = Array.isArray(items) ? items : [items];
    const updated = list.map((it) => {
      if (it && typeof it === 'object') {
        // BasicManipulator shape
        if ((it as any).type === 'basic') {
          const m = { ...(it as any) };
          m.conditions = [...(m.conditions || []), ...conditions];
          return m;
        }
        // ToEvent shape
        if ('shell_command' in it || 'set_notification_message' in it || 'software_function' in it || 'set_variable' in it) {
          const e: any = { ...it };
          e.conditions = [...(e.conditions || []), ...conditions];
          return e;
        }
      }
      return it;
    });
    return { build: () => updated } as any;
  };
}

/**
 * Alias for clarity: toKeyWithConditions mirrors toKeyCond behavior.
 */
export function toKeyWithConditions(key: string, mods: Modifier[] = [], opts: any = {}, conditions: any[] = []): ToEvent {
  return toKeyCond(key, mods, opts, conditions);
}

