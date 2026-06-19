# Decouple Rule Engine From the Space Leader Layer

**Date:** 2026-06-19
**Status:** Approved

## Overview

The space-bar "leader layer" was the original application of the project's
leader/sublayer machinery: hold space to enter a modal layer, then press a key
(e.g. `d` → Downloads) to fire a mapping. That responsibility has moved to a
different tool, and the space layer is already disabled at the call site
(`generateLayerRules` and friends are commented out in `src/index.ts`).

The disabling is incomplete. Three engine files still hardcode the string
`"space"` and **unconditionally** push a `space_mod` suppression condition onto
every tap-hold and simultaneous manipulator. Because nothing sets `space_mod = 1`
anymore, those conditions are permanent no-ops — currently **61** of them
polluting `karabiner-output.json`. The matching `*_sublayer` injection is dormant
only because the layer list is passed as `undefined`; it would leak the moment a
leader list is supplied again.

**Goal:** stop emitting leader-suppression conditions when no leader layer is
active, while preserving and *generalizing* the ability to add any leader-type
layer in the future. The engine becomes leader-agnostic; the leader machinery
owns its own variable names and hands them to the engine.

## Background — why these conditions exist

Tap-hold and simultaneous rules fire on bare keys (`d`, `f`, chords). When a
leader layer is active, those same keys carry layer mappings instead. To prevent
the tap-hold/simultaneous behavior from firing *during* a leader session, each
generated manipulator carries `variable_unless` conditions keyed on the leader's
state variables:

- `<prefix>_mod` — set while the leader key itself is held (before a sublayer is chosen).
- `<prefix>_<key>_sublayer` — set while a specific sublayer is active (`<prefix>_mod` is `0` during this phase, so the `_mod` check alone is insufficient).

The full suppression set for a leader is therefore
`[<prefix>_mod, ...<prefix>_<key>_sublayer for each sublayer]`. The leader
generator (`core/leader/build.ts`) already computes these names generically from
a `layerPrefix`; the coupling lives entirely in the engine consumers.

## Architecture

The leader generator (`core/leader/build.ts`) is **already generic** — it is
parameterized by `layerPrefix`, `leaderKey`, `leaderLabel`, and
`indicatorRootLayer`. No change is needed there. The work is confined to the
engine consumers and the orchestrator.

```
src/core/leader/runtime.ts     (modified) — add leaderSuppressionVars() helper
src/engine/tap-hold-rules.ts   (modified) — accept suppressionVars: string[]
src/engine/simultaneous-rules.ts (modified) — accept suppressionVars: string[]
src/engine/escape-rule.ts      (modified) — generalize to suppressionVars
src/engine/layer-emit.ts       (modified) — generalize to prefix + label
src/index.ts                   (modified) — drop space wiring; pass [] (no leader)
src/definitions/space.ts       (deleted) — obsolete space layer data
src/data/space-layer.ts        (deleted) — obsolete space constants
src/definitions/index.ts       (modified) — remove commented space re-export
src/data/index.ts              (modified) — remove commented SPACE_LAYER_* re-export
src/tests/simultaneous.test.ts (modified) — generic + negative tests
src/tests/mappings.test.ts     (modified) — drop space-data tests
src/tests/integration.test.ts  (modified) — drop space tests; negative assertion
```

## Detailed Design

### 1. New helper — `leaderSuppressionVars`

`core/leader/runtime.ts` gains a single helper that returns the full set of
variables a given leader layer would set. It reuses the existing
`getAllSublayerVars`:

```ts
export function leaderSuppressionVars(
  prefix: string,
  layers: SubLayerConfig[],
): string[] {
  return [`${prefix}_mod`, ...getAllSublayerVars(layers, prefix)];
}
```

This is the single source of truth for "which variables indicate this leader is
active." Both the orchestrator and any future leader use it.

### 2. `generateTapHoldRules` — leader-agnostic

Signature:

```ts
export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  suppressionVars: string[] = [],
): any[]
```

- Remove imports of `getAllSublayerVars` and `SubLayerConfig`.
- Remove the `spaceModVar` / `allSublayerVars` derivation.
- For each manipulator, push one `variable_unless` (name, value `1`) per entry in
  `suppressionVars`. When `suppressionVars` is empty, **no conditions are
  pushed** — the manipulator is emitted clean.

### 3. `generateSimultaneousRules` — leader-agnostic

- `injectSpaceLayerConditions(manipulators, spaceLayers)` is renamed
  `injectSuppressionConditions(manipulators, suppressionVars: string[])` and does
  the same per-var `variable_unless` push (empty → none).
- `generateSimultaneousRules(mappings, suppressionVars: string[], tapHoldKeys)`
  drops the leader imports and forwards `suppressionVars` to the helper.
- Validation logic is unchanged.

### 4. `generateEscapeRule` — generalized

Signature:

```ts
export function generateEscapeRule(suppressionVars: string[] = []): any[]
```

