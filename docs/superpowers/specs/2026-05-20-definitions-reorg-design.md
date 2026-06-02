# Definitions Reorganization — Design

**Date:** 2026-05-20
**Scope:** `src/definitions/` file structure
**Goal:** Reorganize files in `src/definitions/` so each file maps cleanly to a trigger context (the modifier or key that fires the rule), with a small `apps/` subfolder for app-scoped overrides. Behavior of the generated Karabiner config must be unchanged.

## Problem

The current 14 files in `src/definitions/` use three different naming axes simultaneously:

- **By trigger:** `hyper-plus.ts`, `hyper-chords.ts`, `left-command-chords.ts`, `right-option-launchers.ts`, `escape-monitor.ts`
- **By engine:** `tap-hold.ts`, `navigation.ts`, `special-keys.ts`, `security.ts`
- **By app:** `antinote.ts`, `skim.ts`

Concrete consequences:

1. `tap-hold.ts` is 662 lines and mixes single-key bindings with `vmCOC_+*`, `left_command+*`, `left_shift+*`, and `right_option+*` chords — all because they share the tap-hold engine.
2. Finding every rule fired by the cmd+opt+ctrl virtual modifier required grepping `hyper-plus.ts`, `tap-hold.ts`, and `hyper-chords.ts` (the last being unrelated — it actually defines Caps Lock).
3. `special-keys.ts` contains Enter/Equals tap-holds and a pointer remap for OnePiece, which belong in different conceptual buckets.
4. `security.ts` mixes globally disabled shortcuts, a Word-specific binding, and a SecurityAgent password quick-fill.
5. The naming convention for "where does a new binding go?" is unclear.

## Goal

Reorganize so that:

- Each file at the root of `src/definitions/` corresponds to **one trigger context** (a modifier or key category).
- App-scoped overrides live in `src/definitions/apps/<app>.ts`.
- A small handful of cross-cutting files (`mouse.ts`, `system.ts`, `space.ts`) remain at the root.
- The generated `karabiner-output.json` is byte-identical before and after the reorg.

Non-goals:

- No changes to the engine layer (`src/engine/`).
- No changes to data references (`src/data/`).
- No changes to the rule semantics, action types, or generated Karabiner JSON.

## Target file layout

```
src/definitions/
├── index.ts                   # barrel: re-exports builders + aggregated tapHoldMappings
├── single-key.ts              # bare-key tap-holds (a, c, d, …, f12, slash, tab, application)
├── hyper.ts                   # vmCOC_ launchers + vmCOC_+X tap-hold chords
├── caps-lock.ts               # Caps Lock as vmCOC_ / vmCOCS / vmCO_S
├── left-command.ts            # Left CMD tap/double-tap/hold + cmd+m + cmd+p + CMD+Q guard
├── right-option.ts            # right_option launchers + right_option+k/s/t
├── escape.ts                  # bare escape + ctrl+escape
├── enter-equals.ts            # conditional tap-hold for Enter/Equals
├── home-end.ts                # Home/End remap
├── space.ts                   # space leader layers
├── mouse.ts                   # mouse device mappings (unchanged)
├── system.ts                  # disabled shortcuts + password quick-fill
└── apps/
    ├── antinote.ts            # CMD+D guard + left_shift+a launcher
    ├── skim.ts                # CMD+H/U remap
    ├── word.ts                # CMD+/ privileges
    └── onepiece.ts            # left-click → enter
```

13 files at root + 4 in `apps/`. No `apps/excel.ts`: the Excel branch of the Enter/Equals conditional rule stays inline in `enter-equals.ts` (splitting it would require importing variants between files for one rule and provides no real win).

## File-by-file mapping

| Current file | Disposition |
|---|---|
| `antinote.ts` | → `apps/antinote.ts` (gains `left_shift+a` launcher) |
| `escape-monitor.ts` | → `escape.ts` (rename) |
| `hyper-chords.ts` | → `caps-lock.ts` (rename — file describes Caps Lock, not Hyper) |
| `hyper-plus.ts` | → merged into `hyper.ts` |
| `left-command-chords.ts` | → merged into `left-command.ts` |
| `mouse.ts` | unchanged |
| `navigation.ts` | → `home-end.ts` (rename) |
| `right-option-launchers.ts` | → merged into `right-option.ts` |
| `security.ts` | split: disabled shortcuts + password quick-fill → `system.ts`; Word privileges → `apps/word.ts` |
| `skim.ts` | → `apps/skim.ts` |
| `space-layers.ts` | → `space.ts` (rename) |
| `special-keys.ts` | split: Enter/Equals → `enter-equals.ts`; OnePiece pointer remap → `apps/onepiece.ts` |
| `tap-hold.ts` | split four ways (see below); the remaining bare-key mappings → `single-key.ts` |
| `index.ts` | barrel exports + tapHoldMappings aggregation (see "Aggregation") |

