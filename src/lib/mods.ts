/**
 * @file mods.ts
 * @description Custom modifier definitions and keyboard layer constants.
 *
 * This module defines the "hyper key" concept and other custom modifiers that enable
 * more ergonomic keyboard shortcuts without conflicts with existing system shortcuts.
 *
 * PHILOSOPHY:
 * Standard modifier keys (CMD, OPT, CTRL, SHIFT) are heavily used by macOS and apps.
 * By creating multi-modifier combinations, we get a "blank slate" of shortcuts that
 * don't conflict with anything, perfect for custom automation and window management.
 */

import type { Modifier } from 'karabiner.ts';

/**
 * HYPER: CMD + OPT + CTRL
 *
 * The classic "hyper key" combination. Used for system-wide shortcuts that need
 * to be globally accessible without conflicting with application shortcuts.
 *
 * Common uses:
 * - Window management (resize, move, snap)
 * - Global application launcher shortcuts
 * - System automation triggers
 */
export const HYPER: Modifier[] = ['command', 'option', 'control'];

/**
 * SUPER: CMD + OPT + CTRL + SHIFT
 *
 * The ultimate modifier - all four keys at once. Used for critical system functions
 * that should never accidentally trigger. Typically bound to CAPS+SHIFT in this config.
 *
 * Common uses:
 * - System-level administration shortcuts
 * - Rarely-used but important functions
 * - Functions that need maximum conflict avoidance
 */
export const SUPER: Modifier[] = ['command', 'option', 'control', 'shift'];

/**
 * MEH: CMD + OPT + SHIFT
 *
 * Similar to HYPER but without CTRL. Useful when CTRL is needed for other purposes
 * or when you want a slightly easier modifier combination. Typically bound to CAPS+CTRL.
 *
 * Common uses:
 * - Secondary tier of global shortcuts
 * - Application-specific power user features
 * - Keyboard layer activation
 */
export const MEH: Modifier[] = ['command', 'option', 'shift'];

/**
 * L: Left-hand modifier shortcuts
 *
 * Type-safe constants for explicitly specifying left-side modifiers.
 * Useful when you need deterministic behavior or want to preserve the right
 * modifiers for other simultaneous keypresses.
 */
export const L = {
  cmd: 'left_command' as const,
  opt: 'left_option' as const,
  ctrl: 'left_control' as const,
  shift: 'left_shift' as const,
};

/** R: Right-hand modifier shortcuts
 *
 * Type-safe constants for explicitly specifying right-side modifiers.
 * Useful when you need deterministic behavior or want to preserve the left
 * modifiers for other simultaneous keypresses.
 */

export const R = {
  cmd: 'right_command' as const,
  opt: 'right_option' as const,
  ctrl: 'right_control' as const,
  shift: 'right_shift' as const,
};

/**
 * Ms: Milliseconds type alias
 *
 * Used for timing parameters in manipulator definitions to make the code
 * more self-documenting.
 */
export type Ms = number;