The rule resets each name in `suppressionVars` to `0` on Escape, in addition to
the existing non-leader state vars (`caps_lock_pressed`, `command_q_pressed`,
`ctrl_opt_esc_first`, `cmd_d_ready`) and the sticky-modifier clear. The hardcoded
`space_mod` is gone. (This function remains unused at the call site for now — it
is retained and generalized as part of the preserved leader capability.)

### 5. `emitLayerDefinitions` — generalized

Signature:

```ts
export function emitLayerDefinitions(
  prefix: string,
  label: string,
  layers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false,
): void
```

Every hardcoded `"space"` becomes the `prefix` argument:

- Output filename: `space_layers.json` → `${prefix}_layers.json`.
- Root GUI key + label: `layers.space` / `'␣'` → `layers[prefix]` / `label`.
- Layer IDs: `space_${KEY}` and `space_${KEY}_${SUB}` → `${prefix}_${KEY}` etc.

The Hammerspoon on-screen indicator thus works for any leader, not just space.

### 6. Orchestrator — `src/index.ts`

- Remove the commented `spaceLayerDefinitions` import and `const spaceLayers` line.
- Remove the commented `generateLayerRules({ SPACE_LAYER_* })` block, the
  commented `generateEscapeRule(spaceLayers)` line, and the commented
  `emitLayerDefinitions(...)` line.
- Remove the now-orphaned `debugMode` / `KARABINER_DEBUG` block (it only fed
  `emitLayerDefinitions`).
- Remove the "Space Layer" bullet from the header doc comment.
- Calls become leader-free:
  - `generateTapHoldRules(tapHoldMappings)` (2nd arg defaults to `[]`)
  - `generateSimultaneousRules(simultaneousMappings, [], tapHoldMappings)`
    (positional `[]` required).

A future leader is wired in by importing `generateLayerRules` +
`leaderSuppressionVars` from `core/leader`, e.g.:

```ts
const leaderLayers = myLeaderDefinitions;              // SubLayerConfig[]
const rules = [
  ...generateLayerRules(leaderLayers, { layerPrefix: "leader", leaderKey: "f18", ... }),
  ...generateTapHoldRules(tapHoldMappings, leaderSuppressionVars("leader", leaderLayers)),
  ...generateSimultaneousRules(simultaneousMappings, leaderSuppressionVars("leader", leaderLayers), tapHoldMappings),
];
```

### 7. Removals

- **Delete** `src/definitions/space.ts` (the `spaceLayerDefinitions` data) and
  `src/data/space-layer.ts` (the `SPACE_LAYER_*` constants).
- **`src/definitions/index.ts`** — remove the commented `spaceLayerDefinitions`
  re-export (and the stray trailing commented line).
- **`src/data/index.ts`** — remove the commented `SPACE_LAYER_*` re-export block.

## Test Changes

### `src/tests/simultaneous.test.ts`

- The `noLayers: SubLayerConfig[]` fixture becomes `noSuppression: string[] = []`;
  all call sites in the file are updated to the new positional argument.
- The test `"space-layer: variable_unless space_mod injected on all manipulators"`
  is rewritten as a **generic positive test**: pass
  `["leader_mod", "leader_d_sublayer"]` and assert those `variable_unless`
  conditions are present. Renamed to drop "space".
- **New negative test:** with `suppressionVars = []`, a generated simultaneous
  manipulator has **no** `variable_unless` conditions at all — this directly
  guards the regression this change fixes.

### `src/tests/mappings.test.ts`

- Remove `import { spaceLayerDefinitions } from "../definitions/space";`.
- Remove `"space layer definitions keep expected top-level layers"` and
  `"folders layer uses folder and raycast refs"`.
- The `tapHoldMappings["vmCOC_+spacebar"]` assertions **remain** — that is a
  virtual-modifier + spacebar tap-hold, unrelated to the space leader.

### `src/tests/integration.test.ts`

- Delete `"output contains space layer rules"` and `"space layer activation
  copies current selection before enabling leader mode"` (both already failing).
- Repurpose `"generated output validates against critical variable names"` into a
  **negative assertion**: with no leader active, `karabiner-output.json` contains
  zero occurrences of the substring `space_` (all leader variables were
  `space_`-prefixed and space is now fully removed, so this is both necessary and
  sufficient to prove no leader pollution leaked).

## Out of Scope

Pre-existing test failures from commit `8579d2f` (mouse-button description
prefixes `[BACK]`/`[SHIFT]`, and `tap-hold mappings keep expected anchor keys`)
are unrelated to the leader layer and are **not** addressed by this change.

## Verification

1. `npm run typecheck` — no new type errors; the engine files no longer import
   `SubLayerConfig`/`getAllSublayerVars`.
2. `npm run lint` — clean (`--max-warnings=0`), including no unused-import errors
   from the removed `debugMode`/leader imports.
3. `npm test` — the leader-related tests pass (positive generic, negative empty,
   repurposed negative integration). The pre-existing unrelated failures remain
   unchanged.
4. Inspect `karabiner-output.json`: **zero** occurrences of the substring
   `space_` (covers `space_mod` and all `space_*_sublayer` vars) — down from 61
   `space_mod` conditions.
