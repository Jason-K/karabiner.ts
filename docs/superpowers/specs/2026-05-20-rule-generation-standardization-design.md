# Rule Generation Standardization

**Date:** 2026-05-20
**Status:** Approved for implementation

## Problem

Definition files in `src/definitions/` use inconsistent patterns to produce Karabiner rules. Some files are clean data configs that call a shared engine function; others manually call `rule()`, `map()`, `toKey()`, and perform their own iteration inline. Additionally, three engine files define their own bespoke action types (`TapHoldActionSpec`, `ConditionalAction`, `LauncherAction`) that are incomplete subsets of the existing `ActionSpec` vocabulary already used by `tap-hold-rules.ts` and the space layer system.

## Goal

Every definition file follows the same shape: a data config object or array, plus a single call to an engine function. No definition file directly imports from `karabiner.ts`, calls `rule()`/`map()`/`toKey()`, or performs its own iteration. All engine functions use `ActionSpec` + `resolveActionToEvents` as the single action conversion path.

## Architecture

### Layer Responsibilities

| Layer | Responsibility | Constraint |
| --- | --- | --- |
| `src/core/` | Low-level builders: `tapHold`, `varTapTapHold`, `map`, `rule` primitives | No user-specific data |
| `src/engine/` | Engine functions: convert typed config → `Rule[]` | No user-specific data |
| `src/definitions/` | Data configs + one engine function call per file | No direct `karabiner.ts` imports, no iteration logic |
| `src/data/` | App registry, folder registry, timings, etc. | Unchanged |

### Single Action Vocabulary

`ActionSpec` (from `src/core/action-dsl.ts`) is the one type used for all output events across all engine functions. `resolveActionToEvents` (from `src/engine/action-resolver.ts`) is the single conversion path from `ActionSpec` to karabiner.ts `ToEvent[]`. The `from`-side of mappings (trigger key/button/modifiers) is not `ActionSpec` — it remains as explicit key/modifier fields.

### `ActionSpec` additions

One new variant is added to `ActionSpec` in `core/action-dsl.ts`:

```ts
| { type: "sequence"; actions: ActionSpec[] }
```

`resolveActionToEvents` handles it by flattening recursively:

```ts
case "sequence":
  return action.actions.flatMap(resolveActionToEvents);
```

**Motivation:** Some engine configs use a single `ActionSpec` field rather than `ActionSpec[]` — specifically `ModifierLauncherMapping.action` and the `action` field in `SubLayerConfig` mappings (space layers). Without `sequence`, these fields are limited to a single event. `sequence` allows multi-step bindings in those contexts without changing the field types or adding parallel arrays.

## Changes to Existing Engine Functions

### Updated to accept `ActionSpec` (replacing bespoke action types)

| File | Function | Type removed | Change |
| --- | --- | --- | --- |
| `engine/conditional-tap-hold-rules.ts` | `generateConditionalTapHoldRules` | `TapHoldActionSpec`, `KeyActionSpec`, `ShellActionSpec` | `alone`/`hold` fields become `ActionSpec[]`; use `resolveActionToEvents` |
| `engine/conditional-action-rules.ts` | `generateConditionalActionRules` | `ConditionalAction` | `actions`, `delayedAction.invoked`, `delayedAction.canceled` become `ActionSpec[]`; use `resolveActionToEvents` |
| `engine/launcher-rules.ts` | `generateModifierLauncherRules` | `LauncherAction` | `action` field becomes `ActionSpec`; use `resolveActionToEvents`; `triggerKey` accepts `string \| string[]`; add optional `triggerLabel?: string` for description |

### Extended

`generateModifierLauncherRules` gains `triggerKey: string | string[]` and `triggerLabel?: string`. When `triggerKey` is an array (e.g. `HYPER`), `triggerLabel` provides the human-readable label used in rule descriptions. This allows `hyper-plus.ts` to use the same engine function as `right-option-launchers.ts`.

### `generateAppScopedRemapRules` (new, added to `engine/simple-rules.ts`)

Extends the simple-remap pattern with a mandatory `ifApp` condition.

```ts
type AppScopedRemapMapping = {
  from: { key: string; modifiers?: string[] };
  description: string;
  to: { key: string; modifiers?: string[] };
  ifApp: string | string[];
};

function generateAppScopedRemapRules(
  mappings: ReadonlyArray<AppScopedRemapMapping>
): Rule[]
```

