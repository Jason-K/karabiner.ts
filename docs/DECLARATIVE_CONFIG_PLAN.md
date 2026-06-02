# Declarative Config Architecture

## Goal

Every keyboard behaviour is expressed as a data config plus a single engine-function call. Definition files never call `rule()`, `map()`, or `toKey()` directly and never iterate over their own mappings. All output events flow through a single conversion path: `ActionSpec` → `resolveActionToEvents` → karabiner.ts `ToEvent[]`.

## Layer Responsibilities

| Layer              | Responsibility                                                                                         | Constraint                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `src/core/`        | Low-level builders and shared primitives (`tapHold`, `varTapTapHold`, mods, scripts, leader internals) | No user-specific data                                                       |
| `src/engine/`      | Engine functions: convert typed config → `Rule[]`                                                      | No user-specific data; sole place that builds manipulators                  |
| `src/definitions/` | Data configs + one engine-function call per file                                                       | No direct `karabiner.ts` imports, no iteration, no manipulator construction |
| `src/data/`        | App registry, folder registry, timings, paths, device IDs, UI labels                                   | Plain constants and registry refs only                                      |
| `src/tests/`       | Unit + integration regression coverage                                                                 | Snapshot of generated config plus per-engine-function tests                 |

`src/index.ts` is the single orchestration point: it imports definitions, runs the engine, and writes the profile.

## Single Action Vocabulary

`ActionSpec` (`src/core/action-dsl.ts`) is the one type used for output events across the entire engine. `resolveActionToEvents` (`src/engine/action-resolver.ts`) is the only conversion path from `ActionSpec` to karabiner.ts `ToEvent[]`. The trigger side of a mapping (key, button, modifiers) is not an `ActionSpec` — it remains explicit key/modifier fields.

Variants of `ActionSpec`:

```ts
type ActionSpec =
  | { type: "app"; ref: AppRef; mode?: "open" | "focus" | "shell" }
  | { type: "appHistory"; index: number }
  | { type: "folder"; ref: FolderRef }
  | { type: "raycast"; ref: RaycastRef }
  | { type: "cleanShot"; ref: CleanShotRef }
  | { type: "actHere"; action: string }
  | {
      type: "caseChange";
      operation: "lowercase" | "sentence_case" | "title_case" | "uppercase";
    }
  | {
      type: "wrapString";
      operation:
        | "wrap_braces"
        | "wrap_parentheses"
        | "wrap_quotes"
        | "wrap_brackets";
      delaySeconds?: number;
    }
  | {
      type: "key";
      key: string;
      modifiers?: string[];
      options?: { repeat?: boolean; halt?: boolean; lazy?: boolean };
    }
  | { type: "url"; url: string; background?: boolean }
  | { type: "shell"; command: string }
  | { type: "osascript"; scriptPath: string; args?: string[] }
  | { type: "cut" | "copy" | "paste" }
  | { type: "sequence"; actions: ActionSpec[] };
```

`sequence` exists for fields that accept a single `ActionSpec` rather than `ActionSpec[]` (for example `ModifierLauncherMapping.action` and `SubLayerConfig` action fields). It is flattened recursively at resolve time.

## Engine Function Inventory

Each engine function takes a typed config and returns one or more `Rule`s. Definitions reach for the engine function whose config shape matches the behaviour they want.

| Engine function                   | File                                   | Purpose                                                                                                                                               |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveActionToEvents`           | `engine/action-resolver.ts`            | Convert any `ActionSpec` (or `sequence` of them) into karabiner.ts `ToEvent[]`                                                                        |
| `generateSimpleRemapRules`        | `engine/simple-rules.ts`               | One-to-one key remaps with optional modifiers and conditions                                                                                          |
| `generateAppScopedRemapRules`     | `engine/simple-rules.ts`               | Simple remaps gated on a `frontmost_application_if` condition                                                                                         |
| `generateTapHoldRules`            | `engine/tap-hold-rules.ts`             | Tap/hold split with automatic conflict prevention against the space layer                                                                             |
| `generateConditionalTapHoldRules` | `engine/conditional-tap-hold-rules.ts` | Tap/hold split where `alone` and `hold` vary by frontmost-app condition                                                                               |
| `generateConditionalActionRules`  | `engine/conditional-action-rules.ts`   | Direct trigger → `ActionSpec[]` with conditional dispatch (and optional delayed-action handlers)                                                      |
| `generateMultiTapRule`            | `engine/multi-tap-rules.ts`            | Single key with `alone`, `hold`, `tapTap`, and `tapTapHold` slots (`tapTap` and `tapTapHold` exclusive)                                               |
| `generateDoubleTapGuardRule`      | `engine/double-tap-guard-rules.ts`     | Require a chord to be pressed twice within a timeout before passing through; var name auto-derived                                                    |
| `generateTapAloneHoldRule`        | `engine/tap-alone-hold-rules.ts`       | `toIfAlone`/`toIfHeldDown`/`toDelayedAction` pattern; cancel re-fires the alone action                                                                |
| `generateModifierLauncherRules`   | `engine/launcher-rules.ts`             | Modifier-key launchers; `triggerKey` accepts a single key or a modifier set (for example `HYPER`, labeled `vmCOC_`) plus a label                      |
| `generateModifierChordRules`      | `engine/modifier-chord-rules.ts`       | Base key with optional `trackVar`/tap/hold plus modifier-variant chord remaps (caps lock → `vmCOC_` / `vmCOCS` / `vmCO_S`)                            |
| `generatePointerRemapRule`        | `engine/pointer-remap-rules.ts`        | Pointing-button remap (with optional modifiers and `ifApp`) — builds the raw manipulator since karabiner.ts `map()` does not support pointing buttons |
| `generateMouseRules`              | `engine/mouse-rules.ts`                | Per-device mouse tap-hold and double-tap mappings                                                                                                     |
| `generateLayerRules`              | `core/leader/build.ts`                 | Generic leader-layer compiler (the space leader is its main caller)                                                                                   |
| `generateEscapeRule`              | `engine/escape-rule.ts`                | Single rule that resets all layer/state variables when Escape is pressed                                                                              |
| `emitLayerDefinitions`            | `engine/layer-emit.ts`                 | Emits Hammerspoon layer definitions for the indicator GUI                                                                                             |
| `updateDeviceConfigurations`      | `engine/device-config.ts`              | Patches per-device simple modifications into the profile after `writeToProfile`                                                                       |

## Definition File Pattern

Every file in `src/definitions/` follows the same shape:

```ts
// definitions/antinote.ts
import { appRegistry } from "../data";
import {
  generateDoubleTapGuardRule,
  type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [appRegistry.antinote, appRegistry.antinoteLegacy],
};

