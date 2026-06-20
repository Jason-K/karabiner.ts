# Shift Double-Tap → Raycast Clipboard History

**Date:** 2026-06-19
**Status:** Approved

## Overview

Double-tapping **either** Shift key (left or right) within a 600 ms window opens the
Raycast v2 clipboard-history extension. Single-tap and hold behavior is preserved
(pass-through), so normal Shift usage (capitalization, Shift-as-modifier) is unaffected.

The implementation reuses the existing multi-tap engine (`generateMultiTapRule`) and
mirrors the established `left-command.ts` pattern. The user-facing definition file
`src/definitions/shift.ts` already exists in draft form; this spec covers the small
polish needed to complete it plus the missing test coverage.

## Behavior contract

| Input | Result |
|---|---|
| Tap Shift alone (press + release, no second tap within threshold) | Emits the Shift key (pass-through) |
| Hold Shift | Emits the Shift key (acts as normal modifier) |
| Double-tap Shift within 600 ms | Runs `open -u <raycast url>` → opens clipboard history |
| Shift used with another key (e.g. Shift+A) | Unaffected — modifier behavior intact |

Both `left_shift` and `right_shift` trigger the **same** Raycast command (user decision).

## Files

```
src/definitions/shift.ts        (modified) — meaningful description, extract URL const
src/tests/shift.test.ts         (new)      — unit tests
```

No changes to `src/definitions/index.ts`, `src/index.ts`, or the engine — the draft is
already wired in (`buildShiftRules` exported and spread into the rules array) and the
build already emits valid `multi_tap_left_shift` / `multi_tap_right_shift` manipulators.

## Implementation change (`src/definitions/shift.ts`)

Two edits to the existing draft:

1. **Extract the URL** to a single const so the "which extension" knob has one source of
   truth across both configs:

   ```ts
   const RAYCAST_CLIPBOARD_HISTORY_URL =
     "raycast-x://extensions/raycast/clipboard-history/clipboard-history";
   ```

   Both configs' `tapTap` action builds its shell command from it:
   `{ type: "shell", command: \`open -u ${RAYCAST_CLIPBOARD_HISTORY_URL}\` }`.

   > `raycast-x://` is the URL scheme for the Raycast v2 beta — intentional, not a typo.

2. **Meaningful description**: change both configs' `description` from
   `"Tap/double-tap/hold handler"` → `"Raycast clipboard history"`. `formatRuleDescription`
   then renders distinct, readable rule labels:
   - `[←⇧]        →    Raycast clipboard history (on multi-tap)` (left)
   - `[→⇧]        →    Raycast clipboard history (on multi-tap)` (right)

Everything else stays as drafted: `alone`/`hold` pass-through (`left_shift` / `right_shift`),
`thresholdMs: 600`, `allowPassThrough: true`, `mods: []`.

## Generated manipulator shape (reference)

Each rule produces two manipulators via `varTapTapHold`:

- **Second-tap** (`conditions: variable_if multi_tap_<key> === 1`): `to_if_alone` resets the
  variable to 0 and runs the Raycast `shell_command`.
- **First-tap (pass-through)**: `to` sets the variable to 1 (lazy), `to_if_alone` sets it to
  1 and emits the bare `key_code`, `to_if_held_down` emits the bare `key_code`.

Both carry `basic.to_if_held_down_threshold_milliseconds: 600` (and related timing params).

## Test coverage (`src/tests/shift.test.ts`)

Follows the established `node:test` + `assert/strict` convention (`escape-rule.test.ts`,
`multi-tap.test.ts`), using the same `toRule()` helper (`input.build()` when present).

| Scenario | Assertion |
|---|---|
| Rule count | `buildShiftRules()` returns exactly 2 rules |
| Left rule label | description = `[←⇧]        →    Raycast clipboard history (on multi-tap)` |
| Right rule label | description = `[→⇧]        →    Raycast clipboard history (on multi-tap)` |
| Manipulator count | each rule has 2 manipulators (second-tap, first-tap) |
| Double-tap fires extension (left) | second-tap manipulator `to_if_alone` contains `shell_command` with the Raycast URL |
| Double-tap fires extension (right) | same, for the right rule |
| Single-tap pass-through | first-tap manipulator `to_if_alone` emits bare `key_code` (normal Shift preserved) |
| Variable names distinct | `multi_tap_left_shift` (left) vs `multi_tap_right_shift` (right) |
| Threshold | `basic.to_if_held_down_threshold_milliseconds === 600` |

## Verification

`npm run check` (typecheck + lint + test + build) must pass green.
