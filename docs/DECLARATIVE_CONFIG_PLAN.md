# Declarative Config Plan

## Goal

Move recurring keyboard intent into declarative mapping files and keep imperative Karabiner builder logic in reusable generators.

The target split is:

- `src/mappings`: plain intent data only
- `src/generators`: reusable compilers from intent data to Karabiner rules
- `src/rules`: thin adapters for exceptional or stateful rules that are not yet covered by a generator

## Folder Semantics

### `src/mappings`

Use this folder for declarative definitions only.

Allowed:

- trigger keys
- descriptions
- bundle IDs
- folder paths
- symbolic action descriptors
- registry references for apps, folders, and integrations
- per-entry flags and simple metadata

Not allowed:

- `map(...)`
- `rule(...)`
- `toKey(...)`
- `cmd(...)`
- `focusApp(...)`
- helper-built command strings from `lib/scripts`
- direct Karabiner condition objects

### `src/generators`

Use this folder for reusable translation logic.

Responsibilities:

- convert symbolic actions into `ToEvent`s
- build standard rule shapes from mapping tables
- centralize common description formatting and boilerplate
- handle reusable patterns like tap-hold, multi-tap, and launchers

### `src/rules`

Use this folder only when one of these is true:

- the rule is genuinely stateful
- the rule needs a one-off builder shape
- the rule is a temporary adapter that composes `mappings` and `generators`

## Current Classification

### Already good mapping candidates

- `src/mappings/apps.ts`
- `src/mappings/cleanshot.ts`
- `src/mappings/disabled-shortcuts.ts`
- `src/mappings/folders.ts`
- `src/mappings/navigation.ts`
- `src/mappings/mouse.ts`
- `src/mappings/raycast.ts`
- `src/mappings/right-option-launchers.ts`
- `src/mappings/security-actions.ts`
- `src/mappings/special-key-holds.ts`
- `src/mappings/space-layer.ts`
- `src/mappings/space-layers.ts`
- `src/mappings/tap-hold.ts`

### Good generator surfaces

- `src/generators/action-resolver.ts`
- `src/generators/conditional-action-rules.ts`
- `src/generators/conditional-tap-hold-rules.ts`
- `src/generators/launcher-rules.ts`
- `src/generators/simple-rules.ts`
- `src/generators/tap-hold-rules.ts`
- `src/generators/layer-emit.ts`
- `src/generators/escape-rule.ts`

### Should stay in `src/rules` for now

- `src/rules/left-command-chords.ts`
- `src/rules/escape-monitor.ts`
- `src/rules/hyper-chords.ts`
- `src/rules/mouse.ts`
- `src/rules/security.ts`

These files currently mix state, delayed actions, or complex conditions that do not yet fit a shared declarative schema cleanly.

`src/rules/mouse.ts` is currently a device-scoping adapter that composes declarative mouse mappings into per-device Karabiner rules, including alias resolution and tap-hold/double-tap builders.

### Current thin adapters

- `src/rules/right-option-launchers.ts`
  - now reduced to a thin adapter over `src/mappings/right-option-launchers.ts` and `src/generators/launcher-rules.ts`
- `src/rules/special-keys.ts`
  - `buildHomeEndRule` now delegates to `src/mappings/navigation.ts` and `src/generators/simple-rules.ts`
  - `buildEnterRules` and `buildEqualsRules` now delegate to `src/mappings/special-key-holds.ts` and `src/generators/conditional-tap-hold-rules.ts`
- parts of `src/rules/security.ts`
  - disabled shortcut rules now delegate to `src/mappings/disabled-shortcuts.ts` and `src/generators/simple-rules.ts`
  - slash-triggered security actions now delegate to `src/mappings/security-actions.ts` and `src/generators/conditional-action-rules.ts`

These are still public call sites from `src/index.ts`, but most of their logic has already moved into reusable mappings and generators.

## Suggested Next Schemas

### Launcher chord schema

Used now by right-option launchers.

