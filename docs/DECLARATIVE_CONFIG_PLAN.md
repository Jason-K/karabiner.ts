# Declarative Config Architecture

## Goal

Every keyboard behaviour is expressed as a `Binding[]` (the standardized surface) handed to a single entry point, `defineBindings`. Definition files never call `rule()`, `map()`, or `toKey()` directly and never iterate over their own mappings. All output events flow through a single conversion path: `ActionSpec` → `resolveActionToEvents` → karabiner.ts `ToEvent[]`.

> **Standardization in progress.** `defineBindings` + the `Binding` schema is the target surface. `home-end.ts` is migrated as the reference. The other definition files still use their legacy generator adapters (`generateTapHoldRules`, etc.), which are thin wrappers that translate their bespoke config into `Binding[]` and call `defineBindings`. The remaining migration is tracked in `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md` §7.

## Layer Responsibilities

| Layer              | Responsibility                                                                                         | Constraint                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `src/core/`        | Low-level builders and shared primitives (`tapHold`, `varTapTapHold`, `mapSimultaneous`, mods, scripts, leader internals) | No user-specific data                                                       |
| `src/engine/`      | `binding.ts` (`Binding` schema + `defineBindings`) and the generator adapters; the only layer that builds manipulators | No user-specific data                                                       |
| `src/definitions/` | Data configs expressed as `Binding[]` (or a legacy adapter config) plus one engine call per file       | No direct `karabiner.ts` imports, no iteration, no manipulator construction |
| `src/data/`        | App registry, folder registry, timings, paths, device IDs, UI labels                                   | Plain constants and registry refs only                                      |
| `src/tests/`       | Unit + integration regression coverage                                                                 | Snapshot of generated config plus per-engine-function tests                 |

`src/index.ts` is the single orchestration point: it imports definitions, runs the engine, and writes the profile.

## The `Binding` Schema (standardized definition surface)

Every behaviour is a `Binding` (`src/engine/binding.ts`). One binding = one description = one Karabiner rule.

```ts
type Phase = "press" | "release" | "hold";
// press → to · release → to_if_alone (tap) · hold → to_if_held_down

type Condition =
  | { app: string | string[]; unless?: boolean }
  | { var: string; equals: string | number; unless?: boolean }
  | { device: string; unless?: boolean }; // reserved for the mouse round

type Trigger =
  | { keys: string[]; modifiers?: string[]; order?: SimOrder } // 1 key = single; 2+ = simultaneous
  | { pointer: string; modifiers?: string[] };                 // reserved for the mouse round

type Case = {
  tapCount?: number;          // default 1; 2 = double-tap (framework-managed state)
  phase?: Phase;              // default "press"
  conditions?: Condition[];   // external state (app/var/device)
  do: ActionSpec[];           // { type: "noop" } = swallow (omits `to`)
};

type Binding = {
  description: string;        // also the rule-partition key
  trigger: Trigger;
  timing?: { aloneMs?; heldThresholdMs?; delayedMs?; simultaneousMs?: number };
  conditions?: Condition[];   // hoisted — applied to every case
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: { allowPassThrough?: boolean; mods?: string[] };
  afterKeyUp?: ActionSpec[];
};
```

`defineBindings(bindings: Binding[]): Rule[]` groups each binding's cases by `(tapCount, conditions)`, selects a builder by which phases/tapCounts are present, and routes to the existing core primitives — so output is identical to the legacy generators by construction:

- **remap** — press-only cases → `map().to(...)`
- **tapHold** — `release`/`hold` cases → one manipulator's `to_if_alone` / `to_if_held_down` / `to_delayed_action` (auto-wires tap-on-interrupt responsiveness)
- **multiTap** — any `tapCount ≥ 2` → `varTapTapHold` var-dance

