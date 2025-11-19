# New Builder Functions - Usage Guide

## Overview

This document demonstrates the new builder functions added to support Karabiner-Elements v15.x features.

---

## App History Switching

### `openApp({ historyIndex: number })`

Switch to recently used applications without knowing their bundle IDs.

**Parameters:**

- `historyIndex: 1` - Most recently used app (like Alt+Tab behavior)
- `historyIndex: 2` - Second most recent app
- etc.

**Optional Exclusions:**

- `exclusionBundleIdentifiers: string[]` - Regex patterns to skip
- `exclusionFilePaths: string[]` - File path patterns to skip

**Example - Quick App Toggle:**

```typescript

// HYPER+TAB: Toggle between current and previous app

const appToggleRule = rule('Toggle to most recent app').manipulators([
  ...map('tab', HYPER)
    .to([openApp({ historyIndex: 1 })])
    .build()
]);

// Space+A then Tab: Same behavior in Applications sublayer

spaceLayers: [{
  layerKey: 'a',
  layerName: 'Applications',
  mappings: {
    tab: { description: 'Toggle Last App', openAppOpts: { historyIndex: 1 } }
  }
}]

```

**Example - Exclude Certain Apps:**

```typescript

// Toggle to previous app, but skip Terminal and VS Code

openApp({
  historyIndex: 1,
  exclusionBundleIdentifiers: [
    '^com\\.apple\\.Terminal$',
    '^com\\.microsoft\\.VSCode'
  ]
})

```

---

## Notification Messages

### `notify({ message: string, id?: string })`

Display native macOS notifications for mode changes, confirmations, etc.

**Parameters:**

- `message: string` - Text to display
- `id?: string` - Optional identifier (allows replacing existing notification)

**Example - Mode Feedback:**

```typescript

// Show notification when entering a special mode

...map('f18', HYPER)
  .to([
    toSetVar('focus_mode', 1),
    notify({ message: 'Focus Mode Active', id: 'mode_status' })
  ])
  .build()

// Clear notification when exiting

...map('f18', HYPER)
  .condition(ifVar('focus_mode', 1))
    toSetVar('focus_mode', 0),
    notify({ message: 'Focus Mode Disabled', id: 'mode_status' })
  ])
  .build()

```

**Example - Sticky Modifier Feedback:**

```typescript

// Caps Lock toggle notification

...map('caps_lock')
  .toIfAlone([
    toStickyModifier('left_shift', 'toggle'),
    notify({ message: 'Caps Lock Toggled' })
  ])
  .build()

```

---

## Mouse Cursor Control

### `mouseJump({ x: number, y: number, screen?: number })`

Move mouse cursor to absolute screen coordinates.

**Parameters:**

- `x: number` - Horizontal position (pixels from left)
- `y: number` - Vertical position (pixels from top)
- `screen?: number` - Screen index (0 = primary, 1 = secondary, etc.)

**Example - Center Cursor:**

```typescript
// HYPER+M: Jump to center of primary screen (1920x1080)
...map('m', HYPER)
  .to([mouseJump({ x: 960, y: 540 })])
  .build()

// For 2560x1440 displays:
mouseJump({ x: 1280, y: 720 })

// For 4K displays (3840x2160):
mouseJump({ x: 1920, y: 1080 })
```

**Example - Multi-Monitor Setup:**

```typescript

// Jump to center of secondary monitor
...map('comma', HYPER)
  .to([mouseJump({ x: 1920, y: 540, screen: 1 })])
  .build()

// Top-left of primary
...map('period', HYPER)
  .build()

```

**Note:** Coordinates are absolute pixel positions. To find your screen resolution:

```bash

system_profiler SPDisplaysDataType | grep Resolution


```

---

## System Power Control

### `sleepSystem()`

Immediately put the Mac to sleep.

**Example - Quick Sleep Key:**

```typescript
// HYPER+S: Sleep system
...map('s', HYPER)
  .to([sleepSystem()])
  .build()

// Space+Z+S: Sleep via sublayer
spaceLayers: [{
  layerKey: 'z',
  layerName: 'System',
  mappings: {
    s: { description: 'Sleep Mac', command: 'pmset sleepnow' }
    // Note: command fallback shown; in future we'll support ToEvent directly
  }
}]
```

**Caution:** No confirmation dialog. Use a modifier combo to prevent accidents.

---

## Double Click

### `doubleClick(button?: number)`

Trigger a system double-click at the current cursor position.

