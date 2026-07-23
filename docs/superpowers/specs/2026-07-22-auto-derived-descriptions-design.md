# Auto-Derived Manipulator Descriptions — Design

**Date:** 2026-07-22
**Branch:** `refactor_engine`
**Status:** Design (pending user review) — supersedes the tap-hold/conventions brainstorm

## 1. Goal

Today every definition hand-calls `formatRuleDescription(chord, desc, trigger)` to produce a one-line rule description, and manipulators carry no description. This is verbose, drift-prone (the chord string is restated separately from the trigger), and produces terse UI text.

**New goal:** the engine **auto-derives** a rich, multi-line rule description from a binding's own values — trigger, phases, conditions, and the actions' referenced targets. Definition authors stop calling `formatRuleDescription` entirely (an optional `description` remains as an override). To make this possible, registry entries gain human labels via three new primitives: **`RefSpec`**, **`VarSpec`**, **`DeviceSpec`**.

This is the **primary** redesign for round 2. It subsumes the Goal 2 "harmonize conventions" work and reframes the tap-hold migration as its final phase.

## 2. The two locked decisions

1. **Rich breakdown lives at the rule level (option 1a).** The multi-line description is the _rule_ description (one per binding/trigger); the physical manipulators underneath carry only a short condition-slice label. No duplication.
2. **Byte-identical is dropped — for descriptions only.** Non-description output (events, triggers, conditions, timing) must stay behavior-identical, verified by a **description-agnostic structural diff**. The snapshot is regenerated once; the description _format_ is locked by **synthesizer unit tests**, not the snapshot.

## 3. The hard Karabiner constraint (why slice-labels, not one manipulator)

A manipulator's `conditions[]` gate the **entire** manipulator (`to` / `to_if_alone` / `to_if_held_down` together), not individual channels. So "tap does X in Excel, Y outside Excel" is necessarily **two physical manipulators** — one `conditions:[excel]`, one `conditions:[not-excel]`. "One manipulator per trigger regardless of conditions" is not physically achievable when actions vary by condition.

Therefore: a binding produces N physical manipulators (one per condition-group), and **all N share the same rich rule description**; each manipulator additionally gets its own short slice-label so the UI shows which condition-group it is.

## 4. New primitives

### 4.1 `RefSpec` — labeled registry entries

Replaces the label-less string registries (`appRegistry`, `folderRegistry`, `raycastRegistry`, `cleanShotRegistry`, `commandRegistry`). Each entry becomes an object:

```ts
export type RefSpecType =
  | "app"
  | "folder"
  | "raycast"
  | "cleanShot"
  | "command"
  | "url";

export type RefSpec = {
  type: RefSpecType;
  name: string | string[]; // the value(s): bundle id(s) / path / deeplink / command / url
  refDesc: string; // human label used to derive descriptions
};
```

Per-category aliases keep action refs type-safe (an app action's ref can't be a folder):

```ts
export type AppRef = RefSpec; // type: "app"
export type FolderRef = RefSpec; // type: "folder"
export type RaycastRef = RefSpec; // type: "raycast"
export type CleanShotRef = RefSpec; // type: "cleanShot"
export type CommandRef = RefSpec; // type: "command"
export type UrlRef = RefSpec; // type: "url"
```

- `name: string | string[]` supports apps with legacy bundles (e.g. a unified antinote entry holding both bundle ids), replacing today's two-entry pattern.
- `commandRegistry` entries become `RefSpec` (`type: "command"`), enabling a new first-class `command` action variant (§5) so shell commands get `refDesc` like "Evaluate selection".
- `urlRegistry` (currently empty) becomes `RefSpec` (`type: "url"`) when populated.
- **`folderOpener` pseudo-app:** `appRegistry.folderOpener` currently holds the sentinel `"__folder_opener__"` resolved dynamically via `getFolderOpenerBundleId()`. Under `RefSpec`: `name: getFolderOpenerBundleId()` (computed at module load), `refDesc: "Folder opener"`.

### 4.2 `VarSpec` — labeled variables

```ts
export type VarSpec = {
  name: string; // the variable name written to Karabiner
  varDesc: string; // human label for descriptions
};
```