Three patterns stay specialized (not forced into cases): **`modifierChord`** (caps-lock — variants change the trigger), **`guard`** (cmd-q — second tap fires on press, unlike multiTap's release), **`reset`** (escape var-reset). See the design spec §5.

The `to_delayed_action` channel (`to_if_invoked` / `to_if_canceled`) is **not** exposed as a phase — every actual usage is framework-internal (tapCount var-dance, responsiveness). See spec §3.6.

## Single Action Vocabulary

`ActionSpec` (`src/core/action-dsl.ts`) is the one type used for output events across the entire engine. `resolveActionToEvents` (`src/engine/action-resolver.ts`) is the only conversion path from `ActionSpec` to karabiner.ts `ToEvent[]`. The trigger side of a binding (`keys`, `modifiers`, `order`) is not an `ActionSpec` — it lives on `Binding.trigger`.

Variants of `ActionSpec`:

```ts
type ActionSpec =
  | { type: "app"; ref: AppRef; mode?: "open" | "focus" | "shell" }
  | { type: "appHistory"; index: number }
  | { type: "folder"; ref: FolderRef }
  | { type: "raycast"; ref: RaycastRef }
  | { type: "cleanShot"; ref: CleanShotRef }
  | { type: "actHere"; action: string }
  | { type: "noop" } // emits no to-events (swallow)
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
  | { type: "python"; scriptPath: string; venv?: string; args?: string[] }
  | { type: "osascript"; scriptPath: string; args?: string[] }
  | { type: "cut" | "copy" | "paste" }
  | { type: "sequence"; actions: ActionSpec[] };
```

`sequence` is flattened recursively at resolve time. `noop` resolves to no events (so a `noop` case omits the `to` key entirely — used for disabled-shortcuts and the guard's first-tap swallow). Note `noop` is distinct from `{ type: "key"; key: "vk_none" }`, which emits a real `vk_none` event.

## Engine Function Inventory

`defineBindings` is the core. The `generate*` functions are thin adapters that translate their bespoke config into `Binding[]` and call it; they exist so definition files can migrate one at a time. The specials build their own manipulator shapes.

| Function                           | File                                   | Role                                                                                                                                                    |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineBindings`                   | `engine/binding.ts`                    | **Core.** `Binding[]` → `Rule[]` (remap / tapHold / multiTap builders)                                                                                  |
| `resolveActionToEvents`            | `engine/action-resolver.ts`            | Convert any `ActionSpec` (or `sequence`) into karabiner.ts `ToEvent[]`                                                                                  |
| `generateSimpleRemapRules`         | `engine/simple-rules.ts`               | Adapter — one-to-one key remaps (→ remap builder)                                                                                                       |
| `generateAppScopedRemapRules`      | `engine/simple-rules.ts`               | Adapter — remaps gated on a frontmost-app condition                                                                                                     |
| `generateDisabledShortcutRules`    | `engine/simple-rules.ts`               | Adapter — swallow a chord (noop cases)                                                                                                                  |
| `generateTapHoldRules`             | `engine/tap-hold-rules.ts`             | Adapter — tap/hold dict with conflict prevention against the leader layer                                                                               |
| `generateConditionalTapHoldRules`  | `engine/conditional-tap-hold-rules.ts` | Adapter — tap/hold where alone/hold vary by frontmost app (one binding per variant)                                                                     |
| `generateConditionalActionRules`   | `engine/conditional-action-rules.ts`   | Adapter — trigger → `ActionSpec[]` with conditional dispatch                                                                                            |
| `generateMultiTapRule`             | `engine/multi-tap-rules.ts`            | Adapter — alone/hold/tapTap/tapTapHold slots                                                                                                            |
| `generateTapAloneHoldRule`         | `engine/tap-alone-hold-rules.ts`       | Adapter — toIfAlone/toIfHeldDown/toDelayedAction                                                                                                        |
| `generateModifierLauncherRules`    | `engine/launcher-rules.ts`             | Adapter — modifier-key launchers (e.g. `vmCOCS` + key)                                                                                                  |
| `generateModifierChordRules`       | `engine/modifier-chord-rules.ts`       | **Special** — base key + modifier-variant chord remaps (caps lock)                                                                                      |
| `generateDoubleTapGuardRule`       | `engine/double-tap-guard-rules.ts`     | **Special** — require a double press within a timeout before pass-through (cmd-q)                                                                       |
| `generatePointerRemapRule`         | `engine/pointer-remap-rules.ts`        | Adapter — pointing-button remap (raw manipulator; karabiner.ts `map()` has no pointing-button support)                                                 |
| `generateSimultaneousRules`        | `engine/simultaneous-rules.ts`         | Adapter — simultaneous-key chord rules                                                                                                                  |
| `generateMouseRules`               | `engine/mouse-rules.ts`                | Per-device mouse tap-hold/double-tap mappings (not yet unified under `Binding`; see spec §7)                                                            |
| `generateEscapeRule`               | `engine/escape-rule.ts`                | **Special** — resets all layer/state variables on Escape                                                                                                |
| `generateLayerRules`               | `core/leader/build.ts`                 | Generic leader-layer compiler (space leader)                                                                                                            |
| `emitLayerDefinitions`             | `engine/layer-emit.ts`                 | Emits Hammerspoon layer definitions for the indicator GUI                                                                                               |
| `updateDeviceConfigurations`       | `engine/device-config.ts`              | Patches per-device simple modifications into the profile after `writeToProfile`                                                                         |

## Definition File Pattern

A migrated definition (the target shape) speaks `Binding[]` + `defineBindings` directly:

```ts
// definitions/home-end.ts
import { formatRuleDescription } from "../core/rule-descriptions";
import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    description: formatRuleDescription(["home"], "Move to line start", "tap"),
    trigger: { keys: ["home"] },
    cases: [
      { phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }] },
    ],
  },
  // ...
];