**Parameters:**

- `button?: number` - Mouse button (0 = left [default], 1 = right, 2 = middle)

**Example - Keyboard-Driven File Opening:**

```typescript
// HYPER+O: Double-click to open file under cursor
...map('o', HYPER)
  .to([doubleClick()])
  .build()

// Combined with cursor positioning for precise control:
...map('o', HYPER)
  .to([
    mouseJump({ x: 960, y: 540 }),  // Center screen
    doubleClick()                    // Open centered item
  ])
  .build()
```

---

## Combining Builders

### Workflow Example: Smart App Launcher

```typescript
// HYPER+L: Launch or toggle to last app, with feedback
const smartLauncherRule = rule('Smart Launcher').manipulators([
  ...map('l', HYPER)
    .to([
      openApp({ historyIndex: 1 }),
      notify({ message: 'Switching Apps...', id: 'launcher' })
    ])
    .build()
]);
```

### Workflow Example: Multi-Monitor Cursor Management

```typescript

// Numpad navigation for cursor positioning across monitors
const cursorNavRule = rule('Multi-Monitor Cursor Nav').manipulators([
  // Primary monitor quadrants
  ...map('keypad_7', HYPER).to([mouseJump({ x: 480, y: 270 })]).build(),     // Top-left
  ...map('keypad_9', HYPER).to([mouseJump({ x: 1440, y: 270 })]).build(),    // Top-right
  ...map('keypad_1', HYPER).to([mouseJump({ x: 480, y: 810 })]).build(),     // Bottom-left
  ...map('keypad_3', HYPER).to([mouseJump({ x: 1440, y: 810 })]).build(),    // Bottom-right
  ...map('keypad_5', HYPER).to([mouseJump({ x: 960, y: 540 })]).build(),     // Center

  // Secondary monitor center
  ...map('keypad_0', HYPER).to([mouseJump({ x: 1920, y: 540, screen: 1 })]).build(),
]);

```

---

## Current Limitations

### SubLayer ToEvent Support

The `SubLayerConfig` type currently uses:

- `command: string` for shell commands
- `openAppOpts: OpenAppOpts` for app launching
- `actions: Array<{type, value}>` for multi-step sequences

**Workaround for new builders:**

Use regular rules with HYPER/SUPER modifiers instead of sublayers:

```typescript

// Instead of sublayer:
spaceLayers: [{
  mappings: {
    s: { /* can't use sleepSystem() directly */ }
  }
}]

// Use standalone rule:
...map('s', HYPER).to([sleepSystem()]).build()
```

**Future Enhancement:**
Extend `SubLayerConfig` to accept `toEvents?: ToEvent[]` for direct builder usage.

---

## Testing

After adding new rules:

1. **Build:** `npm run build`
2. **Verify JSON:** Check `karabiner-output.json` for expected structures
3. **Test:** Try each key combo in Karabiner-EventViewer
4. **Debug:** Watch for notifications, cursor movement, app switching

**Grep Checks:**

```bash
# Verify app history switching
grep -n "frontmost_application_history_index" karabiner-output.json

# Verify system sleep
grep -n "iokit_power_management_sleep_system" karabiner-output.json

# Verify notifications
grep -n "set_notification_message" karabiner-output.json

# Verify cursor control
grep -n "set_mouse_cursor_position" karabiner-output.json
```

---

## Next Steps

### Phase 3: Expression Variables (Planned)

- `setVarExpr(name, expression)` - Computed variables
- `ifExpression(expr)` / `unlessExpression(expr)` - Conditional logic
- `system.now.milliseconds` - High-resolution timing

**Use Cases:**

- Usage counters
- Time-based layer auto-clear
- Complex boolean conditions

### Phase 4: Conditional To Events (Planned)

- Per-output conditions instead of duplicating manipulators
- Reduces JSON size for app-specific overrides
- Cleaner mental model

---

## Reference

### Karabiner Documentation

- [open_application](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/open_application/)
- [set_notification_message](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/set-notification-message/)
- [set_mouse_cursor_position](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/set_mouse_cursor_position/)
- [iokit_power_management_sleep_system](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/iokit_power_management_sleep_system/)
- [cg_event_double_click](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/cg_event_double_click/)

### Implementation Files

- `src/lib/builders.ts` - Builder function definitions
- `src/index.ts` - Usage examples and configuration
- `NEW_FEATURES_ANALYSIS.md` - Feature analysis and roadmap