Migrates `ACCESSIBILITY_VARIABLES` (e.g. `focusedUiRole` → `{ name: "accessibility.focused_ui_element.role_string", varDesc: "Focused UI role" }`). Framework-managed vars that appear in descriptions (`multi_tap_*`, `wheel_down`, `right_button_pressed`, leader state) also become `VarSpec`s; `varDesc` may be optional for purely internal vars (fall back to `name`).

### 4.3 `DeviceSpec` — labeled devices

```ts
export type DeviceSpec = {
  name: string; // registry key / identifier
  deviceDesc: string; // human label
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
};
```

Migrates `DEVICE_IDENTIFIERS` (appleNumericKeypad, logitechG502X) — each gains `deviceDesc`. Reserved for the mouse round; `Condition.device` (§6) consumes it.

## 5. `ActionSpec` changes

Two structural changes plus description-template semantics.

**(a) `ref` becomes a direct object reference.** Today `ref: "excel"` (a string key, resolved via `appRegistry[ref]`); tomorrow `ref: appRegistry.excel` (the `RefSpec` itself). `resolveActionToEvents` reads `action.ref.name`. Type-safe; no string-key indirection; the synthesizer reads `action.ref.refDesc` directly.

**(b) `actionDesc?` on the variants that need a nuance** (`app`, `folder`, `raycast`, `url`, `shell`, `python`, `osascript`, `key`). Appended to the derived description as ` | <actionDesc>`.

**(c) New `command` variant** (commands become first-class refs):

```ts
| { type: "command"; ref: CommandRef; actionDesc?: string }
```

Today's `{ type: "shell"; command: commandRegistry.fillPassword }` pattern becomes `{ type: "command"; ref: commandRegistry.fillPassword }` — describable via `refDesc`. The `shell` variant remains for ad-hoc commands.

**Description templates** (what each action contributes to the description):

| Action               | Template                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `app`                | `open/focus/open-shell <refDesc>` (by `mode`) `[ \| actionDesc]`         |
| `appHistory`         | `Go back <index> apps`                                                   |
| `folder`             | `open '<refDesc>'` `[ \| actionDesc]`                                    |
| `raycast`            | `Call '<refDesc>'` `[ \| actionDesc]`                                    |
| `cleanShot`          | `<refDesc> using CSX`                                                    |
| `command`            | `Run command '<refDesc>'` `[ \| actionDesc]`                             |
| `actHere`            | `Context action: <action>` (derive from the `action` string)             |
| `caseChange`         | `Change case to <operation>`                                             |
| `wrapString`         | `Wrap selection in <operation>`                                          |
| `key`                | `Emit '<key>'<+mods>` `[ \| actionDesc]` (mods rendered as symbols)      |
| `url`                | `Open '<url>'` `[ \| actionDesc]` (or `<refDesc>` if from `urlRegistry`) |
| `shell`              | `Run '<command>'` `[ \| actionDesc]`                                     |
| `python`             | `Run python '<scriptPath>'` `[ \| actionDesc]`                           |
| `osascript`          | `Run osascript '<scriptPath>'` `[ \| actionDesc]`                        |
| `cut`/`copy`/`paste` | `Cut`/`Copy`/`Paste` selection                                           |
| `noop`               | `No operation`                                                           |
| `sequence`           | join sub-action descriptions with `then`                                 |

## 6. `Condition` changes

`app`/`var`/`device` accept the new specs (object refs) plus an optional `description` override:

```ts
type Condition =
  | { app: AppRef | AppRef[]; unless?: boolean; description?: string }
  | {
      var: VarSpec;
      equals: string | number;
      unless?: boolean;
      description?: string;
    }
  | { device: DeviceSpec; unless?: boolean; description?: string };
```

`resolveCondition` reads `.name`/`.product_id`/etc.; the synthesizer renders the label:

- **app:** `In <refDesc>` (if) / `Outside <refDesc>` (unless); multiple → `In <a>/<b>`.
- **var:** `<varDesc>` (if) / `not <varDesc>` (unless).
- **device:** `on <deviceDesc>` / `not on <deviceDesc>`.
- Multiple conditions in a group joined with `and`. No conditions → label `Always`.

## 7. `Trigger` + `order` description rules

