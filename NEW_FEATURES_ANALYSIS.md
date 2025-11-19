# Karabiner-Elements Beta Features Analysis (v15.1.0–v15.7.0)

**Date:** November 18, 2025
**Context:** Review of recent Karabiner-Elements beta releases to identify features applicable to our TypeScript-based configuration system.

---

## Recent Notable Features

### Already Implemented

- ✅ **`open_application`** (v15.1.0): Native app launching via `software_function.open_application`
  - Replaces shell commands with faster, more reliable native API
  - Supports `bundle_identifier`, `file_path`, `frontmost_application_history_index`
  - **Status:** Fully integrated via `openApp()` helper in v15.4.0 migration

### High-Priority New Features

#### 1. **App History Switching** (v15.4.0)

- **Feature:** `frontmost_application_history_index` in `open_application`
- **Use Case:** Quick toggle between current and previous app (like Alt+Tab but single key)
- **Implementation:** Add `historyIndex` parameter to existing `openApp()` function
- **Example:**

  ```typescript
  openApp({ historyIndex: 1 })  // Switch to previously active app
  openApp({ historyIndex: 2 })  // Switch to 2nd most recent app
  ```

- **Priority:** HIGH - Natural extension of existing open_application work

#### 2. **Conditional To Events** (v15.4.0)

- **Feature:** `conditions` array inside individual `to` events
- **Use Case:** Per-output conditional branching without duplicating entire manipulators
- **Implementation:** Extend builder types to accept conditions per ToEvent
- **Example:**

  ```typescript
  to: [
    { key_code: 'escape', conditions: [ifApp('com.apple.Terminal')] },
    { key_code: 'tab', conditions: [ifApp('.*', true)] }  // else
  ]
  ```

- **Priority:** MEDIUM - Reduces JSON bloat for app-specific overrides

#### 3. **Expression-Based Variables** (v15.6.0)

- **Features:**
  - `set_variable.expression` / `set_variable.key_up_expression`
  - `expression_if` / `expression_unless` conditions
  - New variable: `system.now.milliseconds`
- **Use Cases:**
  - Counters (track layer usage, toggle states)
  - Time-based conditions (auto-clear layers after idle period)
  - Complex boolean logic (replace chained variable_if/unless)
- **Implementation:** New builder functions for expression-based var setting and conditions
- **Example:**

  ```typescript
  // Increment counter on key press
  setVar('layer_uses', '{{ layer_uses + 1 }}', { expression: true })

  // Auto-clear layer after 5 seconds idle
  ifExpression('system.now.milliseconds - last_layer_activate > 5000')
  ```

- **Priority:** MEDIUM - Enables advanced state management without shell scripts

#### 4. **Integer Value Matching** (v15.6.0)

- **Feature:** `integer_value` in `from` event definition
- **Use Case:** Map raw HID codes (vendor-specific buttons, unmapped keys)
- **Implementation:** Add `integerValue` to from event types
- **Priority:** LOW - Niche use case (foot pedals, programmable buttons)

#### 5. **Notification Messages** (v13.6.0)

- **Feature:** `set_notification_message` to show native macOS notifications
- **Use Case:** Quick feedback for mode changes, sticky modifier toggles
- **Implementation:** Simple builder wrapping notification config
- **Example:**

  ```typescript
  notify('Layer Active', { id: 'layer_status' })

  ```
  
- **Priority:** MEDIUM - Improves UX for non-visual feedback

#### 6. **Mouse Cursor Control** (v13.6.0)

- **Features:**
  - `set_mouse_cursor_position` - Jump cursor to coordinates
  - `cg_event_double_click` - Trigger system double-click
- **Use Cases:**
  - "Center cursor" key (e.g., Space+M+G)
  - Keyboard-driven file opening (double-click under cursor)
- **Implementation:** Builders for cursor positioning and double-click
- **Priority:** LOW - Nice-to-have for keyboard purists

#### 7. **System Power Control** (v14.2.0)

- **Feature:** `iokit_power_management_sleep_system`
- **Use Case:** Quick sleep key (e.g., Space+Power)
- **Implementation:** Simple builder wrapping power management call
- **Priority:** LOW - Single-purpose utility

### Extended Capabilities (Already in Karabiner, underutilized in our config)

#### 8. **Pointing Button Range Expansion** (v15.6.0)

- Buttons 33–255 now supported (was button1–32)
- Enables multi-button mice, pen tablets with side buttons