### tap-hold.ts split

- **→ `single-key.ts`** (bare keys, no modifier): `a, c, d, f, g, h, j, k, n, o, p, r, s, t, v, x, y, z, 8, keypad_0, keypad_2, keypad_4, keypad_5, keypad_6, keypad_8, f1, f2, f3, f4, f5, f7, f8, f9, f10, f11, f12, slash, grave_accent_and_tilde, tab, fn, application`
- **→ `hyper.ts`**: `vmCOC_+a, vmCOC_+q, vmCOC_+w, vmCOC_+1, vmCOC_+2, vmCOC_+3, vmCOC_+4, vmCOC_+keypad_1, vmCOC_+keypad_3, vmCOC_+keypad_5, vmCOC_+keypad_7, vmCOC_+keypad_9, vmCOC_+spacebar, vmCOC_+tab, vmCOC_+left_arrow, vmCOC_+right_arrow`
- **→ `left-command.ts`**: `left_command+m, left_command+p`
- **→ `right-option.ts`**: `right_option+k, right_option+s, right_option+t`
- **→ `apps/antinote.ts`**: `left_shift+a`

`single-key.ts` is internally organized with section comments: `// LETTERS`, `// NUMBERS / KEYPAD`, `// FUNCTION KEYS`, `// SPECIAL` (slash, grave, tab, fn, application).

## Internal structure of merged trigger files

Trigger files contain mappings for multiple engine types. Each file exports them as **separate named exports keyed by engine**, and exports builder functions for engines whose rules can be built standalone (launchers, chord rules, guards). Tap-hold mappings are passed up to a single aggregation point.

Example — `hyper.ts`:

```ts
import { HYPER } from "../core/mods";
import { formatSelectionCommand, typinatorNewRuleCommand } from "../core/scripts";
import { PATHS } from "../data";
import { generateModifierLauncherRules, type ModifierLauncherMapping } from "../engine/launcher-rules";
import type { TapHoldConfig } from "../engine";

export const hyperLauncherMappings: ModifierLauncherMapping[] = [
  // s, t, semicolon, f12, escape
];

export const hyperTapHoldMappings: Record<string, TapHoldConfig> = {
  "vmCOC_+a": { /* … */ },
  "vmCOC_+q": { /* … */ },
  // …
};

export const buildHyperLauncherRules = () =>
  generateModifierLauncherRules({
    triggerKey: HYPER,
    triggerLabel: "vmCOC_",
    launchers: hyperLauncherMappings,
  });
```

Same shape applies to `left-command.ts`, `right-option.ts`, `single-key.ts`, and `apps/antinote.ts` — whichever engines they touch get their own named exports.

## Aggregation in `definitions/index.ts`

The split `tap-hold` records are merged inside `definitions/index.ts` so the consumer (`src/index.ts`) imports a single `tapHoldMappings` without knowing about the split.

```ts
// definitions/index.ts
import { singleKeyTapHoldMappings } from "./single-key";
import { hyperTapHoldMappings, buildHyperLauncherRules } from "./hyper";
import { leftCommandTapHoldMappings, buildLeftCommandRule, buildCmdQRule } from "./left-command";
import { rightOptionTapHoldMappings, buildRightOptionLauncherRules } from "./right-option";
import { antinoteTapHoldMappings, buildAntinoteRules } from "./apps/antinote";
// …other re-exports

function mergeTapHoldRecords(
  ...records: Array<Record<string, TapHoldConfig>>
): Record<string, TapHoldConfig> {
  const merged: Record<string, TapHoldConfig> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (key in merged) {
        throw new Error(`Duplicate tapHold key across definition files: ${key}`);
      }
      merged[key] = value;
    }
  }
  return merged;
}

export const tapHoldMappings = mergeTapHoldRecords(
  singleKeyTapHoldMappings,
  hyperTapHoldMappings,
  leftCommandTapHoldMappings,
  rightOptionTapHoldMappings,
  antinoteTapHoldMappings,
);

export {
  buildHyperLauncherRules,
  buildLeftCommandRule,
  buildCmdQRule,
  buildRightOptionLauncherRules,
  buildAntinoteRules,
  // …rest
};
```