The `[TRIGGER]` segment reuses `formatRuleDescription`'s key→symbol mapping (`[RETURN]`, `[←⌘]+[H]`, `[←⌘←⌥]+[M]`). `order` extends the rendering:

- `down`/`up` `insensitive` → join keys with `+` (e.g. `Press a + b` / `Release a + b`).
- `strict`/`strict_inverse` → join with `→` in key-down order (e.g. `Press a → b → c`).
- `upWhen: "any"` → append `(fire on first release)`; `"all"` → `(fire on last release)`.
- `detectUninterrupted: true` → append `detect uninterruptedly`.

(These render inside the trigger segment; the precise placement is finalized in the synthesizer tests.)

## 8. `Binding` / `Case` shape

- **`Binding.description`** becomes optional (the override; absent → auto-derived).
- **Mechanism fields stay on `Binding`** (hoisted), **not** moved onto `Case`: `timing`, `multiTap`, `afterKeyUp`, `eventOptions`. Rationale: these are binding-level (one var-dance shares one `multiTap.mods`; `afterKeyUp` is one channel). Moving them per-case is YAGNI and breaks the multi-tap model.
- **`Case` gains only `description?`** (a fragment incorporated into the derived description) and may keep an optional per-case `eventOptions`. The phase/tapCount/conditions/do fields are unchanged.

## 9. The description synthesizer + format

A new module (e.g. `engine/description-synthesizer.ts`) exports `synthesizeRuleDescription(binding): string` and `synthesizeManipulatorLabel(conditionGroup): string | undefined`. `defineBindings` calls them when `binding.description` is absent.

**Rule description format** (literal `\n` / `\t`, rendered as line breaks/tabs by Karabiner). For the enter-equals `return` binding (tap+hold, Excel vs not):

```
[RETURN]:
---
	On Tap:
		In Microsoft Excel:	Emit 'return'
		Outside Microsoft Excel:	Emit 'return'
	On Hold:
		In Microsoft Excel:	Run command 'Evaluate selection'
		Outside Microsoft Excel:	Run command 'Evaluate selection'
```

Produced from the string:

```
[RETURN]:\n---\n\tOn Tap:\n\t\tIn Microsoft Excel:\tEmit 'return'\n\t\tOutside Microsoft Excel:\tEmit 'return'\n\tOn Hold:\n\t\tIn Microsoft Excel:\tRun command 'Evaluate selection'\n\t\tOutside Microsoft Excel:\tRun command 'Evaluate selection'
```

Rules:

- Line 1: `[TRIGGER]:` then `\n---\n`.
- For each present phase, in fixed order — **On Tap** (`release`, tapCount 1), **On Hold** (`hold`, tapCount 1), **On Double Tap** (`release`, tapCount 2), **On Double Tap Hold** (`hold`, tapCount 2) — emit `\t<Phase>:` then one line per case.
- Phases with no cases are omitted.
- Per case: `\t\t<conditionLabel>:\t<actionLine>`. A case with multiple actions: one sub-line per action (`actionDesc`-joined), indented under the label (exact sub-indent finalized in tests).
- `conditionLabel` per §6.

**Manipulator label** (`manipulator.description`): the condition-group's label (e.g. `In Microsoft Excel`); omitted for the single unconditional group.

## 10. Registry migration inventory

