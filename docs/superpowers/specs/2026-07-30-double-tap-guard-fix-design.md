# Double-Tap Guard Fix — Design

**Date:** 2026-07-30
**Status:** Draft → pending approval
**Scope:** `src/engine/case-helpers.ts`, `src/engine/binding.ts`, `src/definitions/guards.ts`, `src/tests/double-tap-guard.test.ts`. Guards stay first-class bindings; the engine gains a narrow guard arm.

## Problem

The double-tap guard rules (require two presses of a combo within a timeout before the real combo fires) stopped working after migration from the bespoke `generateDoubleTapGuardRule` engine to `Binding[]`.

### Root cause (confirmed via systematic debugging)

`guards.ts` was migrated using `doubleTap(key(...))`, which builds a `CaseBuilder("press", ..., tapCount=2)`. `buildManipulators` routes any `tapCount >= 2` case to **`buildMultiTap` → `varTapTapHold`** (`binding.ts:384`) — a tap/tap-hold/double-tap state machine. That is the **wrong mechanism** for a guard. The guard is a distinct pattern, and `varTapTapHold` cannot reproduce it. Four concrete defects vs the known-good bespoke output:

| # | Known-good bespoke | Current `varTapTapHold` | Effect |
|---|---|---|---|
| 1 | 2nd press `to: [combo, reset]` (fires combo immediately) | 2nd tap `to: []`, combo in `to_if_alone` (only on clean tap-release) | Combo doesn't fire reliably on double-tap |
| 2 | `from.modifiers: {mandatory: ["left_command"]}` | `{optional: ["any"]}` | Matches any modifier state, not just cmd |
| 3 | 1st press: arm var + single `to_delayed_action` (300ms) | Full 3-timing tap-hold machine | Wrong lifecycle |
| 4 | Var `guard_cmd_q` | Var `multi_tap_q` | Different var + scope |

The regression was masked because `double-tap-guard.test.ts` was **rewritten to assert the broken behavior** (line 22 asserts `multi_tap_q` instead of `guard_cmd_q`).

## Spec: the guard mechanism

A double-tap guard requires two presses of a key combo within a timeout before the real combo fires. Two manipulators:

1. **First press** (guard var `= 0`): `conditions: [{variable_if: var=0}]`, `to: [{set var=1}]`, `parameters: {basic.to_delayed_action_delay_milliseconds: <timeout>}`, `to_delayed_action: {to_if_invoked: [{set var=0}], to_if_canceled: [{set var=0}]}`. Arms the guard; disarms after timeout whether the delay invokes (no second tap) or is canceled (another key pressed).
2. **Second press** (guard var `= 1`): `conditions: [{variable_if: var=1}]`, `to: [{real combo}, {set var=0}]`. Fires the real combo immediately, then resets.

This is semantically distinct from `varTapTapHold` (which distinguishes tap/hold/double-tap of a single key). The guard's second press emits in `to` (immediate), not `to_if_alone`.

## Design

### DSL — `guard()` case helper

A dedicated helper, used exactly as `doubleTap` is today:

```ts
// guards.ts — shape unchanged from today; doubleTap() → guard()
export const globalGuardBinding: Binding = bind(
  from("q", ["left_command"]),
  to(guard(key("q", ["left_command"]))),
);
export const antinoteGuardBinding: Binding = bind(
  from("d", ["left_command"]),
  to(guard(key("d", ["left_command"]))),
  when(condApp(APP_ID.antinote)),
);
```

`guard(action)` returns a `CaseBuilder` with `phase: "press"`, `guard: true`, and the actions in `do`. The engine detects the `guard` marker and routes to the new arm.

The existing `doubleTap()` helper is **kept** — it is the correct primitive for a genuine double-tap (fire on a clean double tap-release, via `varTapTapHold`). No definition uses it today, but it's the right tool if one ever needs it. (The two are easy to confuse; the docstrings will distinguish them.)

### Engine — `buildGuard` arm

Add `guard?: boolean` to the `Case` type. Add a `buildGuard(b, g)` function and gate it **first** in `buildManipulators`, before the `hasMultiTap` check:

```ts
function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  if (resolved.some((c) => c.guard)) {
    const manipulators = buildGuard(b, resolved);
    stampDeviceScope(manipulators, b.trigger);
    return manipulators;
  }
  // ...existing hasMultiTap / isSim / tapHold routing unchanged
}
```

`buildGuard` derives its inputs from the binding and the single guard case:

- **Trigger key + modifiers**: from `b.trigger` (e.g. `q` + `["left_command"]`). `from.modifiers = {mandatory: [...]}` via the existing `fromModifiersObj`.
- **Real combo (the `to` on second press)**: the guard case's `do` (the `key("q", ["left_command"])` action), resolved to events.
- **Var name**: `guard_<mod>_<key>` from the trigger's primary mandatory modifier + key, via the bespoke `normalizeModifier`/`deriveGuardVar` convention (`left_command`→`cmd`, `left_control`→`ctrl`, `left_option`→`opt`, `left_shift`→`shift`; bare modifier already short). Overridable via a new binding option `guardVar?: string`. Default = derived name.
- **Timeout**: new binding option `guardMs?: number`, default `300` (the bespoke default + the `TIMINGS.timeoutDoubleTapMs` value).
- **Conditions**: hoisted binding conditions (`when(condApp(...))`) attached to **both** manipulators, via the existing `resolveCondition` + `deviceLast` pattern (matching `buildTapHold`).

`buildGuard` builds the two manipulators directly with `map()` (not `tapHold`/`varTapTapHold`), reproducing the bespoke shape byte-for-byte.

### Contract / edge cases

- **One guard case per binding.** A guard binding has exactly one `guard()` case (one combo to fire on the second press). If a definition supplies multiple `guard()` cases, `buildGuard` uses the **first** and the engine logs/ignores the rest — but the supported authoring shape is one guard per binding (matching both current consumers). No need to support multi-guard.
- **Var-name derivation** (matches bespoke `deriveGuardVar` exactly): `guard_<normalizedMod>_<key>` where `<normalizedMod>` is the **first** mandatory modifier with its `left_`/`right_` prefix stripped and `command→cmd`, `control→ctrl`, `option→opt` aliased (e.g. `left_command`→`cmd`, `left_control`→`ctrl`, `left_option`→`opt`, `left_shift`→`shift`). If the trigger has **no** modifiers, `<normalizedMod> = "none"` (e.g. `guard_none_x`) — matches the bespoke fallback. The `guardVar?: string` binding option overrides the derived name when set.
- **Timeout** = `guardMs ?? TIMINGS.timeoutDoubleTapMs` (300ms), emitted only as `basic.to_delayed_action_delay_milliseconds` on the first-press manipulator (matching bespoke — not the multi-tap machine's three timing params).

### What changes

- `case-helpers.ts`: add `guard(action, conditions?)` → `CaseBuilder("press", action, conditions).withGuard()`.
- `binding.ts`: `Case.guard?: boolean`; `buildGuard(b, resolved)`; gate at top of `buildManipulators`.
- `guards.ts`: `doubleTap(...)` → `guard(...)`.
- `double-tap-guard.test.ts`: restore assertions to known-good shape (`guard_cmd_q`, second-press `to` fires combo, `mandatory` modifiers, two manipulators, app condition on both for antinote).

### What does NOT change

- `bind()` / `from()` / `when()` / `to()` DSL — guards remain first-class bindings.
- `varTapTapHold` / `buildMultiTap` — untouched (still serves left-command, shift).
- `doubleTap()` helper — kept.

## Expected output (matches known-good byte-for-byte)

For `bind(from("q", ["left_command"]), to(guard(key("q", ["left_command"]))))`:

```jsonc
[
  {
    "type": "basic",
    "from": { "key_code": "q", "modifiers": { "mandatory": ["left_command"] } },
    "conditions": [{ "type": "variable_if", "name": "guard_cmd_q", "value": 1 }],
    "to": [
      { "key_code": "q", "modifiers": ["left_command"] },
      { "set_variable": { "name": "guard_cmd_q", "value": 0 } }
    ]
  },
  {
    "type": "basic",
    "from": { "key_code": "q", "modifiers": { "mandatory": ["left_command"] } },
    "parameters": { "basic.to_delayed_action_delay_milliseconds": 300 },
    "conditions": [{ "type": "variable_if", "name": "guard_cmd_q", "value": 0 }],
    "to": [ { "set_variable": { "name": "guard_cmd_q", "value": 1 } } ],
    "to_delayed_action": {
      "to_if_invoked": [ { "set_variable": { "name": "guard_cmd_q", "value": 0 } } ],
      "to_if_canceled": [ { "set_variable": { "name": "guard_cmd_q", "value": 0 } } ]
    }
  }
]
```

## Verification

1. `npx tsx src/index.ts` regenerates `karabiner-output.json`.
2. The `[⌘]+[Q]` rule's two manipulators match the known-good paste byte-for-byte.
3. The `[⌘]+[D]` (antinote) rule adds the `frontmost_application_if` condition to BOTH manipulators.
4. `double-tap-guard.test.ts` restored to assert the guard shape (not `multi_tap_q`).
5. Full suite: only the pre-existing unrelated `integration.test.ts` failure remains.
6. Typecheck clean.

## Risk

Low. The guard arm is gated on the `guard` marker, so only `guards.ts` (the sole `guard()` consumer) routes through it. No other binding is affected. The bespoke output is the fixed reference, reproduced via direct `map()` calls. The biggest risk is the var-name derivation matching the bespoke convention exactly — covered by a test asserting `guard_cmd_q`.