export const buildHomeEndRule = () => defineBindings(homeEndBindings);
```

A not-yet-migrated definition uses its legacy adapter config + generator (which internally builds `Binding[]` and calls `defineBindings`):

```ts
// definitions/antinote.ts
import { Apps } from "../data";
import { generateDoubleTapGuardRule, type DoubleTapGuardConfig } from "../engine/double-tap-guard-rules";

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [Apps.antinote, Apps.antinoteLegacy],
};

export const buildAntinoteDeleteRule = () => generateDoubleTapGuardRule(antinoteDeleteGuard);
```

The data export is the contract. The `build*` wrapper exists so `src/index.ts` does not have to know which engine function generated the rule.

Allowed in `src/definitions/`:

- `Binding[]` literals (preferred) or legacy adapter config literals
- trigger keys, modifiers, descriptions
- registry refs from `src/data/` (apps, folders, raycast, cleanshot)
- `ActionSpec` literals
- `Condition` literals (`{ app }`, `{ var, equals }`)
- exactly one engine call per behaviour

Not allowed in `src/definitions/`:

- imports from `karabiner.ts`
- calls to `map()`, `rule()`, `toKey()`, `cmd()`, `focusApp()`
- iteration over the file's own data
- manipulator construction

## Definition File Inventory

| File                            | Engine call(s)                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `definitions/apps/antinote.ts`   | `generateDoubleTapGuardRule`                                                   |
| `definitions/apps/onepiece.ts`   | `generatePointerRemapRule` (app-scoped)                                        |
| `definitions/apps/skim.ts`       | `generateAppScopedRemapRules`                                                  |
| `definitions/apps/word.ts`       | `generateConditionalActionRules`                                               |
| `definitions/apps/zen.ts`        | `generateAppScopedRemapRules`                                                  |
| `definitions/caps-lock.ts`       | `generateModifierChordRules` (special)                                         |
| `definitions/enter-equals.ts`    | `generateConditionalTapHoldRules`                                              |
| `definitions/escape.ts`          | `generateMultiTapRule`, `generateTapAloneHoldRule`                             |
| `definitions/home-end.ts`        | `defineBindings` (**migrated** — `Binding[]`)                                  |
| `definitions/hyper.ts`           | `generateModifierLauncherRules`, `generateTapHoldRules` (tap-hold dict)        |
| `definitions/left-command.ts`    | `generateMultiTapRule`, `generateDoubleTapGuardRule`, `generateTapHoldRules`   |
| `definitions/mouse.ts`           | `generateMouseRules` (not yet unified under `Binding`)                         |
| `definitions/right-option.ts`    | `generateTapHoldRules` (tap-hold dict)                                         |
| `definitions/shift.ts`           | `generateMultiTapRule`                                                         |
| `definitions/simultaneous.ts`    | `generateSimultaneousRules`                                                    |
| `definitions/single-key.ts`      | `generateTapHoldRules` (tap-hold dict)                                         |
| `definitions/system.ts`          | `generateDisabledShortcutRules`, `generateConditionalActionRules`              |

## Practical Rule

If a file answers "what should this key do?", it belongs in `src/definitions/`.

If a file answers "how do we turn that declaration into Karabiner JSON?", it belongs in `src/engine/`.

If a file is a low-level builder, a shared helper, or part of the leader runtime, it belongs in `src/core/`.

If a file is a plain registry or constant table consumed across layers, it belongs in `src/data/`.

## Adding a New Behaviour

1. **Prefer the `Binding` schema.** Express the behaviour as a `Binding[]` and call `defineBindings`. If its shape matches a legacy adapter exactly, that adapter is fine too — pick whichever is clearer.
2. Create or edit the file in `src/definitions/` that owns the behaviour. Export the data config (a `Binding[]` or adapter config) and a `build*` function that returns the engine call.
3. Wire the `build*` function into `src/index.ts`.
4. Run `npm run typecheck && npm test && CI=true npx tsx src/index.ts` and confirm `git diff karabiner-output.json` reflects only intended changes. (Do not run `npm run build` during iteration — it writes the live Karabiner profile. Use `CI=true npx tsx src/index.ts` to regenerate the golden without deploying.)

## Reference

- `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md` — the `Binding`/`defineBindings` design (the current standardization)
- `docs/superpowers/plans/2026-07-21-engine-consolidation.md` — the task-by-task consolidation plan
- `docs/superpowers/specs/2026-05-20-rule-generation-standardization-design.md` — prior standardization (the adapter layer this builds on)
- `docs/INTEGRATION_SUMMARY.md` — upstream/local boundaries
- `docs/COMMAND_SERVER_GUIDE.md` — when to use the user command server vs shell commands
