/**
 * @file text.ts
 * @description Text manipulation and shell command helpers.
 *
 * ⚠️ LOCAL EXTENSION: This file contains project-specific text utilities.
 * - Upstream equivalent: None
 * - Safe to modify: YES - add your own text processing functions
 * - Takes precedence: YES - supplements upstream with domain-specific logic
 *
 * Provides helpers for common text transformations using external scripts
 * and system commands.
 */

import type { ToEvent } from "karabiner.ts";
import { toKey } from "karabiner.ts";

// Text manipulation helpers intended to emulate common IDE actions
// in editors that lack them (e.g., Word, simple text areas).

// Move cursor to start of line
const lineStart = (): ToEvent => toKey("left_arrow", ["command"]);
// Move cursor to end of line
const lineEnd = (): ToEvent => toKey("right_arrow", ["command"]);

// Select current line (from start to end)
const selectLine = (): ToEvent[] => [
  lineStart(),
  toKey("right_arrow", ["command", "shift"]),
];

// Indent current line by one tab
export function indentLine(): ToEvent[] {
  return [lineStart(), toKey("tab"), lineEnd()];
}

// Unindent current line by one tab (shift+tab)
export function unindentLine(): ToEvent[] {
  return [lineStart(), toKey("tab", ["shift"]), lineEnd()];
}

// Delete the entire current line
export function deleteLine(): ToEvent[] {
  return [...selectLine(), toKey("delete_or_backspace")];
}

// Move current line up by cutting the line and pasting above the previous line
export function moveLineUp(): ToEvent[] {
  return [
    ...selectLine(),
    toKey("x", ["left_command"]), // cut
    toKey("up_arrow"),
    lineStart(),
    toKey("v", ["left_command"]), // paste
  ];
}

// Move current line down by cutting the line and pasting below the next line
export function moveLineDown(): ToEvent[] {
  return [
    ...selectLine(),
    toKey("x", ["left_command"]), // cut
    toKey("down_arrow"),
    lineStart(),
    toKey("v", ["left_command"]), // paste
  ];
}