```ts
type LauncherAction =
  | { type: "focusApp"; bundleId: string }
  | { type: "openFolder"; path: string };

type ModifierLauncherMapping = {
  key: string;
  description: string;
  action: LauncherAction;
};
```

### Navigation remap schema

Good next target for `HOME` / `END` remaps.

```ts
type NavigationMapping = {
  from: string;
  modifiers?: string[];
  description: string;
  to: {
    key: string;
    modifiers?: string[];
  };
};
```

### Disabled chord schema

Good target for the simple disable rules in `security.ts`.

```ts
type DisabledChordMapping = {
  key: string;
  modifiers: string[];
  description: string;
};
```

### Conditional action schema

Used now by slash-triggered security actions.

```ts
type ConditionalActionMapping = {
  key: string;
  modifiers: string[];
  description: string;
  when: Array<
    | { type: "frontmostApp"; bundleIds: string[] }
    | { type: "variable"; name: string; match: "if" | "unless"; value: string | number }
  >;
  actions: Array<
    | { type: "key"; key: string; modifiers?: string[] }
    | { type: "shell"; command: string }
  >;
};
```

### Shared action DSL

Used now by `space-layers.ts` and `tap-hold.ts`.

```ts
type ActionSpec =
  | { type: "app"; ref: AppRef; mode?: "open" | "focus" | "shell" }
  | { type: "appHistory"; index: number }
  | { type: "folder"; ref: FolderRef }
  | { type: "raycast"; ref: RaycastRef }
  | { type: "cleanShot"; ref: CleanShotRef }
  | { type: "takeActionHere"; action: string }
  | { type: "selectionTransform"; operation: string }
  | { type: "selectionWrap"; operation: string; delaySeconds?: number }
  | { type: "key"; key: string; modifiers?: string[]; options?: Record<string, boolean> }
  | { type: "url"; url: string; background?: boolean }
  | { type: "shell"; command: string }
  | { type: "applescript"; scriptPath: string; args?: string[] }
  | { type: "cut" | "copy" | "paste" };
```

### Mouse binding schema

Mouse bindings are now split into declarative device mappings plus reusable builders:

- `src/mappings/mouse.ts`: per-device intent (`MouseDeviceConfig`, `MouseTapHoldMapping`, `MouseDoubleTapMapping`)
- `src/lib/mouse.ts`: alias resolution (`g502xButtons`) and generic helpers (`mouseTapHold`, `mouseVarTapTapHold`)
- `src/rules/mouse.ts`: compiles mapping tables into device-guarded Karabiner rules

```ts
type MouseTapHoldMapping = {
  type: "tapHold";
  button: string;
  description: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  thresholdMs?: number;
  timeoutMs?: number;
};

type MouseDoubleTapMapping = {
  type: "doubleTap";
  button: string;
  description: string;
  firstVar: string;
  aloneEvents?: ToEvent[];
  holdEvents?: ToEvent[];
  tapTapEvents?: ToEvent[];
  tapTapHoldEvents?: ToEvent[];
  allowPassThrough?: boolean;
  thresholdMs?: number;
};
```

Current limitation: scroll up/down chord triggers are not expressible as basic `from` events in this pipeline, so `src/mappings/mouse.ts` tracks those as explicit pending requests (`mouseScrollChordRequests`) with external bridge notes.

## Recommended Sequence

1. Keep new mapping-shaped additions in `src/mappings` first.
2. Extend existing generators before creating one-off rule builders.
3. Leave stateful one-offs in `src/rules` until a clean schema emerges.
4. Collapse thin adapters only when doing so reduces, rather than obscures, the public entrypoint surface.
5. Prefer registry refs over raw bundle IDs, folder paths, and Raycast routes inside mapping files.

## Practical Rule

If a file answers the question "what should this key do?", it probably belongs in `src/mappings`.

If a file answers the question "how do we turn that declaration into Karabiner JSON?", it belongs in `src/generators`.

If a file answers the question "how do we hand-build this unusual behavior that our schemas cannot express yet?", it belongs in `src/rules`.