#### 9. **Programmable Buttons (Consumer Usage Page)** (v15.6.0)

- Foot pedals (e.g., VEC USB Footpedal) now supported
- Application launch buttons on specialized keyboards

---

## Rejected/Clarified Features

### ❌ Environment Variable File (v15.6.0)

**Initial Assessment:** External file for persistent state (e.g., pass-through mode toggle)
**Reality Check:** `/Library/Application Support/org.pqrs/config/karabiner_environment` **only** sets shell environment variables (PATH, LC_ALL, HOME, etc.) inherited by `shell_command` and `open_application` processes. It does **NOT** create Karabiner variables accessible via conditions.
**Actual Use Cases:**

- Add custom script directories to PATH for `shell_command`
- Set locale for internationalization in shell scripts
- Relocate config files via XDG_CONFIG_HOME (not recommended)

**Verdict:** Not applicable for dynamic state management. Use standard `set_variable` + karabiner.json for runtime state.

---

## Implementation Plan

### Phase 1: Quick Wins (Immediate)

1. **App Toggle Builder** - Add `historyIndex` support to `openApp()`
2. **Example Usage** - Demonstrate app toggle in Applications sublayer
3. **Documentation** - Update builder JSDoc with new parameter

**Effort:** ~15 minutes
**Impact:** HIGH - Frequently requested feature

### Phase 2: Notification & Utilities (Short-term)

1. **`notify(message, id?)`** - Native notification builder
2. **`mouseJump({ x, y, screen? })`** - Cursor positioning
3. **`sleepSystem()`** - Power management wrapper
4. **Example Sublayer** - Add "System" sublayer with sleep/cursor actions

**Effort:** ~1 hour
**Impact:** MEDIUM - Improves UX, rounds out feature set

### Phase 3: Expression Support (Mid-term)

1. **Type Updates** - Extend `ToEvent` for expression-based variables
2. **`setVarExpr(name, expr, keyUpExpr?)`** - Expression variable setter
3. **`ifExpression(expr)` / `unlessExpression(expr)`** - Expression conditions
4. **Example** - Time-based layer auto-clear or usage counter

**Effort:** ~2 hours
**Impact:** MEDIUM - Enables advanced patterns, reduces external scripting

### Phase 4: Conditional To Events (Long-term)

1. **Type Refactor** - Add `conditions` to individual ToEvent objects
2. **Builder Support** - Update `map().to()` to accept conditional events
3. **Migration** - Refactor app-specific tapHold overrides to use inline conditions

**Effort:** ~3 hours
**Impact:** HIGH - Major JSON size reduction, cleaner config structure

---

## Priority Matrix

| Feature | Priority | Effort | Impact | Timeline |
|---------|----------|--------|--------|----------|
| App toggle (historyIndex) | HIGH | Low | HIGH | Phase 1 |
| Notification builder | MEDIUM | Low | MEDIUM | Phase 2 |
| Mouse/system utilities | LOW | Low | LOW | Phase 2 |
| Expression variables | MEDIUM | Medium | MEDIUM | Phase 3 |
| Conditional to events | HIGH | High | HIGH | Phase 4 |
| Integer value matching | LOW | Low | LOW | Deferred |

---

## Security & Maintenance Notes

### Environment Variables (`karabiner_environment`)

- ⚠️ Requires root privileges to edit (`sudo nano`)
- ⚠️ Shared across all users on the machine
- ⚠️ Logged in plaintext (`[info] [console_user_server] setenv: ...`)
- ✅ Useful for PATH customization in shell_command workflows
- ❌ **NOT** for dynamic runtime state (use `set_variable` instead)

### Expression Variables

- ⚠️ New syntax in v15.6.0 - ensure compatible Karabiner version
- ⚠️ Expression errors fail silently - test thoroughly
- ✅ Enables stateful logic without shell overhead
- ✅ `system.now.milliseconds` provides high-resolution timing

### Conditional To Events

- ⚠️ Requires karabiner.ts library type updates
- ⚠️ May not be in stable TypeScript definitions yet
- ✅ Massive reduction in generated JSON size
- ✅ Cleaner mental model (one rule, multiple outcomes)

---

## Next Actions

Starting Phase 1 implementation:

1. Add `historyIndex?` parameter to `OpenAppOpts` interface
2. Update `openApp()` to handle history-based switching
3. Add example usage in Applications sublayer (e.g., Tab = toggle last app)
4. Test and verify JSON output structure
