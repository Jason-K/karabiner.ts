# Description Synthesizer (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a description synthesizer that auto-derives a rich, multi-line Karabiner rule description (and per-manipulator slice-labels) from a binding's own values; wire `defineBindings` to use it when `binding.description` is absent; remove every `formatRuleDescription` call from the `defineBindings`-based definitions. Non-description output (events, triggers, conditions, timing) stays behavior-identical.

**Architecture:** A new pure module `engine/description-synthesizer.ts` exports `synthesizeRuleDescription(binding)` (the rule-level multi-line description), `synthesizeManipulatorLabel(conditions)` (the short condition-group slice-label), and three helpers (`describeAction`, `describeConditionGroup`, `describeTrigger`). It reuses the existing key→symbol mapping already in `core/rule-descriptions.ts` (`keyTokenToLabel`, `modifierTokenToSymbols`) and the modifier-expansion in `engine/action-resolver.ts` (`expandModifiers`) — both exported in Task 1. `defineBindings` calls the synthesizer when a binding has no `description` override and stamps slice-labels onto each built manipulator. Phase 1 already populated every registry's `refDesc`/`varDesc`; the synthesizer is their first consumer.

**Tech Stack:** TypeScript, `karabiner.ts`, `node:test` (`tsx --test`), `tsx` to run `src/index.ts`, `jq` for the description-agnostic structural diff.

## Global Constraints

- **Description-agnostic structural gate (replaces byte-identity):** after each behavior-touching task, regenerate and diff with description fields stripped — events/triggers/conditions/timing must be identical to Phase 1:
  ```bash
  CI=true npx tsx src/index.ts
  jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase2-structural.json
  diff /tmp/phase1-structural.json /tmp/phase2-structural.json
  ```
  Expected: **empty**. (`/tmp/phase1-structural.json` is the Phase 1 baseline captured in Phase 1 Task 7; if `/tmp` was cleared, regenerate it from `git stash`/`main` — see Task 10 Step 0.) The *raw* `karabiner-output.json` **will** change — that is the point: only description fields change.
- **Never `npm run build` during iteration** — it writes the live Karabiner profile + reloads Hammerspoon. Regenerate the golden with `CI=true npx tsx src/index.ts`.
- **Tests gate:** `npm run typecheck && npm run lint && npm test` must stay green (Phase 1 baseline = 117 pass / 0 fail / 6 skipped).
- **Commits unsigned in this env:** `git -c commit.gpgsign=false commit …` (repo signs via 1Password non-interactively; user re-signs on the feature branch).
- **The description FORMAT is locked by synthesizer unit tests, not the snapshot** (spec §2). Tests 3–7 below pin the exact strings; that is the lock-point. Where the spec deferred exact wording (§7 trigger placement, §9 multi-action layout, §14 open items), the decisions below are concrete and pinned by the tests in this plan — treat them as the spec for Phase 2.

### Phase 2 format decisions (pinned by the synthesizer tests; per spec §14 delegation)

