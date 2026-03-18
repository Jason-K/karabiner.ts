# Leader Refactor Final Validation (2026-03-17)

## Scope

This update finalizes the extraction of `generateSpaceLayerRules(...)` from `src/lib/functions.ts` into `src/lib/leader/*` while preserving runtime behavior.

## Files in Scope

- `src/lib/functions.ts`
- `src/lib/leader/types.ts`
- `src/lib/leader/runtime.ts`
- `src/lib/leader/build.ts`
- `src/lib/leader/index.ts`
- `src/index.ts`
- `karabiner-output.json`

## API Compatibility

Confirmed compatibility for:

- `generateSpaceLayerRules(spaceLayers, options)`

Additional generalized API now available:

- `generateLayerRules(spaceLayers, options)`

`src/index.ts` now provides space-specific leader settings (leader key, prefix, label, indicator root), keeping the core leader builder generic.

`src/lib/functions.ts` re-exports the leader API/types, preserving call sites that import from `./lib/functions`.

## Behavior Parity Checks

Confirmed parity for:

- Activation and sublayer transitions
- Nested sublayer transitions
- Escape reset while leader/sublayer is active
- Unmapped-key swallowing while leader/sublayer is active
- Debug toggle semantics defaulting to off

## Debug Path

Default debug log path is preserved:

- `~/.config/hammerspoon/logs/space_layer.log`

## Validation Results

Validation completed in `karabiner.ts/`:

- `npx tsc`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

Build side effects observed and expected:

- Layer definition emission succeeded
- Profile update succeeded
- Workspace output JSON regenerated
- Device simple modifications update succeeded

## Behavior-Affecting Deltas

No unintended behavior-affecting deltas were identified.

Intentional behavior-affecting delta present in generated output:

- Added explicit `SPACE layers - swallow unmapped keys` rule
- Added explicit escape-reset manipulators for `space_mod` and each active sublayer state

## Merge Readiness

Status: merge-ready for the extraction scope.

Notes:

- Changes are extraction-focused and minimal.
- The generated `karabiner-output.json` delta is aligned with the intended swallow/reset behavior.