export const buildAntinoteDeleteRule = () =>
  generateDoubleTapGuardRule(antinoteDeleteGuard);
```

The data export is the contract. The `build*` wrapper exists so `src/index.ts` does not have to know which engine function generated the rule.

Allowed in `src/definitions/`:

- trigger keys, modifiers, descriptions
- registry refs from `src/data/` (apps, folders, raycast, cleanshot)
- `ActionSpec` literals
- `ifApp` conditions (string or string[])
- exactly one engine-function call per behaviour

Not allowed in `src/definitions/`:

- imports from `karabiner.ts`
- calls to `map()`, `rule()`, `toKey()`, `cmd()`, `focusApp()`
- iteration over the file's own data
- manipulator construction

## Definition File Inventory

| File                                    | Engine call(s)                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `definitions/antinote.ts`               | `generateDoubleTapGuardRule`                                                         |
| `definitions/escape-monitor.ts`         | `generateMultiTapRule`, `generateTapAloneHoldRule`                                   |
| `definitions/caps-lock.ts`              | `generateModifierChordRules`                                                         |
| `definitions/hyper.ts`                  | `generateModifierLauncherRules` (with `triggerKey: HYPER`, `triggerLabel: "vmCOC_"`) |
| `definitions/left-command-chords.ts`    | `generateMultiTapRule`, `generateDoubleTapGuardRule`                                 |
| `definitions/mouse.ts`                  | `generateMouseRules`                                                                 |
| `definitions/navigation.ts`             | `generateSimpleRemapRules`                                                           |
| `definitions/right-option-launchers.ts` | `generateModifierLauncherRules`                                                      |
| `definitions/security.ts`               | `generateSimpleRemapRules`, `generateConditionalActionRules`                         |
| `definitions/skim.ts`                   | `generateAppScopedRemapRules`                                                        |
| `definitions/space-layers.ts`           | `generateLayerRules` (via `src/index.ts`)                                            |
| `definitions/special-keys.ts`           | `generateConditionalTapHoldRules`, `generatePointerRemapRule`                        |
| `definitions/tap-hold.ts`               | `generateTapHoldRules` (via `src/index.ts`)                                          |

## Practical Rule

If a file answers "what should this key do?", it belongs in `src/definitions/`.

If a file answers "how do we turn that declaration into Karabiner JSON?", it belongs in `src/engine/`.

If a file is a low-level builder, a shared helper, or part of the leader runtime, it belongs in `src/core/`.

If a file is a plain registry or constant table consumed across layers, it belongs in `src/data/`.

## Adding a New Behaviour

1. Pick the engine function whose config shape matches the behaviour. If none fit, extend the closest one or add a new file in `src/engine/` with its own test in `src/tests/`.
2. Create or edit the file in `src/definitions/` that owns the behaviour. Export a typed data config and a `build*` function that returns the engine call.
3. Wire the `build*` function into `src/index.ts`.
4. Run `npm run typecheck && npm test && npm run build`. The integration snapshot test will catch any unintended JSON drift.

## Reference

- `docs/superpowers/specs/2026-05-20-rule-generation-standardization-design.md` — design doc for the most recent standardization
- `docs/superpowers/plans/2026-05-20-rule-generation-standardization.md` — task-by-task migration plan
- `docs/INTEGRATION_SUMMARY.md` — upstream/local boundaries
- `docs/COMMAND_SERVER_GUIDE.md` — when to use the user command server vs shell commands