1. **Symbol mapping everywhere.** Trigger AND `key`-action labels use the existing `keyTokenToLabel`/`modifierTokenToSymbols` mapping (`return_or_enter` → `⏎`, `escape` → `␛`, `home` → `HOME`, `left_command` → `←⌘`). The spec's `[RETURN]`/`Emit 'return'` prose in §9 is illustrative; the real glyphs come from `KEY_SYMBOLS`. The trigger segment and key-action are therefore consistent.
2. **Phase bucketing** (spec §9 lists exactly four labels and omits `press`): `press` and `release` at `tapCount 1` both render under **On Tap** (a plain remap's press is a tap); `hold`@1 → **On Hold**; `press`/`release`@2 → **On Double Tap**; `hold`@2 → **On Double Tap Hold**. No live binding mixes `press`+`release` at the same tapCount.
3. **Multi-action case** (spec §5 `sequence` template wins over §9 sub-lines): a case's `do[]` is described by joining each action's line with ` then `.
4. **`key` action template:** `Emit '<keyLabel>'` + (modifiers present) `+<concatenated mod symbols>`. e.g. `Emit 'H'+←⌘`. Mods are `expandModifiers`-resolved then symbol-mapped (so `vmCOC_` renders as `←⌘←⌥←⌃`).
5. **Slice-label omitted when unconditional** (spec §9): `synthesizeManipulatorLabel` returns `undefined` for zero conditions (the single unconditional group), else the §6 label.

**Spec:** `docs/superpowers/specs/2026-07-22-auto-derived-descriptions-design.md` (§5 actions, §6 conditions, §7 trigger, §8 Binding/Case, §9 synthesizer+format, §12 structural-diff gate, §11 Phase 2 scope).

---

## File Structure

- **Modify `src/core/rule-descriptions.ts`** — export `keyTokenToLabel`, `modifierTokenToSymbols` (currently private) for synthesizer reuse. No behavior change.
- **Modify `src/engine/action-resolver.ts`** — export `expandModifiers` (currently private). No behavior change.
- **Modify `src/core/action-dsl.ts`** — add optional `actionDesc?: string` to `app`/`folder`/`raycast`/`url`/`shell`/`python`/`osascript`/`key` variants (spec §5b).
- **Modify `src/engine/binding.ts`** — `Case.description?`; `Binding.description` optional; `defineBindings` auto-derives; carry `rawConditions`; stamp slice-labels in every build path.
- **Create `src/engine/description-synthesizer.ts`** — `describeAction`, `describeConditionGroup`, `describeTrigger`, `synthesizeRuleDescription`, `synthesizeManipulatorLabel`.
- **Create `src/tests/description-synthesizer.test.ts`** — unit tests pinning the format (the lock-point).
- **Modify `src/tests/binding.test.ts`** — two integration tests proving `defineBindings` auto-derivation + slice-labels.
- **Modify `src/definitions/{home-end,system,shift,escape}.ts`, `src/definitions/apps/{skim,zen,word,onepiece}.ts`** — delete each `description: formatRuleDescription(...)` field + its now-unused import.
- **Modify `src/tests/{mappings,shift,integration}.test.ts`** — update assertions that pinned the old hand-written description format.

---

## Task 1: Export the shared symbol + modifier helpers

Expose the existing glyph/expansion helpers so the synthesizer can reuse them (single source of truth). Pure export additions; no logic change.

**Files:**
- Modify: `src/core/rule-descriptions.ts` (`keyTokenToLabel`, `modifierTokenToSymbols`)
- Modify: `src/engine/action-resolver.ts` (`expandModifiers`)

**Interfaces:**
- Produces: `export function keyTokenToLabel(token: string): string`; `export function modifierTokenToSymbols(token: string): string` (from `rule-descriptions.ts`); `export function expandModifiers(modifiers: string[]): string[]` (from `action-resolver.ts`).

- [ ] **Step 1: Export the two helpers in `src/core/rule-descriptions.ts`**

Change the two `function` declarations (currently around lines 49 and 73) to be exported:
```ts
export function modifierTokenToSymbols(token: string): string {
```
```ts
export function keyTokenToLabel(token: string): string {
```
(Leave their bodies and `isModifierToken`/`splitChordTokens` untouched — `isModifierToken` stays private; the synthesizer does not need it because `Trigger.modifiers` is already a separate field.)

- [ ] **Step 2: Export `expandModifiers` in `src/engine/action-resolver.ts`**

Change the declaration (currently around line 23) to:
```ts
export function expandModifiers(modifiers: string[]): string[] {
```

- [ ] **Step 3: Verify nothing regressed**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS (117/0/6) — exports are additive.
Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: **empty**.

- [ ] **Step 4: Commit**

```bash
git add src/core/rule-descriptions.ts src/engine/action-resolver.ts
git -c commit.gpgsign=false commit -m "refactor(engine): export symbol/modifier helpers for reuse"
```

---

## Task 2: Add `actionDesc?` to action variants + `Case.description?`

Type-only additions. `Binding.description` stays **required** here (it becomes optional only in Task 8, once the synthesizer exists — making it optional now would break `rule(b.description)` which needs a `string`). No behavior change: every binding still sets `description`.

**Files:**
- Modify: `src/core/action-dsl.ts` (eight variants)
- Modify: `src/engine/binding.ts` (`Case`)

**Interfaces:**
- Produces: optional `actionDesc?: string` on the `app`/`folder`/`raycast`/`url`/`shell`/`python`/`osascript`/`key` variants; `Case.description?: string`.

- [ ] **Step 1: Add `actionDesc?` to the eight variants in `src/core/action-dsl.ts`**

Add `actionDesc?: string;` to each of these variants (the `command` variant already has it — leave it):
- `app` → `{ type: "app"; ref: AppRef; mode?: ...; actionDesc?: string }`
- `folder` → add `actionDesc?: string`
- `raycast` → add `actionDesc?: string`
- `url` → add `actionDesc?: string`
- `shell` → add `actionDesc?: string`
- `python` → add `actionDesc?: string`
- `osascript` → add `actionDesc?: string`
- `key` → add `actionDesc?: string`

(Do **not** add it to `cleanShot`, `appHistory`, `actHere`, `caseChange`, `wrapString`, `cut`/`copy`/`paste`, `noop`, `sequence` — spec §5 table restricts `actionDesc` to the listed variants.)

- [ ] **Step 2: Add `description?` to `Case` in `src/engine/binding.ts`**

Change the `Case` type (currently lines 44–49):
```ts
export type Case = {
  tapCount?: number;
  phase?: Phase;
  conditions?: Condition[];
  do: ActionSpec[];
  description?: string; // optional fragment; when set, used as this case's action line verbatim
};
```

- [ ] **Step 3: Typecheck + gate**

Run: `npm run typecheck`
Expected: PASS (additive optional fields; no call site changes).
Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: **empty**.

- [ ] **Step 4: Commit**

```bash
git add src/core/action-dsl.ts src/engine/binding.ts
git -c commit.gpgsign=false commit -m "feat(types): add actionDesc? + Case.description? for synthesizer"
```

---

## Task 3: `describeAction` — every action template (spec §5)

The first synthesizer function. Created in a new module. TDD: one assertion per variant.

**Files:**
- Create: `src/engine/description-synthesizer.ts`
- Test: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Consumes: `ActionSpec` (from `../core/action-dsl`), `keyTokenToLabel`/`modifierTokenToSymbols` (Task 1), `expandModifiers` (Task 1).
- Produces: `describeAction(action: ActionSpec): string` — the single-line description for one action.

- [ ] **Step 1: Write the failing tests**

Create `src/tests/description-synthesizer.test.ts`:
```ts
import assert from "node:assert/strict";
import test from "node:test";

import type { ActionSpec } from "../core/action-dsl";
import { appRegistry } from "../data/apps";
import { folderRegistry } from "../data/folders";
import { raycastRegistry } from "../data/raycast";
import { cleanShotRegistry } from "../data/cleanshot";
import { commandRegistry } from "../data/commands";
import { describeAction } from "../engine/description-synthesizer";

const app = (refDesc: string) => ({ type: "app" as const, name: "x", refDesc });

test("describeAction: app variants by mode + actionDesc", () => {
  assert.equal(describeAction({ type: "app", ref: appRegistry.excel }), "open Microsoft Excel");
  assert.equal(describeAction({ type: "app", ref: appRegistry.excel, mode: "focus" }), "focus Microsoft Excel");
  assert.equal(describeAction({ type: "app", ref: appRegistry.excel, mode: "shell" }), "open-shell Microsoft Excel");
  assert.equal(describeAction({ type: "app", ref: appRegistry.excel, actionDesc: "force" }), "open Microsoft Excel | force");
});

test("describeAction: appHistory / folder / raycast / cleanShot / command", () => {
  assert.equal(describeAction({ type: "appHistory", index: 2 }), "Go back 2 apps");
  assert.equal(describeAction({ type: "folder", ref: folderRegistry.downloads }), "open 'Downloads'");
  assert.equal(describeAction({ type: "folder", ref: folderRegistry.downloads, actionDesc: "new tab" }), "open 'Downloads' | new tab");
  assert.equal(describeAction({ type: "raycast", ref: raycastRegistry.clipboardHistory }), "Call 'Clipboard history'");
  assert.equal(describeAction({ type: "cleanShot", ref: cleanShotRegistry.captureArea }), "Capture area using CSX");
  assert.equal(describeAction({ type: "command", ref: commandRegistry.fillPassword }), "Run command 'Fill password'");
});

test("describeAction: actHere / caseChange / wrapString", () => {
  assert.equal(describeAction({ type: "actHere", action: "formatCutSeed" }), "Context action: formatCutSeed");
  assert.equal(describeAction({ type: "caseChange", operation: "uppercase" }), "Change case to uppercase");
  assert.equal(describeAction({ type: "wrapString", operation: "wrap_quotes" }), "Wrap selection in wrap_quotes");
});

test("describeAction: key (with/without mods) + actionDesc", () => {
  assert.equal(describeAction({ type: "key", key: "f2" }), "Emit 'F2'");
  assert.equal(describeAction({ type: "key", key: "return_or_enter" }), "Emit '⏎'");
  assert.equal(describeAction({ type: "key", key: "h", modifiers: ["left_command"] }), "Emit 'H'+←⌘");
  assert.equal(describeAction({ type: "key", key: "h", modifiers: ["left_command", "left_option"] }), "Emit 'H'+←⌘←⌥");
  assert.equal(describeAction({ type: "key", key: "f2", actionDesc: "edit cell" }), "Emit 'F2' | edit cell");
});

test("describeAction: url / shell / python / osascript", () => {
  assert.equal(describeAction({ type: "url", url: "https://x.io" }), "Open 'https://x.io'");
  assert.equal(describeAction({ type: "shell", command: "open -u x" }), "Run 'open -u x'");
  assert.equal(describeAction({ type: "python", scriptPath: "/p/s.py" }), "Run python '/p/s.py'");
  assert.equal(describeAction({ type: "osascript", scriptPath: "/p/a.scpt" }), "Run osascript '/p/a.scpt'");
});

test("describeAction: cut / copy / paste / noop", () => {
  assert.equal(describeAction({ type: "cut" }), "Cut selection");
  assert.equal(describeAction({ type: "copy" }), "Copy selection");
  assert.equal(describeAction({ type: "paste" }), "Paste selection");
  assert.equal(describeAction({ type: "noop" }), "No operation");
});

test("describeAction: sequence joins sub-actions with ' then '", () => {
  const seq: ActionSpec = { type: "sequence", actions: [{ type: "cut" }, { type: "paste" }] };
  assert.equal(describeAction(seq), "Cut selection then Paste selection");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: FAIL — `Cannot find module '../engine/description-synthesizer'`.

- [ ] **Step 3: Implement `describeAction`**

Create `src/engine/description-synthesizer.ts`:
```ts
import type { ActionSpec } from "../core/action-dsl";
import { keyTokenToLabel, modifierTokenToSymbols } from "../core/rule-descriptions";
import { expandModifiers } from "./action-resolver";

/** Append ` | actionDesc` when the action carries a nuance label. */
function withActionDesc(base: string, actionDesc?: string): string {
  return actionDesc ? `${base} | ${actionDesc}` : base;
}

function describeKeyAction(action: Extract<ActionSpec, { type: "key" }>): string {
  const keyLabel = keyTokenToLabel(action.key);
  const mods = action.modifiers?.length
    ? expandModifiers(action.modifiers as string[]).map(modifierTokenToSymbols).join("")
    : "";
  return mods ? `Emit '${keyLabel}'+${mods}` : `Emit '${keyLabel}'`;
}

/** Single-line human description for one action (spec §5 templates). */
export function describeAction(action: ActionSpec): string {
  switch (action.type) {
    case "app": {
      const verb =
        action.mode === "focus" ? "focus" : action.mode === "shell" ? "open-shell" : "open";
      return withActionDesc(`${verb} ${action.ref.refDesc}`, action.actionDesc);
    }
    case "appHistory":
      return `Go back ${action.index} apps`;
    case "folder":
      return withActionDesc(`open '${action.ref.refDesc}'`, action.actionDesc);
    case "raycast":
      return withActionDesc(`Call '${action.ref.refDesc}'`, action.actionDesc);
    case "cleanShot":
      return `${action.ref.refDesc} using CSX`;
    case "command":
      return withActionDesc(`Run command '${action.ref.refDesc}'`, action.actionDesc);
    case "actHere":
      return `Context action: ${action.action}`;
    case "caseChange":
      return `Change case to ${action.operation}`;
    case "wrapString":
      return `Wrap selection in ${action.operation}`;
    case "key":
      return withActionDesc(describeKeyAction(action), action.actionDesc);
    case "url":
      return withActionDesc(`Open '${action.url}'`, action.actionDesc);
    case "shell":
      return withActionDesc(`Run '${action.command}'`, action.actionDesc);
    case "python":
      return withActionDesc(`Run python '${action.scriptPath}'`, action.actionDesc);
    case "osascript":
      return withActionDesc(`Run osascript '${action.scriptPath}'`, action.actionDesc);
    case "cut":
      return "Cut selection";
    case "copy":
      return "Copy selection";
    case "paste":
      return "Paste selection";
    case "noop":
      return "No operation";
    case "sequence":
      return action.actions.map(describeAction).join(" then ");
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: PASS (all seven tests).

- [ ] **Step 5: Full gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: typecheck/lint PASS, diff empty (synthesizer not wired yet).
```bash
git add src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add describeAction synthesizer (§5 templates)"
```

---

## Task 4: `describeConditionGroup` — condition labels (spec §6)

Extend the synthesizer. TDD.

**Files:**
- Modify: `src/engine/description-synthesizer.ts`
- Modify: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Consumes: `Condition` (from `./binding`).
- Produces: `describeConditionGroup(conditions: Condition[] | undefined): string` — `"Always"` when empty, else the joined §6 label.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/description-synthesizer.test.ts`:
```ts
import { describeConditionGroup } from "../engine/description-synthesizer";

const excel = { type: "app" as const, name: "com.microsoft.Excel", refDesc: "Microsoft Excel" };
const role = { name: "accessibility.focused_ui_element.role_string", varDesc: "Focused UI role" };

test("describeConditionGroup: empty -> Always", () => {
  assert.equal(describeConditionGroup(undefined), "Always");
  assert.equal(describeConditionGroup([]), "Always");
});

test("describeConditionGroup: app if/unless + multi-app", () => {
  assert.equal(describeConditionGroup([{ app: excel }]), "In Microsoft Excel");
  assert.equal(describeConditionGroup([{ app: excel, unless: true }]), "Outside Microsoft Excel");
  assert.equal(
    describeConditionGroup([{ app: [excel, { type: "app", name: "b", refDesc: "B" }] }]),
    "In Microsoft Excel/B",
  );
});

test("describeConditionGroup: var if/unless", () => {
  assert.equal(describeConditionGroup([{ var: role, equals: "AXTextField" }]), "Focused UI role");
  assert.equal(describeConditionGroup([{ var: role, equals: "AXTextField", unless: true }]), "not Focused UI role");
});

test("describeConditionGroup: multiple joined with ' and '", () => {
  assert.equal(
    describeConditionGroup([{ app: excel }, { var: role, equals: "AXTextField" }]),
    "In Microsoft Excel and Focused UI role",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: FAIL — `describeConditionGroup` is not exported.

- [ ] **Step 3: Implement `describeConditionGroup`**

Add the `Condition` type import at the top of `src/engine/description-synthesizer.ts` (alongside the existing imports):
```ts
import type { Condition } from "./binding";
```
Append the function:
```ts
type AppCondition = Extract<Condition, { app: unknown }>;
type VarCondition = Extract<Condition, { var: unknown }>;

function describeAppCondition(app: AppCondition["app"], unless?: boolean): string {
  const refs = Array.isArray(app) ? app : [app];
  const names = refs.map((r) => r.refDesc).join("/");
  return unless ? `Outside ${names}` : `In ${names}`;
}

/** Human label for one condition group (spec §6). Empty group -> "Always". */
export function describeConditionGroup(conditions: Condition[] | undefined): string {
  if (!conditions?.length) return "Always";
  const parts = conditions.map((c) => {
    if ("app" in c) return describeAppCondition(c.app, c.unless);
    if ("var" in c) {
      const v: VarCondition = c;
      return v.unless ? `not ${v.var.varDesc}` : v.var.varDesc;
    }
    // device is reserved for the mouse round (Condition throws in resolveCondition).
    return "device";
  });
  return parts.join(" and ");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: PASS (all tests incl. the four new ones).

- [ ] **Step 5: Full gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: PASS, diff empty.
```bash
git add src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add describeConditionGroup synthesizer (§6)"
```

---

## Task 5: `describeTrigger` — the `[TRIGGER]:` segment (spec §7)

Extend the synthesizer. TDD.

**Files:**
- Modify: `src/engine/description-synthesizer.ts`
- Modify: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Consumes: `Trigger` (from `./binding`), `keyTokenToLabel`/`modifierTokenToSymbols`.
- Produces: `describeTrigger(trigger: Trigger): string` — the trigger segment ending in `:`.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/description-synthesizer.test.ts`:
```ts
import { describeTrigger } from "../engine/description-synthesizer";

test("describeTrigger: single key + modifier chords", () => {
  assert.equal(describeTrigger({ keys: ["return_or_enter"] }), "[⏎]:");
  assert.equal(describeTrigger({ keys: ["escape"] }), "[␛]:");
  assert.equal(describeTrigger({ keys: ["home"] }), "[HOME]:");
  assert.equal(describeTrigger({ keys: ["h"], modifiers: ["left_command"] }), "[←⌘]+[H]:");
  assert.equal(
    describeTrigger({ keys: ["m"], modifiers: ["left_command", "left_option"] }),
    "[←⌘←⌥]+[M]:",
  );
});

test("describeTrigger: simultaneous chord joins keys with ']+['", () => {
  assert.equal(describeTrigger({ keys: ["j", "k"] }), "[J]+[K]:");
});

test("describeTrigger: pointer", () => {
  assert.equal(describeTrigger({ pointer: "button1" }), "Click:");
  assert.equal(describeTrigger({ pointer: "button1", modifiers: ["left_command"] }), "[←⌘]+Click:");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: FAIL — `describeTrigger` not exported.

- [ ] **Step 3: Implement `describeTrigger`**

Add `Trigger` to the type import from `./binding`:
```ts
import type { Condition, Trigger } from "./binding";
```
Append:
```ts
/**
 * The `[TRIGGER]:` segment (spec §7). Reuses the key→symbol mapping from
 * rule-descriptions. Pointer triggers render as `Click:` (button1) / `Pointer <x>:`.
 * `SimOrder`-augmented rendering (strict key-down sequences, upWhen notes) is
 * intentionally minimal here: no Phase 2 binding uses a simultaneous trigger, so
 * the basic `]+[` join is complete for this phase; Phase 3 (simultaneous
 * migration) extends it.
 */
export function describeTrigger(trigger: Trigger): string {
  const modSymbols = (mods?: string[]) => (mods?.length ? mods.map(modifierTokenToSymbols).join("") : "");
  if ("pointer" in trigger) {
    const symbols = modSymbols(trigger.modifiers);
    const pointerLabel = trigger.pointer === "button1" ? "Click" : `Pointer ${trigger.pointer}`;
    return symbols ? `[${symbols}]+${pointerLabel}:` : `${pointerLabel}:`;
  }
  const segments: string[] = [];
  const symbols = modSymbols(trigger.modifiers);
  if (symbols) segments.push(`[${symbols}]`);
  for (const k of trigger.keys) segments.push(`[${keyTokenToLabel(k)}]`);
  return `${segments.join("+")}:`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: PASS (all tests incl. the three new ones).

- [ ] **Step 5: Full gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: PASS, diff empty.
```bash
git add src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add describeTrigger synthesizer (§7)"
```

---

## Task 6: `synthesizeRuleDescription` — the multi-line rule description (spec §9)

Compose trigger + phase buckets + cases. TDD with the canonical conditional tap-hold example.

**Files:**
- Modify: `src/engine/description-synthesizer.ts`
- Modify: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Consumes: `Binding` (from `./binding`), `describeTrigger`, `describeConditionGroup`, `describeAction`.
- Produces: `synthesizeRuleDescription(binding: Binding): string`.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/description-synthesizer.test.ts`:
```ts
import { synthesizeRuleDescription } from "../engine/description-synthesizer";
import type { Binding } from "../engine/binding";

const excel = { type: "app" as const, name: "com.microsoft.Excel", refDesc: "Microsoft Excel" };
const evaluateCmd = { type: "command" as const, name: "x", refDesc: "Evaluate selection" };

test("synthesizeRuleDescription: simple unconditional remap", () => {
  const binding: Binding = {
    trigger: { keys: ["home"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }] }],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[HOME]:\n---\n\tOn Tap:\n\t\tAlways:\tEmit '←'+←⌘",
  );
});

test("synthesizeRuleDescription: conditional tap+hold (spec §9 canonical)", () => {
  const binding: Binding = {
    trigger: { keys: ["return_or_enter"] },
    cases: [
      { phase: "release", conditions: [{ app: excel }], do: [{ type: "key", key: "f2" }] },
      { phase: "release", conditions: [{ app: excel, unless: true }], do: [{ type: "key", key: "return_or_enter" }] },
      { phase: "hold", conditions: [{ app: excel }], do: [{ type: "key", key: "f2" }] },
      { phase: "hold", conditions: [{ app: excel, unless: true }], do: [{ type: "command", ref: evaluateCmd }] },
    ],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[⏎]:\n---\n\tOn Tap:\n\t\tIn Microsoft Excel:\tEmit 'F2'\n\t\tOutside Microsoft Excel:\tEmit '⏎'\n\tOn Hold:\n\t\tIn Microsoft Excel:\tEmit 'F2'\n\t\tOutside Microsoft Excel:\tRun command 'Evaluate selection'",
  );
});

test("synthesizeRuleDescription: multi-action case joined with ' then '", () => {
  const binding: Binding = {
    trigger: { keys: ["slash"], modifiers: ["left_command"] },
    cases: [
      {
        phase: "press",
        conditions: [{ app: { type: "app", name: "w", refDesc: "Word" } }],
        do: [{ type: "osascript", scriptPath: "/a.scpt" }, { type: "shell", command: "elevate" }],
      },
    ],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[←⌘]+[/]:\n---\n\tOn Tap:\n\t\tIn Word:\tRun osascript '/a.scpt' then Run 'elevate'",
  );
});

test("synthesizeRuleDescription: Case.description overrides the action line", () => {
  const binding: Binding = {
    trigger: { keys: ["x"] },
    cases: [{ phase: "press", do: [{ type: "noop" }], description: "Custom fragment" }],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[X]:\n---\n\tOn Tap:\n\t\tAlways:\tCustom fragment",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: FAIL — `synthesizeRuleDescription` not exported.

- [ ] **Step 3: Implement `synthesizeRuleDescription`**

Extend the type import to include `Binding` and `Phase`:
```ts
import type { Binding, Condition, Phase, Trigger } from "./binding";
```
Append:
```ts
type PhaseBucket = { label: string; indices: number[] };

const PHASE_BUCKETS: PhaseBucket[] = [
  { label: "On Tap", indices: [] },
  { label: "On Hold", indices: [] },
  { label: "On Double Tap", indices: [] },
  { label: "On Double Tap Hold", indices: [] },
];

function bucketFor(tapCount: number, phase: Phase): number {
  if (tapCount === 1 && (phase === "press" || phase === "release")) return 0;
  if (tapCount === 1 && phase === "hold") return 1;
  if (tapCount === 2 && (phase === "press" || phase === "release")) return 2;
  return 3; // tapCount >= 2, hold
}

/**
 * Rich multi-line rule description (spec §9). Layout:
 *   [TRIGGER]:\n---\n\t<Phase>:\n\t\t<conditionLabel>:\t<actionLine>
 * Phases emitted in fixed order; empty phases omitted. Per-case conditionLabel
 * combines hoisted binding.conditions + the case's own conditions.
 */
export function synthesizeRuleDescription(binding: Binding): string {
  const buckets = PHASE_BUCKETS.map((b) => ({ label: b.label, cases: [] as number[] }));
  binding.cases.forEach((c, i) => {
    buckets[bucketFor(c.tapCount ?? 1, c.phase ?? "press")].cases.push(i);
  });

  const sections: string[] = [];
  for (const b of buckets) {
    if (!b.cases.length) continue;
    const lines = b.cases.map((i) => {
      const c = binding.cases[i]!;
      const condLabel = describeConditionGroup([
        ...(binding.conditions ?? []),
        ...(c.conditions ?? []),
      ]);
      const actionLine = c.description ?? c.do.map(describeAction).join(" then ");
      return `\t\t${condLabel}:\t${actionLine}`;
    });
    sections.push(`\t${b.label}:\n${lines.join("\n")}`);
  }
  return `${describeTrigger(binding.trigger)}\n---\n${sections.join("\n")}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: PASS (all tests incl. the four new ones).

- [ ] **Step 5: Full gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: PASS, diff empty.
```bash
git add src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add synthesizeRuleDescription (§9 multi-line format)"
```

---

## Task 7: `synthesizeManipulatorLabel` — the slice-label (spec §9)

The short condition-group label stamped on each manipulator. TDD.

**Files:**
- Modify: `src/engine/description-synthesizer.ts`
- Modify: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Consumes: `Condition`, `describeConditionGroup`.
- Produces: `synthesizeManipulatorLabel(conditions: Condition[] | undefined): string | undefined` — `undefined` when unconditional (slice-label omitted), else the §6 label.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/description-synthesizer.test.ts`:
```ts
import { synthesizeManipulatorLabel } from "../engine/description-synthesizer";

test("synthesizeManipulatorLabel: undefined when unconditional", () => {
  assert.equal(synthesizeManipulatorLabel(undefined), undefined);
  assert.equal(synthesizeManipulatorLabel([]), undefined);
});

test("synthesizeManipulatorLabel: condition-group label when conditional", () => {
  assert.equal(
    synthesizeManipulatorLabel([{ app: { type: "app", name: "x", refDesc: "Excel" } }]),
    "In Excel",
  );
  assert.equal(
    synthesizeManipulatorLabel([{ app: { type: "app", name: "x", refDesc: "Excel" }, unless: true }]),
    "Outside Excel",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: FAIL — `synthesizeManipulatorLabel` not exported.

- [ ] **Step 3: Implement `synthesizeManipulatorLabel`**

Append to `src/engine/description-synthesizer.ts`:
```ts
/**
 * Per-manipulator slice-label (spec §9): the condition-group's short label.
 * Returns undefined for the single unconditional group so the manipulator's
 * `description` field is omitted entirely.
 */
export function synthesizeManipulatorLabel(
  conditions: Condition[] | undefined,
): string | undefined {
  if (!conditions?.length) return undefined;
  return describeConditionGroup(conditions);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/description-synthesizer.test.ts`
Expected: PASS (all synthesizer tests green).

- [ ] **Step 5: Full gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: PASS, diff empty (synthesizer still unwired).
```bash
git add src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add synthesizeManipulatorLabel slice-label (§9)"
```

---

## Task 8: Wire `defineBindings` — auto-derive + raw conditions + slice-labels

Make `Binding.description` optional; call the synthesizer when absent; carry the original `Condition[]` (for slice-labels) alongside resolved conditions; stamp a slice-label on every built manipulator. At the end of this task the 8 definitions STILL carry their `description` overrides (Task 9 removes them), so output is unchanged and the structural diff stays empty.

**Files:**
- Modify: `src/engine/binding.ts`
- Modify: `src/tests/binding.test.ts` (two new integration tests)

**Interfaces:**
- Consumes: `synthesizeRuleDescription`, `synthesizeManipulatorLabel`.
- Produces: `Binding.description?: string`; `defineBindings` auto-derives; every manipulator may carry a `description` slice-label.

- [ ] **Step 1: Make `Binding.description` optional**

In `src/engine/binding.ts`, change the `Binding` type (currently line 53):
```ts
export type Binding = {
  description?: string; // absent -> auto-derived by the synthesizer (Phase 2)
  trigger: Trigger;
  ...
```

- [ ] **Step 2: Carry `rawConditions` through resolution**

Update `ResolvedCase` (currently lines 130–135) and `CaseGroup` (146–156), and the two functions that build them:
```ts
type ResolvedCase = {
  tapCount: number;
  phase: Phase;
  conditions: unknown[];
  rawConditions: Condition[]; // original Condition[] — for slice-labels (Phase 2)
  do: ToEvent[];
};

function resolveCases(cases: Case[], shared: Condition[] | undefined): ResolvedCase[] {
  return cases.map((c) => {
    const rawConditions = [...(shared ?? []), ...(c.conditions ?? [])];
    return {
      tapCount: c.tapCount ?? 1,
      phase: c.phase ?? "press",
      conditions: rawConditions.map(resolveCondition),
      rawConditions,
      do: (c.do ?? []).flatMap(resolveActionToEvents),
    };
  });
}

type CaseGroup = {
  conditions: unknown[];
  rawConditions: Condition[];
  pressDo: ToEvent[];
  releaseDo: ToEvent[];
  holdDo: ToEvent[];
  hasRelease: boolean;
  hasHold: boolean;
};
```
In `groupByConditions`, set `rawConditions: c.rawConditions` on each new group (add it next to `conditions: c.conditions`).

- [ ] **Step 3: Auto-derive in `defineBindings`**

Replace `defineBindings` (currently lines 187–189) and add the synthesizer import at the top of the file:
```ts
import { synthesizeManipulatorLabel, synthesizeRuleDescription } from "./description-synthesizer";
```
```ts
export function defineBindings(bindings: Binding[]): Rule[] {
  return bindings.map((b) =>
    rule(b.description ?? synthesizeRuleDescription(b))
      .manipulators(buildManipulators(b)) as unknown as Rule,
  );
}
```

- [ ] **Step 4: Stamp slice-labels in every build path**

Add a helper near `attachConditions`:
```ts
/** Unique union of raw conditions across cases (for multiTap/simultaneous slice-labels). */
function unionRawConditions(cases: ResolvedCase[]): Condition[] {
  const seen = new Set<string>();
  const out: Condition[] = [];
  for (const c of cases) {
    for (const cond of c.rawConditions) {
      const key = JSON.stringify(cond);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cond);
      }
    }
  }
  return out;
}

/** Stamp the condition-group slice-label onto every manipulator (no-op when unconditional). */
function stampLabel(manipulators: Manipulator[], conditions: Condition[] | undefined): void {
  const label = synthesizeManipulatorLabel(conditions);
  if (!label) return;
  manipulators.forEach((m: any) => {
    m.description = label;
  });
}
```

Now thread it through each path:

(a) `buildRemap` — change the signature to accept `rawConditions` and stamp the label. Replace the whole function:
```ts
function buildRemap(
  b: Binding,
  g: { conditions: unknown[]; rawConditions: Condition[]; pressDo: ToEvent[] },
  isPointer: boolean,
): Manipulator | Manipulator[] {
  const label = synthesizeManipulatorLabel(g.rawConditions);
  if (isPointer) {
    // Pointer manipulators are emitted as raw objects to match the legacy
    // pointer-remap-rules shape exactly: {type, from, to, description?, conditions?}.
    const pointer = b.trigger as { pointer: string; modifiers?: string[] };
    const from: Record<string, unknown> = { pointing_button: pointer.pointer };
    if (pointer.modifiers?.length) {
      from.modifiers = { mandatory: pointer.modifiers };
    }
    const m: Record<string, unknown> = { type: "basic", from, to: g.pressDo };
    if (label) m.description = label;
    if (g.conditions.length) m.conditions = g.conditions;
    return m as unknown as Manipulator;
  }
  const builder = map(triggerToFrom(b.trigger));
  if (label) builder.description(label);
  for (const cond of g.conditions) builder.condition(cond as any);
  for (const e of g.pressDo) builder.to(e);
  return builder.build();
}
```
(The pointer path previously hardcoded `description: b.description`; it now uses the slice-label, which is description-only and passes the structural gate. `buildManipulators` already calls `buildRemap(b, g, isPointer)` — `g` is a `CaseGroup` which now has `rawConditions`, so no call-site change is needed.)

(b) `buildTapHold` — stamp the label on all manipulators before returning. Add just before the final `return manipulators;`:
```ts
  stampLabel(manipulators, g.rawConditions);
  return manipulators;
```

(c) `buildMultiTap` — in BOTH the `isSim` branch and the single-key branch, call `stampLabel` after `attachConditions(manipulators, cases);` and before each `return manipulators;`:
```ts
  attachConditions(manipulators, cases);
  stampLabel(manipulators, unionRawConditions(cases));
  return manipulators;
```
(Add the `stampLabel(...)` line in both places.)

(d) `buildSimultaneousTapHold` — same pattern, after `attachConditions`:
```ts
  attachConditions(manipulators, cases);
  stampLabel(manipulators, unionRawConditions(cases));
  return manipulators;
```

- [ ] **Step 5: Add integration tests to `src/tests/binding.test.ts`**

Append:
```ts
test("defineBindings auto-derives rule description + slice-label when description absent", () => {
  const rules = defineBindings([
    {
      trigger: { keys: ["x"] },
      conditions: [{ app: { type: "app", name: "com.a", refDesc: "A" } }],
      cases: [{ phase: "press", do: [{ type: "key", key: "y" }] }],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.ruleDescription, "[X]:\n---\n\tOn Tap:\n\t\tIn A:\tEmit 'Y'");
  assert.equal(built.manipulatorSources[0].description, "In A");
});

test("defineBindings auto-derived description omits slice-label when unconditional", () => {
  const rules = defineBindings([
    { trigger: { keys: ["x"] }, cases: [{ phase: "press", do: [{ type: "key", key: "y" }] }] },
  ]);
  const built = rules[0] as any;
  assert.equal(built.ruleDescription, "[X]:\n---\n\tOn Tap:\n\t\tAlways:\tEmit 'Y'");
  assert.equal("description" in built.manipulatorSources[0], false);
});
```

- [ ] **Step 6: Verify wiring + structural gate (overrides still present, so output unchanged)**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS — the two new tests pass; existing tests pass (they set `description` explicitly, so the override path is untouched; slice-labels are description-only).
Run: `CI=true npx tsx src/index.ts`
Then the description-agnostic gate:
```bash
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase2-structural.json
diff /tmp/phase1-structural.json /tmp/phase2-structural.json
```
Expected: **empty** (the 8 definitions still carry their `description` overrides; the only manipulator-description change is the pointer slice-label, which is stripped by the gate).

> If `diff` is non-empty, inspect with `diff /tmp/phase1-structural.json /tmp/phase2-structural.json` — any non-description difference is a bug in the wiring (a build path touched a non-description field). Fix before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): wire defineBindings to auto-derive descriptions + slice-labels"
```

---

## Task 9: Remove `formatRuleDescription` from the 8 definitions + update affected tests

Delete each `description: formatRuleDescription(...)` field (and the now-unused import) so descriptions auto-derive. Then update the three test files that pinned the old hand-written strings. The structural diff stays empty (description-only change).

**Files:**
- Modify: `src/definitions/home-end.ts`, `src/definitions/system.ts`, `src/definitions/shift.ts`, `src/definitions/escape.ts`, `src/definitions/apps/skim.ts`, `src/definitions/apps/zen.ts`, `src/definitions/apps/word.ts`, `src/definitions/apps/onepiece.ts`
- Modify: `src/tests/mappings.test.ts`, `src/tests/shift.test.ts`, `src/tests/integration.test.ts`

- [ ] **Step 1: `src/definitions/home-end.ts` — remove 4 description fields + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the `description: formatRuleDescription(["home"], "Move to line start", "tap"),` line and the three sibling `description:` fields (the `["left_shift","home"]`, `["end"]`, `["left_shift","end"]` ones). Each binding keeps only `trigger` + `cases`.

- [ ] **Step 2: `src/definitions/system.ts` — remove 4 description fields + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the three `description:` fields in `disabledShortcutBindings` and the one in `passwordsQuickFillBinding`.

- [ ] **Step 3: `src/definitions/shift.ts` — remove description + import**

Delete line 2 (`import { formatRuleDescription } ...`). In `shiftClipboardBinding`, delete the `description: formatRuleDescription(key, "Raycast clipboard history", "multi-tap"),` field. (The `formatRuleDescription` import was the only use of rule-descriptions here; verify no other reference remains.)

- [ ] **Step 4: `src/definitions/escape.ts` — remove 2 description fields + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the `description:` field in `escapeTapTapHoldBinding` and in `ctrlEscapeMonitorBinding`.

- [ ] **Step 5: `src/definitions/apps/skim.ts` — remove 2 description fields + import**

Delete line 2 (`import { formatRuleDescription } ...`). Delete the `description: formatRuleDescription(["left_command","h"], ...)` and `["left_command","u"]` fields. (Verify `MOD_COMBO` import is still used — it is, by the cases.)

- [ ] **Step 6: `src/definitions/apps/zen.ts` — remove 2 description fields + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the two `description:` fields (right_arrow + left_arrow bindings).

- [ ] **Step 7: `src/definitions/apps/word.ts` — remove description + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the `description:` field in `wordPrivilegesBinding`.

- [ ] **Step 8: `src/definitions/apps/onepiece.ts` — remove description + import**

Delete line 1 (`import { formatRuleDescription } ...`). Delete the `description:` field in `onePieceClickEnterBinding`.

- [ ] **Step 9: Verify NO remaining live `formatRuleDescription` call in `src/definitions`**

Run: `rg -n "formatRuleDescription" src/definitions`
Expected: **no matches**. (The `formatRuleDescription` definition in `src/core/rule-descriptions.ts` and its callers in `src/engine/*-rules.ts`, `src/core/leader/build.ts`, and `src/tests/rule-descriptions.test.ts` remain — those are Phase 3 / specials / the unit test for the still-used helper.)

- [ ] **Step 10: Update `src/tests/mappings.test.ts` — drop the old description assertions**

Three tests deepEqual the binding objects including a `description` key that no longer exists.

In `"home-end navigation mappings stay declarative"` (lines 66–94): remove the `description: "..."` line from each expected object. `homeEndBindings[0]` becomes:
```ts
  assert.deepEqual(homeEndBindings[0], {
    trigger: { keys: ["home"] },
    cases: [
      { phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }] },
    ],
  });
```
and `homeEndBindings[1]` similarly drops its `description:` line.

In `"disabled shortcut mappings stay declarative"` (lines 96–108): remove the `description:` line from both expected objects:
```ts
  assert.deepEqual(disabledShortcutBindings[0], {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
  assert.deepEqual(disabledShortcutBindings[2], {
    trigger: { keys: ["m"], modifiers: ["left_command", "left_option"] }],
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
```

In `"passwords quick fill mapping stays declarative"` (lines 170–182): the description is now auto-derived (absent). Replace the `assert.equal(passwordsQuickFillBinding.description, "...")` block (lines 175–178) with an assertion that the description is absent and the binding still resolves to a synthesized rule:
```ts
  assert.equal(passwordsQuickFillBinding.description, undefined);
```
Keep the `trigger.keys`/`trigger.modifiers`/`cases.length` assertions that follow.

- [ ] **Step 11: Update `src/tests/shift.test.ts` — the two label tests**

The built rule description is now synthesized from the double-tap shell action. Replace the bodies of `"left shift rule is labelled..."` (lines 65–70) and `"right shift rule is labelled..."` (lines 72–77) so they match the synthesized content (the clipboard-history command appears in the description) rather than the old format:
```ts
test("left shift rule description includes the Raycast clipboard-history action", () => {
  assert.match(builtRules()[0].description, /On Double Tap:/);
  assert.match(builtRules()[0].description, /clipboard-history/);
});

test("right shift rule description includes the Raycast clipboard-history action", () => {
  assert.match(builtRules()[1].description, /On Double Tap:/);
  assert.match(builtRules()[1].description, /clipboard-history/);
});
```
(The `DESCRIPTION_SEPARATOR` import on line 4 is now unused — remove it.)

- [ ] **Step 12: Update `src/tests/integration.test.ts` — accept the synthesized format**

In `"generated output uses standardized rule descriptions"` (lines 50–68), add a third accepted pattern for the Phase 2 auto-derived format. Replace the regex block and the `rules.forEach` assertion:
```ts
test("generated output uses standardized rule descriptions", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;

  // Legacy format — still used by engine-adapter rules (tap-hold family, caps,
  // cmd-q, enter/equals) until Phase 3 migrates them.
  const standardDescription =
    /^\[[^\]]+\](\+\[[^\]]+\])* {8}→ {4}.+ \(on (tap|hold|multi-tap)\)$/;
  // Phase 2 auto-derived format: trigger segment, then ":" + "---" divider.
  const synthesizedDescription = /^\[[^\]]+\](\+\[[^\]]+\])*:\n---/;
  // Mouse device descriptions are inherently varied (single tap, tap/hold,
  // double-tap chords, app-conditional variants, etc.).
  const mouseDeviceDescription = /^[^:]+: .+$/;

  rules.forEach((rule: any) => {
    assert.ok(
      standardDescription.test(rule.ruleDescription) ||
        synthesizedDescription.test(rule.ruleDescription) ||
        mouseDeviceDescription.test(rule.ruleDescription),
      `Rule description is not standardized: ${rule.ruleDescription}`,
    );
  });
});
```
(The other integration tests are unchanged: `endsWith("(on hold)")`, `startsWith("[⇪]")`, `startsWith("[␛]")`, and `startsWith("[←⌘]+[Q]")` still hold — the tap-hold/caps/cmd-q rules keep the legacy format, and the escape rule's synthesized `[␛]:\n---` still starts with `[␛]`.)

- [ ] **Step 13: Regenerate + full gate**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts`
Then the description-agnostic gate:
```bash
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase2-structural.json
diff /tmp/phase1-structural.json /tmp/phase2-structural.json
```
Expected: **empty** — descriptions changed (raw `git diff karabiner-output.json` is non-empty and description-only), events/triggers/conditions unchanged.
Run: `npm test`
Expected: PASS (the synthesizer unit tests are the format lock; mappings/shift/integration now pass with their updated assertions).

> If `npm test` reports a failure in a test that still asserts an old description string, update that assertion the same way (drop the `description` field from a deepEqual, or match synthesized content). Do not relax a test that guards behavior.

- [ ] **Step 14: Commit**

```bash
git add src/definitions src/tests/mappings.test.ts src/tests/shift.test.ts src/tests/integration.test.ts
git -c commit.gpgsign=false commit -m "refactor(definitions): auto-derive descriptions; drop formatRuleDescription calls"
```

---

## Task 10: Regenerate snapshot + final gate + progress ledger

Confirm the whole phase: description-agnostic structural diff empty vs Phase 1, full check green, snapshot regenerated, ledger updated.

**Files:**
- Modify: `karabiner-output.json` (regenerated), `.superpowers/sdd/progress.md`

- [ ] **Step 0: Ensure the Phase 1 baseline exists**

Run: `ls -la /tmp/phase1-structural.json`
If missing (e.g. `/tmp` cleared), regenerate it from the Phase 1 tip before comparing:
```bash
git stash   # Phase 2 working changes, if any uncommitted
git checkout 69b647e -- karabiner-output.json   # Phase 1 tip (last Phase 1 commit)
CI=true npx tsx src/index.ts
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase1-structural.json
git checkout HEAD -- karabiner-output.json      # restore Phase 2 working tree
git stash pop  # if you stashed
```
(If already on the Phase 2 tip with everything committed, `git stash`/`pop` are unnecessary — just `git worktree` or a temporary checkout of `69b647e` to regenerate the baseline. The baseline is a `/tmp` artifact, not committed.)

- [ ] **Step 1: Regenerate the snapshot from a clean tree**

Run: `git status --short` — confirm only intended files are modified.
Run: `CI=true npx tsx src/index.ts`
Expected: writes `karabiner-output.json` with the new auto-derived descriptions.

- [ ] **Step 2: Description-agnostic structural diff (THE gate)**

```bash
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase2-structural.json
diff /tmp/phase1-structural.json /tmp/phase2-structural.json && echo "STRUCTURAL DIFF EMPTY"
```
Expected: `STRUCTURAL DIFF EMPTY`. This proves events/triggers/conditions/timing are behavior-identical to Phase 1.

- [ ] **Step 3: Confirm the raw diff IS description-only**

```bash
git diff --stat karabiner-output.json   # non-empty — descriptions changed
git diff karabiner-output.json | rg -v 'ruleDescription|^\+ *"?description"?:|^- *"?description"?:|^\+\+\+|^---|^@@|^diff ' | head
```
Expected: the filtered diff shows only `ruleDescription` and manipulator `description` lines; no `from`/`to`/`conditions`/`parameters` lines.

- [ ] **Step 4: Full check**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS (117+ pass — the 9 synthesizer + 2 binding integration tests added; 0 fail; 6 skipped). No new typecheck/lint errors.

- [ ] **Step 5: Commit the regenerated snapshot**

```bash
git add karabiner-output.json
git -c commit.gpgsign=false commit -m "chore(output): regenerate snapshot with auto-derived descriptions"
```

- [ ] **Step 6: Update the progress ledger**

Append a Phase 2 section to `.superpowers/sdd/progress.md` (after the Phase 1 section): list the 10 commits, state the description-agnostic structural diff vs `/tmp/phase1-structural.json` is empty, tests green, the synthesizer unit tests are the format lock, and note that `formatRuleDescription` now remains only in `engine/*-rules.ts` + `core/leader/build.ts` + its own unit test (Phase 3 removes the rest). Note `actionDesc?` + `Case.description?` added; `Binding.description` now optional.
```bash
git add .superpowers/sdd/progress.md
git -c commit.gpgsign=false commit -m "docs(progress): description-synthesizer Phase 2 complete"
```

---

## Self-Review (completed during authoring)

**Spec coverage:**
- §5 action templates → Task 3 (`describeAction`, every variant incl. `command`, `sequence`, `actionDesc`). ✓
- §5b `actionDesc?` on the listed variants → Task 2. ✓
- §6 condition labels (app/var, if/unless, multi, join) → Task 4. ✓
- §7 trigger segment + symbol reuse → Task 5. ✓
- §8 `Binding.description` optional + `Case.description?` → Task 2 (Case) + Task 8 (Binding). ✓
- §9 synthesizer module + multi-line format + slice-label → Tasks 3–7 (synth) + Task 8 (wiring). ✓
- §11 Phase 2 deliverables (build synthesizer; wire `defineBindings`; remove `formatRuleDescription` from definitions; set slice-labels; regenerate) → Tasks 3–9. ✓
- §12 description-agnostic structural diff gate → Tasks 8/10 (and the Global Constraints gate after each behavior task). ✓
- §2 "format locked by synthesizer unit tests, not snapshot" → `description-synthesizer.test.ts` is the lock; `integration.test.ts` standardization test loosened to accept both formats. ✓

**Placeholder scan:** every code step contains real code. The one scaffolding line in Task 4 Step 3 (`describeAppCondition` placeholder) is explicitly marked "Delete that placeholder scaffold — the real implementation is:" immediately above the real function. All expected test strings are concrete literals derived from `KEY_SYMBOLS` + the templates. refDesc/varDesc values are real registry labels.

**Type consistency:** `describeAction`/`describeConditionGroup`/`describeTrigger`/`synthesizeRuleDescription`/`synthesizeManipulatorLabel` defined once and reused with identical names. `rawConditions: Condition[]` added to `ResolvedCase` + `CaseGroup` in Task 8 and read by `buildRemap`/`buildTapHold`/`unionRawConditions`. `Binding.description` becomes optional in Task 8 (not Task 2) precisely so no intermediate `rule(string | undefined)` type error appears. `expandModifiers`/`keyTokenToLabel`/`modifierTokenToSymbols` exported in Task 1 and consumed in Task 3+.

**Deferred to Phase 3 plan:** migrate the engine adapters (`tap-hold-rules`, `multi-tap-rules`, `simultaneous-rules`, `conditional-tap-hold-rules`, `launcher-rules`, `double-tap-guard-rules`, `modifier-chord-rules`, `escape-rule`) + `core/leader/build.ts` + `caps-lock.ts` to auto-derived descriptions (deleting the remaining `formatRuleDescription` calls and the helper itself once unused); `SimOrder`-augmented trigger rendering (Task 5 is minimal — no Phase 2 binding uses a simultaneous trigger); the tap-hold family `Binding[]` migration + `assertUniqueTriggers` + dead-adapter deletion.