| File                    | Current                                                          | Becomes                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/apps.ts`          | `appRegistry: Record<string, string>`                            | `Record<string, AppRef>` (each `{type:"app", name, refDesc}`); `folderOpener` name computed; `QUICK_FILL_APP_BUNDLE_IDENTIFIERS` → `AppRef[]` |
| `data/folders.ts`       | `Record<string, string>`                                         | `Record<string, FolderRef>`                                                                                                                   |
| `data/raycast.ts`       | `Record<string, string>`                                         | `Record<string, RaycastRef>`                                                                                                                  |
| `data/cleanshot.ts`     | `Record<string, string>`                                         | `Record<string, CleanShotRef>`                                                                                                                |
| `data/commands.ts`      | `Record<string, string>`                                         | `Record<string, CommandRef>`                                                                                                                  |
| `data/urls.ts`          | `{}` (empty)                                                     | `Record<string, UrlRef>` (structure ready)                                                                                                    |
| `data/accessibility.ts` | `ACCESSIBILITY_VARIABLES: Record<string,string>`                 | `Record<string, VarSpec>`; `ACCESSIBILITY_VALUES` unchanged                                                                                   |
| `data/devices.ts`       | `DEVICE_IDENTIFIERS: Record<string, {product_id,vendor_id,...}>` | `Record<string, DeviceSpec>` (add `deviceDesc`)                                                                                               |

Every consumer updates: `ref: "excel"` → `ref: appRegistry.excel`; `app: appRegistry.skim` (already object after migration) typed as `AppRef`; `var: ACCESSIBILITY_VARIABLES.x` → `var: accessibilityVars.x` (`VarSpec`); etc.

## 11. Phasing

**Phase 1 — Ref primitives (byte-identical).** Introduce `RefSpec`/`VarSpec`/`DeviceSpec`; migrate the registries above; `ActionSpec.ref`/`Condition.app`/`Condition.var`/`Condition.device` → object refs (+ new `command` variant); update `resolveActionToEvents`, `resolveCondition`, and every call site. **Descriptions unchanged** (`formatRuleDescription` still called where it is). Gate: `git diff karabiner-output.json` empty + `npm run typecheck && npm run lint && npm test` green.

**Phase 2 — Description synthesizer (description-only output change).** Build `synthesizeRuleDescription` / `synthesizeManipulatorLabel`; wire `defineBindings` to auto-derive when `binding.description` is absent; remove `formatRuleDescription` calls from definitions; set manipulator slice-labels. Gate: **description-agnostic structural diff empty** vs Phase 1 (events/triggers/conditions identical) + synthesizer unit tests + regenerate snapshot.

**Phase 3 — Tap-hold family migration (description-only).** Migrate `single-key`, `hyper`, `left-command`, `apps/antinote`, `right-option` (+ their launcher/multi-tap parts) to `Binding[]`. Descriptions auto-derive, so **no `formatRuleDescription` and no per-entry description** — which dissolves the earlier A-vs-B duplication debate. The A/B choice (compact `tapHold()` constructor vs plain literals) defers to here and is low-stakes. Barrel collision detection relocates to a `Binding[]`-level `assertUniqueTriggers`. Gate: description-agnostic structural diff empty + tests green. Then delete the now-dead `generateTapHoldRules` / `generateModifierLauncherRules` / `generateMultiTapRule` (the final tranche of task 11).

## 12. Gate: the description-agnostic structural diff

The workspace `karabiner-output.json` serializes karabiner.ts Rule-builder objects: each rule has `ruleDescription` + `manipulatorSources` (the manipulator builders, which carry `from`/`to*`/`conditions` and may carry `description`). So the rich breakdown is written to `ruleDescription`; slice-labels to `manipulatorSources[i].description` (via the builder's `.description()`).

Because descriptions may change freely but behavior must not, verify each phase with a diff that **strips description fields** before comparing:

```bash
# strip rule ruleDescription + manipulator-source description, then diff against baseline
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)'
```

For Phase 1 this diff is empty (byte-identical). For Phases 2–3 the stripped diff is empty while the real `karabiner-output.json` changes only in description fields. The synthesizer unit tests (binding fixture → exact description string) lock the format.

## 13. Out of scope

- **Mouse unification** (`mouse-rules.ts` / `core/mouse.ts`) — its own design sub-project (task 9); may change output beyond descriptions.
- **Specials stay specialized:** `guard` (cmd-q), `modifierChord` (caps-lock), `reset`/`escape-rule`. They adopt `RefSpec` where they reference registries (Phase 1) but keep their bespoke manipulator shapes.
- `simultaneous-rules` — keeps its conflict-validation logic; its `tapHoldKeys` param changes type (Record → trigger-key source from `Binding[]`) as part of Phase 3. The empty `simultaneous.ts` config can migrate to `Binding[]` then.

## 14. Open / deferred

- Exact multi-action-per-case line layout (§9) — finalized in synthesizer tests.
- A-vs-B tap-hold expression choice (§11 Phase 3) — deferred.
- Whether framework-internal `VarSpec.varDesc` is required or optional (§4.2).
- The `sequence`/`actHere` template wording (§5) — finalized in tests.
