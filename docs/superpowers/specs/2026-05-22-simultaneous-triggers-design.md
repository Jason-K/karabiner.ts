# Simultaneous Triggers Framework

**Date:** 2026-05-22
**Status:** Approved

## Overview

Add a framework for defining Karabiner-Elements rules triggered by simultaneous key presses (multiple keys pressed within the simultaneous threshold window). The framework supports the full behavioral suite already available for single-key rules: tap, hold, double-tap, and double-tap-hold — with all `simultaneous_options` exposed and sensible defaults throughout.

## Architecture

The design follows the existing three-layer pattern: core → engine → definitions.

```
src/core/simultaneous.ts          (new) — from-event construction, routes to existing core
src/engine/simultaneous-rules.ts  (new) — SimultaneousConfig type, rule generation, validation
src/definitions/simultaneous.ts   (new) — user-facing chord mappings
src/tests/simultaneous.test.ts    (new) — unit tests
src/engine/index.ts               (modified) — re-export simultaneous-rules
src/definitions/index.ts          (modified) — export simultaneousMappings
src/index.ts                      (modified) — wire generateSimultaneousRules
```

## Types

### `SimultaneousOptions`

Maps directly to Karabiner's `simultaneous_options` object. All fields are optional; Karabiner defaults apply when absent (fields are not emitted when unset).

```ts
export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_order?:  "insensitive" | "strict" | "strict_inverse";
  key_up_when?: "any" | "all";
  to_after_key_up?: ActionSpec[];  // fires when ALL chord keys are released
};
```

Karabiner defaults (for reference):
- `detect_key_down_uninterruptedly`: `false`
- `key_down_order`: `"insensitive"`
- `key_up_order`: `"insensitive"`
- `key_up_when`: `"any"`
- `to_after_key_up`: none

### `SimultaneousConfig`

Unified type covering all behavior tiers. Fields `tapTap` and `tapTapHold` are mutually exclusive (same contract as `MultiTapConfig`).

```ts
export type SimultaneousConfig = {
  keys: string[];                      // ≥2 key codes pressed simultaneously
  description: string;
  alone?: ActionSpec[];                // tap (quick press + release)
  hold?: ActionSpec[];                 // hold (long press)
  tapTap?: ActionSpec[];               // double-tap
  tapTapHold?: ActionSpec[];           // double-tap then hold
  thresholdMs?: number;                // tap/hold timing threshold (default: 300)
  simultaneousOptions?: SimultaneousOptions;
  simultaneousThresholdMs?: number;    // detection window for "simultaneous"
                                       // (Karabiner global default: 50ms)
};
```

### Config shape

```ts
// src/definitions/simultaneous.ts
export const simultaneousMappings: Record<string, SimultaneousConfig> = {
  // Record key is a label used for rule descriptions and variable naming only.
  // Example:
  // "jk": {
  //   keys: ["j", "k"],
  //   description: "J+K chord",
  //   alone: [{ type: "key", key: "escape" }],
  //   hold:  [{ type: "app", ref: "finder" }],
  // },
};
```

## Core Layer (`src/core/simultaneous.ts`)

Constructs the Karabiner `from` event for simultaneous chords and routes to the existing `tapHoldFrom` / `varTapTapHoldFrom` core functions. No new behavior logic is introduced.

### `buildSimultaneousFromEvent`

```ts
function buildSimultaneousFromEvent(
  keys: string[],
  options?: SimultaneousOptions,
  resolvedAfterKeyUp?: ToEvent[],
): FromEvent
```

Produces:

```json
{
  "simultaneous": [{ "key_code": "j" }, { "key_code": "k" }],
  "simultaneous_options": {
    "key_down_order": "strict",
    "to_after_key_up": [...]
  },
  "modifiers": { "optional": ["any"] }
}
```

Only fields explicitly set in `simultaneousOptions` are emitted. `to_after_key_up` is resolved through `resolveActionToEvents` before being passed here.

