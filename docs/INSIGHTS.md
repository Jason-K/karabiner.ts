# Insights: Left Command Double-Tap Implementation

## Overview

This document captures lessons learned from implementing a complex left command key behavior with three distinct actions:

1. **Tap alone**: Acts as normal left command modifier (pass-through)
2. **Double-tap**: Switch to last application
3. **Hold (>650ms)**: Emit f13 down, release f13 on key up

## Initial Requirements

The user needed precise behavior differentiation:

- Single press and release within 650ms with no other keys = normal command modifier
- Single press combined with other keys = normal command modifier
- Two presses within 650ms (without other keys) = switch to last app
- Press held for >650ms = emit f13 down, then f13 up on release

## What Didn't Work

### Attempt 1: Using `varTapTapHold` Builder

**Issue**: The `varTapTapHold` builder was originally designed for hold-based double-tap detection but didn't properly support the variable tracking needed for our three-way behavior split.

**Why it failed**:

- The builder always fired `to_if_held_down` on hold, but we needed finer control over when the variable was set
- The variable tracking assumed the variable would only be set when truly needed
- Custom per-tap logic wasn't easily expressed within the builder's constraints

### Attempt 2: Initial Custom Manipulator (Incorrect Condition)

**Issue**: Added `{ type: "variable_unless", name: "lcmd_first_tap", value: 1 }` to the first manipulator to prevent it from setting the variable twice.

**Why it failed**:

- This condition was too restrictive—it prevented the first manipulator from firing on the second press entirely
- The second manipulator depends on the variable being set, but the first manipulator's condition made it impossible for the second press to be detected
- Karabiner's EventViewer showed `lcmd_first_tap` was never being set because the first manipulator couldn't fire

**Key insight**: Conditions act as guards that prevent the entire manipulator from firing. Adding a `variable_unless` condition to prevent duplicate variable sets doesn't work—it prevents the manipulator from running at all.

### Attempt 3: Following Incorrect Double-Tap Pattern

**Issue**: Added timing parameters (`basic.to_if_alone_timeout_milliseconds`) to the second manipulator (double-tap detector).

**Why it failed**:

- The second manipulator shouldn't need timeout parameters—its sole job is to detect when the variable is already set
- Timing parameters create conflicting timeout behaviors between the two manipulators
- The official Karabiner pattern for double-tap doesn't include timing on the second manipulator

## Solution: Official Karabiner Double-Tap Pattern

### The Pattern

The official Karabiner documentation provides the canonical double-tap implementation pattern (see: [Change double press of `q` to `escape`](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/)).

**Structure**:

```typescript
// Second manipulator: Detects double-tap
{
  type: "basic",
  from: { key_code: "left_command", modifiers: { optional: ["any"] } },
  conditions: [
    { type: "variable_if", name: "lcmd_pressed", value: 1 },
    // No timing parameters!
  ],
  to: [
    { set_variable: { name: "lcmd_pressed", value: 0 } },
    // Double-tap action here
  ],
}

// First manipulator: Sets up double-tap detection and handles hold
{
  type: "basic",
  from: { key_code: "left_command", modifiers: { optional: ["any"] } },
  parameters: {
    "basic.to_if_held_down_threshold_milliseconds": 650,
    "basic.to_delayed_action_delay_milliseconds": 650,
  },
  to: [
    { set_variable: { name: "lcmd_pressed", value: 1 } },
    toKey("left_command", [], { lazy: true }),
  ],
  to_if_held_down: [
    // Hold action here
  ],
  to_delayed_action: {
    to_if_invoked: [
      // Single-tap action: emit left_command back (with condition to only do if variable still set)
    ],
    to_if_canceled: [
      // Single-tap action (if canceled)
    ],
  },
}
```

### Why This Works

1. **Order matters**: The second manipulator is evaluated first (Karabiner evaluates from bottom to top in the JSON). If the variable is set, it fires immediately.

2. **Variable guards are action guards**: The `variable_if` condition in the second manipulator means:
   - First press: Second manipulator's condition fails (variable not set), doesn't fire
   - Second press: Variable IS set from first press, second manipulator fires, resets variable and executes action

3. **No timing on second manipulator**: The second manipulator's job is purely to detect state, not to handle timing. All timing is handled by the first manipulator's `to_delayed_action`.

4. **Delayed action clears state**: The `to_delayed_action.to_if_invoked` and `to_if_canceled` handlers ensure the variable is reset after the timeout, preventing stale state.