## New Engine Functions

### `generateDoubleTapGuardRule` (`engine/double-tap-guard-rules.ts`)

Requires a key combo to be pressed twice within a timeout before passing through. First press sets a state variable and starts a reset timer; second press re-fires the original combo and clears the variable. The state variable name is auto-derived from the key and modifiers using the pattern `guard_<modifier>_<key>`, where modifier is the primary modifier with the `left_`/`right_` prefix stripped (e.g. `left_command` → `cmd`). Examples: `guard_cmd_q`, `guard_cmd_d`.

```ts
type DoubleTapGuardConfig = {
  key: string;
  modifiers: string[];
  description: string;
  ifApp?: string | string[];
  timeoutMs?: number;
};

function generateDoubleTapGuardRule(config: DoubleTapGuardConfig): Rule
```

Covers: `antinote.ts` (`cmd+d`, scoped to Antinote), `buildCmdQRule` in `left-command-chords.ts` (`cmd+q`, global).

### `generateMultiTapRule` (`engine/multi-tap-rules.ts`)

Wraps `varTapTapHold` from `core/tap-hold.ts`. Supports alone (single tap), hold, tapTap (double tap), and tapTapHold (double tap then hold). The internal state variable is auto-derived from the key using the pattern `multi_tap_<key>` (e.g. `multi_tap_escape`, `multi_tap_left_command`). All action fields accept `ActionSpec[]` and are converted via `resolveActionToEvents`.

`tapTap` and `tapTapHold` are mutually exclusive — they represent different completions of the second gesture (release vs hold-after-double-tap). Providing both is a configuration error; the engine function throws at runtime if both are present.

```ts
type MultiTapConfig = {
  key: string;
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];      // fires on double-tap release
  tapTapHold?: ActionSpec[];  // fires on double-tap then hold — mutually exclusive with tapTap
  thresholdMs: number;
  allowPassThrough?: boolean;
  mods?: string[];
};

function generateMultiTapRule(config: MultiTapConfig): Rule
```

Covers: `buildEscapeTapTapHoldRule` in `escape-monitor.ts`, `buildLeftCommandRule` in `left-command-chords.ts`.

### `generateTapAloneHoldRule` (`engine/tap-alone-hold-rules.ts`)

Wraps karabiner.ts's `toIfAlone`/`toIfHeldDown`/`toDelayedAction` pattern. On cancel (key released before hold threshold), re-fires the alone action.

```ts
type TapAloneHoldConfig = {
  key: string;
  modifiers?: string[];
  description: string;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
};

function generateTapAloneHoldRule(config: TapAloneHoldConfig): Rule
```

Covers: `buildCtrlEscapeMonitorRule` in `escape-monitor.ts`.

### `generatePointerRemapRule` (`engine/pointer-remap-rules.ts`)

Maps a pointing button (with optional modifier keys) to one or more actions. Builds the raw `from: { pointing_button, modifiers }` manipulator directly since karabiner.ts's `map()` does not support pointing buttons.

```ts
type PointerRemapConfig = {
  button: string;
  modifiers?: string[];
  description: string;
  to: ActionSpec[];
  ifApp?: string | string[];
};

function generatePointerRemapRule(config: PointerRemapConfig): Rule
```

Covers: `buildOnePieceClickEnterRule` in `special-keys.ts`. The `modifiers` field supports future cases like `cmd+button1`.

### `generateModifierChordRules` (`engine/modifier-chord-rules.ts`)

Generates a single rule containing a base key manipulator plus one manipulator per modifier variant. The base key supports variable tracking (set on press, cleared on key-up), a hold output, and an optional tap (if-alone) output. Variants are simpler modifier+key → output remaps.

```ts
type ModifierChordBase = {
  key: string;
  description: string;
  to: ActionSpec[];           // hold output
  toIfAlone?: ActionSpec[];   // tap output
  trackVar?: string;          // variable name set on press, cleared on key-up
};

type ModifierChordVariant = {
  modifiers: string[];
  description: string;
  to: ActionSpec[];
};

type ModifierChordConfig = {
  ruleName: string;
  base: ModifierChordBase;
  variants: ModifierChordVariant[];
};

function generateModifierChordRules(config: ModifierChordConfig): Rule
```