### `simultaneousTapHold(config)`

Calls `tapHoldFrom` with the simultaneous `FromEvent`. Used when `tapTap`/`tapTapHold` are absent.

### `simultaneousMultiTap(label, config)`

Calls `varTapTapHoldFrom` with the simultaneous `FromEvent`. State variable name: `sim_tap_${label}` (e.g., label `"jk"` → variable `sim_tap_jk`).

## Engine Layer (`src/engine/simultaneous-rules.ts`)

### `generateSimultaneousRules`

```ts
export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  spaceLayers: SubLayerConfig[],
  tapHoldKeys: Record<string, TapHoldConfig>,
): any[]
```

**Per-entry logic:**

1. Validate `keys.length >= 2`; throw if both `tapTap` and `tapTapHold` are set; throw if none of `alone`, `hold`, `tapTap`, `tapTapHold` are specified (no-op rule).
2. Run conflict checks (see below).
3. Resolve `simultaneousOptions.to_after_key_up` through `resolveActionToEvents`.
4. Call `buildSimultaneousFromEvent(keys, simultaneousOptions, resolvedAfterKeyUp)`.
5. **Tier routing:**
   - `tapTap` or `tapTapHold` present → `simultaneousMultiTap(label, config)` → `varTapTapHoldFrom`
   - Otherwise → `simultaneousTapHold(config)` → `tapHoldFrom`
6. If `simultaneousThresholdMs` is set, inject `"basic.simultaneous_threshold_milliseconds"` into manipulator parameters.
7. Inject `variable_unless` conditions for `space_mod` and all sublayer vars (same pattern as `generateTapHoldRules`).
8. Wrap in `rule(formatRuleDescription(label, description, "simultaneous"))`.

### Conflict validation

**Check 1 — Duplicate chords** (order-aware):

Two entries are duplicates when their normalized key representation AND `key_down_order` setting match:
- `key_down_order: "insensitive"` or absent → normalize by **sorting** keys before comparison
- `key_down_order: "strict"` or `"strict_inverse"` → compare **ordered** arrays

Entries with different `key_down_order` values are not flagged even if they share the same keys, as they represent different behavioral contracts.

**Check 2 — Tap-hold key overlap:**

If any key in `SimultaneousConfig.keys` also appears as a bare (no-modifier) key in `tapHoldKeys`, throw. Modifier-prefixed entries like `"cmd+j"` in tap-hold are not flagged. Error message identifies the label, the conflicting key, and both mapping sources.

### Integration in `index.ts`

```ts
const simultaneousRules = generateSimultaneousRules(
  simultaneousMappings,
  spaceLayers,
  tapHoldMappings,
);

let rules = [
  ...simultaneousRules,  // before tap-hold rules so chords take priority
  ...tapHoldRules,
  ...
];
```

Simultaneous rules are placed before single-key tap-hold rules so Karabiner evaluates chord patterns first.

## Test Coverage (`src/tests/simultaneous.test.ts`)

| Scenario | Assertion |
|---|---|
| Tap-hold path | Generates `from.simultaneous`, `to_if_alone`, `to_if_held_down` |
| Multi-tap path | Generates variable manipulators with `sim_tap_*` variable name |
| `simultaneous_options` fields | Each field emitted correctly; absent fields not emitted |
| `simultaneousThresholdMs` | Emitted as `basic.simultaneous_threshold_milliseconds` parameter |
| `to_after_key_up` | Resolved through `resolveActionToEvents`, appears in `simultaneous_options` |
| Space-layer conditions | `variable_unless` conditions injected on all manipulators |
| Conflict check 1 (insensitive) | Throws on same key set regardless of array order |
| Conflict check 1 (strict) | Does not throw for `["j","k"]` strict vs `["k","j"]` strict |
| Conflict check 2 | Throws when simultaneous key overlaps bare tap-hold key |
| `tapTap` + `tapTapHold` both set | Throws |
| `keys.length < 2` | Throws |