5. **Lazy modifier for pass-through**: The `lazy: true` flag on `toKey("left_command")` ensures Karabiner doesn't immediately emit the key. Instead:
   - If a second key is pressed while left_command is held, left_command becomes active as a modifier for that key
   - If held alone past the timeout, `to_delayed_action` emits the key back

## Key Insights

### 1. Variable Conditions Prevent Entire Manipulator Execution

- A `variable_if` or `variable_unless` condition prevents the manipulator from running at all if the condition fails
- Don't use variable conditions to prevent duplicate variable assignments—it prevents the manipulator from detecting when it should fire
- Instead, structure your manipulators so only the relevant one fires based on state

### 2. Manipulation Order (JSON Order) Matters

- Karabiner evaluates manipulators from **bottom to top** in the JSON
- The second manipulator (double-tap detection) should be listed **before** the first manipulator (initial press)
- This ensures the double-tap detector runs before the single-tap handler

### 3. Timing Parameters Should Go On Single-Tap Manipulator

- `basic.to_if_held_down_threshold_milliseconds`: How long to wait before considering it a "hold"
- `basic.to_delayed_action_delay_milliseconds`: How long to wait before sending the "single-tap" action
- These parameters should only be on the first manipulator, not the second

### 4. `to_delayed_action` Handles Single-Tap Fallback

- If the first manipulator detects no second press within the timeout, `to_delayed_action.to_if_invoked` runs
- This is where you emit the original key (or cleared action) if no double-tap was detected
- Use **conditional events** (via `toKeyCond`) to only emit the original key if the variable is still set

### 5. Per-Event Conditions Enable Precise Control

- Karabiner supports conditions on individual `to` events (not just manipulator-level conditions)
- This allows emitting different keys based on runtime state within a single manipulator
- Example: `toKeyCond("left_command", [], {}, [{ type: "variable_if", name: "lcmd_pressed", value: 1 }])`

### 6. Custom Builders Can Hide Complexity

- The `varTapTapHold` builder is useful for simpler cases but becomes a liability when custom event conditions are needed
- Raw manipulators are sometimes clearer when you need precise control
- Always check Karabiner's official examples before writing custom builders

## Implementation Details for Left Command

### Three Actions Achieved

1. **Normal Modifier** (single press + other keys, or single press + release <650ms):
   - First manipulator: Sets `lcmd_pressed=1`, emits lazy left_command
   - Second key pressed: Lazy left_command becomes active modifier for that key
   - Timeout fires: `to_delayed_action` emits left_command (conditionally, only if variable still set)

2. **Last App Switch** (double-tap <650ms):
   - First press: Fires first manipulator (sets `lcmd_pressed=1`)
   - Second press: Fires second manipulator (detects `lcmd_pressed==1`), resets variable, switches app

3. **F13 Down/Up** (hold >650ms):
   - First manipulator: Holds past 650ms threshold
   - `to_if_held_down`: Sets `lcmd_f13_down=1`, emits f13 down
   - Key release: `to_after_key_up` emits f13 up (conditionally, only if `lcmd_f13_down==1`)

### Space Layer Guards

Both manipulators include `{ type: "variable_unless", name: "space_mod", value: 1 }` to prevent conflicts when space layer is active. This aligns with the architecture's existing conflict-prevention strategy for tap-hold keys.

## Recommendations for Future Complex Behaviors

1. **Always check Karabiner's official examples first**
   - They embody carefully tested patterns that work within Karabiner's evaluation model
   - See: [Karabiner-Elements typical examples](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/)

2. **Use raw manipulator definitions for precise multi-state behaviors**
   - Custom builders are great for boilerplate reduction but can obscure what's happening
   - When debugging fails, expand back to raw JSON to understand the actual structure

3. **Test with EventViewer**
   - Karabiner's EventViewer shows variable state changes in real-time
   - If a variable isn't being set, a manipulator's conditions likely prevented it from firing
   - Watch for timing: variables may be reset faster than you expect

4. **Structure for Karabiner's Evaluation Model**
   - Remember: bottom-to-top evaluation means second manipulator fires first
   - Conditions are manipulator gates, not just filters
   - Use per-event conditions for runtime branching within a manipulator's action

5. **Consider State Complexity**
   - Each additional state (variable) makes debugging harder
   - Minimize the number of variables and keep their lifetime clear
   - Use descriptive variable names (e.g., `lcmd_pressed`, `lcmd_f13_down`)

## References

- [Karabiner-Elements Official Examples](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/)
- [Double Press Example](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/#change-double-press-of-q-to-escape)
- [Complex Modifications Manipulator Definition](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/)
- [to_delayed_action Documentation](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to-delayed-action/)