Covers: `hyper-chords.ts` (caps lock → hyper/super/meh).

## Per-File Migration Map

### Files requiring only type updates (data shape unchanged)

| File | Export | Type change |
| --- |---| --- |
| `definitions/special-keys.ts` | `enterKeyHoldMappings`, `equalsKeyHoldMappings` | `alone`/`hold` fields: `TapHoldActionSpec[]` → `ActionSpec[]` |
| `definitions/security.ts` | `securitySlashActionMappings` | action arrays: `ConditionalAction[]` → `ActionSpec[]` |
| `definitions/right-option-launchers.ts` | `rightOptionLaunchers` | `action` field: `LauncherAction` → `ActionSpec` |

### Files gaining a data config + engine call (currently bespoke)

| File | New config export | Engine call |
| --- |---| --- |
| `definitions/skim.ts` | `skimRemapMappings: AppScopedRemapMapping[]` | `generateAppScopedRemapRules` |
| `definitions/hyper-plus.ts` | `hyperPlusMappings: ModifierLauncherMapping[]` | `generateModifierLauncherRules({ triggerKey: HYPER, triggerLabel: "hyper", ... })` |
| `definitions/antinote.ts` | `antinoteDeleteGuard: DoubleTapGuardConfig` | `generateDoubleTapGuardRule` |
| `definitions/left-command-chords.ts` | `cmdQGuard: DoubleTapGuardConfig` | `generateDoubleTapGuardRule` |
| `definitions/left-command-chords.ts` | `leftCommandMultiTap: MultiTapConfig` | `generateMultiTapRule` |
| `definitions/escape-monitor.ts` | `escapeTapTapHold: MultiTapConfig` | `generateMultiTapRule` |
| `definitions/escape-monitor.ts` | `ctrlEscapeConfig: TapAloneHoldConfig` | `generateTapAloneHoldRule` |
| `definitions/special-keys.ts` | `onePieceClickEnter: PointerRemapConfig` | `generatePointerRemapRule` |
| `definitions/hyper-chords.ts` | `capsLockChordConfig: ModifierChordConfig` | `generateModifierChordRules` |

### Files with no changes

- `definitions/navigation.ts` — already clean
- `definitions/mouse.ts` — re-exports from engine; data shape unchanged
- `definitions/tap-hold.ts` — already uses `ActionSpec`
- `definitions/space-layers.ts` — already uses `ActionSpec`

## Types Deleted

- `TapHoldActionSpec`, `KeyActionSpec`, `ShellActionSpec` from `engine/conditional-tap-hold-rules.ts`
- `ConditionalAction` from `engine/conditional-action-rules.ts`
- `LauncherAction` from `engine/launcher-rules.ts`
- Local `SkimCommandRemap` type in `definitions/skim.ts`
- Local `HyperShellRuleDefinition`, `HyperShellRuleKey` types in `definitions/hyper-plus.ts`

## Testing Strategy

### Existing tests — no changes expected

- `integration.test.ts` — snapshot against full generated config; primary regression safety net for the ActionSpec migration (JSON output must be identical before and after)
- `rules-factories.test.ts`, `mappings.test.ts`, `conditions.test.ts`, `mouse.test.ts`, `scripts.test.ts` — unaffected

### New unit tests

| File | Covers |
| --- |---|
| `tests/rules-factories.test.ts` (extend) | `generateAppScopedRemapRules` — `ifApp` condition attached correctly |
| `tests/multi-tap.test.ts` *(new)* | `generateMultiTapRule` — alone/hold/tapTap/tapTapHold each produce correct manipulators |
| `tests/double-tap-guard.test.ts` *(new)* | `generateDoubleTapGuardRule` — var auto-derivation, app-scoped vs global, correct two-manipulator structure |
| `tests/tap-alone-hold.test.ts` *(new)* | `generateTapAloneHoldRule` — alone/hold events correct; cancel mirrors alone action |
| `tests/pointer-remap.test.ts` *(new)* | `generatePointerRemapRule` — button field, optional modifiers, optional ifApp |
| `tests/modifier-chord.test.ts` *(new)* | `generateModifierChordRules` — `trackVar` produces setVar/afterKeyUp pair; variants get correct mandatory modifiers |