The duplicate-key assertion catches accidental collisions that the current single-file structure cannot produce. It runs at module load and fails the build immediately.

## Build function renames

The build-function names embed old groupings in a few cases. As part of the reorg, rename:

- `buildHyperPlusRules` → `buildHyperLauncherRules`
- `buildRightOptionAppsRule` → `buildRightOptionLauncherRules`
- `buildAntinoteDeleteRule` → `buildAntinoteRules` (the file now also defines the `left_shift+a` global launcher)

Names that already match the new layout stay: `buildCapsLockRule`, `buildCmdQRule`, `buildLeftCommandRule`, `buildEscapeTapTapHoldRule`, `buildCtrlEscapeMonitorRule`, `buildHomeEndRule`, `buildEnterRules`, `buildEqualsRules`, `buildOnePieceClickEnterRule`, `buildSkimCommandRemapRule`, `buildWordPrivilegesRule`, `buildPasswordsQuickFillRule`, `buildDisableHideMinimizeRule`, `buildMouseRules`.

`src/index.ts` (entry point) updates its imports to the new names; its rule-list shape is unchanged.

## Verification

The reorg is purely structural: the generated `karabiner-output.json` must be byte-identical before and after.

1. Before any changes: build, copy `karabiner-output.json` → `karabiner-output.before.json` (gitignored).
2. After each migration step (see "Migration order"): build, diff against the snapshot. Expected: empty diff.
3. A non-empty diff blocks further work until reconciled.

`writeToProfile` serializes deterministically; byte equality is the contract.

## Migration order

Six steps, each self-contained and runnable. After each step run the full check pipeline — `npm run check` (typecheck + lint + test + build) — then diff `karabiner-output.json` against the pre-reorg snapshot. Expect: all checks pass and the diff is empty.

1. **Pure renames.** `escape-monitor.ts → escape.ts`, `navigation.ts → home-end.ts`, `space-layers.ts → space.ts`, `hyper-chords.ts → caps-lock.ts`. Update `definitions/index.ts` exports and `src/index.ts` imports.
2. **Create `apps/`.** Move `antinote.ts`, `skim.ts` into `apps/`. Extract `buildOnePieceClickEnterRule` from `special-keys.ts` → `apps/onepiece.ts`. Extract `buildWordPrivilegesRule` from `security.ts` → `apps/word.ts`.
3. **Create `system.ts`.** Move disabled shortcuts + `buildPasswordsQuickFillRule` out of `security.ts`. Delete now-empty `security.ts`.
4. **Rename `special-keys.ts → enter-equals.ts`** (now that OnePiece has been extracted).
5. **Merge into trigger files.** Create `hyper.ts`, `left-command.ts`, `right-option.ts` by combining the existing launcher/chord files with the corresponding `vmCOC_+*` / `left_command+*` / `right_option+*` slices from `tap-hold.ts`. Apply the build-function renames listed above. Each trigger file exports its `*TapHoldMappings` record.
6. **Rename remaining `tap-hold.ts → single-key.ts`** (after all chord slices are moved out). Move `left_shift+a` to `apps/antinote.ts`. Add the `mergeTapHoldRecords` aggregation + duplicate-key assertion in `definitions/index.ts`.

If a step's diff is non-empty, stop, find the typo, fix, re-verify before proceeding.

## Risks and mitigations

- **Duplicate keys after merge.** Mitigation: `mergeTapHoldRecords` asserts at boot.
- **Behavior drift from accidental edit during move.** Mitigation: per-step JSON diff against snapshot; any non-empty diff blocks progress.
- **Build function name churn breaks `src/index.ts`.** Mitigation: rename happens in step 5 of the migration where `src/index.ts` imports are updated in the same commit.
- **Missed import in `definitions/index.ts` barrel.** Mitigation: TypeScript compile failure at the consumer (`src/index.ts`) will catch missing exports.

## Out of scope

- Refactoring the engine layer (`src/engine/`).
- Changing rule semantics or action types.
- Consolidating duplicate-looking bindings (e.g., `right_option+a` and `left_shift+a` both opening Antinote — this is preserved as-is).
- Splitting `single-key.ts` further by purpose or category (deferred; section comments are sufficient for now).
- Splitting `mouse.ts` by device (only one device today).
