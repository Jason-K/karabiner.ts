# Tap-Hold Family Migration (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the tap-hold family — `single-key`, `hyper`, `left-command`, `apps/antinote`, `right-option` (+ hyper's launcher + left-command's multi-tap) — from `TapHoldConfig`/`MultiTapConfig`/`ModifierLauncherMapping` records to direct `Binding[]`; relocate the barrel's cross-file collision detection to a `Binding[]`-level `assertUniqueTriggers`; delete the now-dead adapters `generateTapHoldRules` / `generateModifierLauncherRules` / `generateMultiTapRule`. Descriptions auto-derive (Phase 2). Non-description output stays behavior-identical.

**Architecture:** Three small Binding constructors (`holdKey`, `tapHoldBinding`, `remap`) replace the per-adapter config shapes, so each definition file exports `Binding[]` directly (matching the compactness of today's `Record<string, TapHoldConfig>` — the user's established edit-surface style). The barrel merges the five tap-hold `Binding[]` arrays through `assertUniqueTriggers` (replacing `mergeTapHoldRecords`' keyString duplicate check). `index.ts` calls `defineBindings(tapHoldBindings)` directly. `generateSimultaneousRules` keeps its conflict-validation but its `tapHoldKeys: Record` param becomes `tapHoldBindings: Binding[]` (bare-keys derived for the overlap check); `suppressionVars` is dropped (always `[]` in `index.ts`). **Specials stay specialized (spec §13):** `generateDoubleTapGuardRule` (cmd-q, antinote-delete), `generateModifierChordRules` (caps-lock), `generateConditionalTapHoldRules` (enter/equals), `generateEscapeRule` — all unchanged.

**Tech Stack:** TypeScript, `karabiner.ts`, `node:test` (`tsx --test`), `tsx` to run `src/index.ts`, `jq` for the description-agnostic structural diff.

## Global Constraints

- **Description-agnostic structural gate (the safety net):** after EVERY behavior-touching task, regenerate and confirm events/triggers/conditions/timing are identical to the current (pre-Phase-3) state:
  ```bash
  CI=true npx tsx src/index.ts
  jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase3-structural.json
  diff /tmp/phase2-structural.json /tmp/phase3-structural.json   # /tmp/phase2-structural.json captured in Task 1 Step 1
  ```
  Expected: **empty**. The raw `karabiner-output.json` **will** change — descriptions auto-derive instead of `formatRuleDescription`, and slice-labels appear. That is the point. **Run this after each file migration and fix any non-description diff before moving on.**
- **Baseline:** capture `/tmp/phase2-structural.json` from the current `refactor_engine` HEAD at the start (Task 1 Step 1). The Phase 1 baseline `/tmp/phase1-structural.json` (sorted) also exists as a cross-check.
- **Never `npm run build` during iteration** — it writes the live Karabiner profile + reloads Hammerspoon. Regenerate the golden with `CI=true npx tsx src/index.ts`.
- **Tests gate:** `npm run typecheck && npm run lint && npm test` must stay green (Phase 2 baseline = 139 pass / 0 fail / 6 skipped).
- **Commits unsigned in this env:** `git -c commit.gpgsign=false commit …`.
- **Faithful migration, not refit:** every entry's `alone`/`hold`/`modifiers`/`timing` is preserved exactly. The constructors reproduce `generateTapHoldRules`' Binding shape (modulo `description`, which auto-derives). The structural gate is the proof.
- **Known pre-existing oddity (preserve, do NOT fix):** `hyper.ts` defines `vmCOCS+t` in BOTH `hyperTapHoldMappings` (alone/hold) and `hyperLauncherMappings` (press). Both produce a rule today; both must produce a rule after migration. They live in SEPARATE arrays (tap-hold set vs launcher), so `assertUniqueTriggers` (which only sees the tap-hold set) won't flag it. Flag it to the user in the ledger; do not dedupe.

**Spec:** `docs/superpowers/specs/2026-07-22-auto-derived-descriptions-design.md` (§11 Phase 3, §13 out-ofscope/specials).

---

## File Structure

- **Create `src/engine/binding-helpers.ts`** — `holdKey`, `tapHoldBinding`, `remap` (Binding constructors) + `assertUniqueTriggers`.
- **Create `src/tests/binding-helpers.test.ts`** — unit tests for the constructors + collision check.
- **Modify `src/engine/index.ts`** — re-export `./binding-helpers`.
- **Modify `src/definitions/single-key.ts`, `hyper.ts`, `left-command.ts`, `apps/antinote.ts`, `right-option.ts`** — `Record<string, TapHoldConfig>` → `Binding[]` via the constructors.
- **Modify `src/definitions/index.ts`** — replace `mergeTapHoldRecords` + `tapHoldMappings` with `tapHoldBindings = assertUniqueTriggers([...])`; re-export `tapHoldBindings`.
- **Modify `src/index.ts`** — `generateTapHoldRules(tapHoldMappings)` → `defineBindings(tapHoldBindings)`; `generateSimultaneousRules(simultaneousMappings, [], tapHoldMappings)` → `generateSimultaneousRules(simultaneousMappings, tapHoldBindings)`.
- **Modify `src/engine/simultaneous-rules.ts`** — drop `suppressionVars`; `tapHoldKeys: Record<string, TapHoldConfig>` → `tapHoldBindings: Binding[]` (derive bare keys for Check 2).
- **Delete `src/engine/tap-hold-rules.ts`, `src/engine/launcher-rules.ts`, `src/engine/multi-tap-rules.ts`** (after Tasks 3–5 migrate all callers).
- **Modify `src/tests/mappings.test.ts`, `src/tests/rules-factories.test.ts`** — update assertions that referenced the old Record shapes / `formatRuleDescription` strings.

---

## Task 1: Binding constructors + `assertUniqueTriggers`

Pure additions; nothing consumes them yet, so the output is unchanged.

**Files:**
- Create: `src/engine/binding-helpers.ts`
- Create: `src/tests/binding-helpers.test.ts`
- Modify: `src/engine/index.ts`

**Interfaces:**
- Consumes: `Binding`, `Case` from `./binding`; `ActionSpec` from `../core/action-dsl`.
- Produces: `holdKey`, `tapHoldBinding`, `remap`, `assertUniqueTriggers`.

- [ ] **Step 1: Capture the Phase 2 structural baseline**

```bash
CI=true npx tsx src/index.ts
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase2-structural.json
```
(Note its path — every later task diffs against `/tmp/phase2-structural.json`.)

- [ ] **Step 2: Write the failing tests**

Create `src/tests/binding-helpers.test.ts`:
```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertUniqueTriggers,
  holdKey,
  remap,
  tapHoldBinding,
} from "../engine/binding-helpers";

test("holdKey: bare-key hold-only binding (tap passes through)", () => {
  const b = holdKey("a", [{ type: "key", key: "f18", modifiers: ["vmCOC_"] }]);
  assert.deepEqual(b.trigger, { keys: ["a"] });
  assert.deepEqual(b.cases, [{ phase: "hold", do: [{ type: "key", key: "f18", modifiers: ["vmCOC_"] }] }]);
});

test("holdKey: with modifiers", () => {
  const b = holdKey("s", [{ type: "noop" }], { modifiers: ["left_shift"] });
  assert.deepEqual(b.trigger, { keys: ["s"], modifiers: ["left_shift"] });
});

test("tapHoldBinding: alone + hold + timing", () => {
  const b = tapHoldBinding("k", ["right_option"], {
    alone: [{ type: "shell", command: "x" }],
    hold: [{ type: "raycast", ref: { type: "raycast", name: "n", refDesc: "N" } }],
    timeoutMs: 200,
    thresholdMs: 200,
  });
  assert.deepEqual(b.trigger, { keys: ["k"], modifiers: ["right_option"] });
  assert.deepEqual(b.timing, { aloneMs: 200, heldThresholdMs: 200 });
  assert.deepEqual(b.cases, [
    { phase: "release", do: [{ type: "shell", command: "x" }] },
    { phase: "hold", do: [{ type: "raycast", ref: { type: "raycast", name: "n", refDesc: "N" } }] },
  ]);
});

test("remap: plain press binding", () => {
  const b = remap("s", ["vmCOCS"], [{ type: "shell", command: "fmt" }]);
  assert.deepEqual(b.trigger, { keys: ["s"], modifiers: ["vmCOCS"] });
  assert.deepEqual(b.cases, [{ phase: "press", do: [{ type: "shell", command: "fmt" }] }]);
});

test("assertUniqueTriggers: passes for distinct triggers", () => {
  const bs = [holdKey("a", [{ type: "noop" }]), holdKey("b", [{ type: "noop" }])];
  assert.equal(assertUniqueTriggers(bs), bs);
});

test("assertUniqueTriggers: throws on duplicate (order-independent mods)", () => {
  const dup = [tapHoldBinding("q", ["vmCOCS"], { hold: [{ type: "noop" }] }),
               tapHoldBinding("q", ["vmCOCS"], { hold: [{ type: "noop" }] })];
  assert.throws(() => assertUniqueTriggers(dup), /Duplicate trigger/);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx tsx --test src/tests/binding-helpers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/engine/binding-helpers.ts`**

```ts
import type { ActionSpec } from "../core/action-dsl";
import type { Binding, Case, Trigger } from "./binding";

type TapHoldOpts = {
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  timeoutMs?: number;
  thresholdMs?: number;
};

/** General tap/hold binding with explicit key + modifiers (hyper / right-option / left-command shape). */
export function tapHoldBinding(
  key: string,
  modifiers: string[],
  opts: TapHoldOpts,
): Binding {
  const cases: Case[] = [];
  if (opts.alone) cases.push({ phase: "release", do: opts.alone });
  if (opts.hold) cases.push({ phase: "hold", do: opts.hold });
  return {
    trigger: { keys: [key], ...(modifiers.length ? { modifiers } : {}) },
    timing: { aloneMs: opts.timeoutMs, heldThresholdMs: opts.thresholdMs },
    cases,
  };
}

/** Bare-key hold-only binding (the single-key shape): tap passes through, hold fires. */
export function holdKey(
  key: string,
  hold: ActionSpec[],
  opts?: { modifiers?: string[]; timeoutMs?: number; thresholdMs?: number },
): Binding {
  return tapHoldBinding(key, opts?.modifiers ?? [], {
    hold,
    timeoutMs: opts?.timeoutMs,
    thresholdMs: opts?.thresholdMs,
  });
}

/** Plain press remap (hyper launcher shape). */
export function remap(key: string, modifiers: string[], doActions: ActionSpec[]): Binding {
  return {
    trigger: { keys: [key], ...(modifiers.length ? { modifiers } : {}) },
    cases: [{ phase: "press", do: doActions }],
  };
}

function triggerSignature(t: Trigger): string {
  if ("pointer" in t) return `pointer:${t.pointer}|mods:${[...(t.modifiers ?? [])].sort().join(",")}`;
  const mods = [...(t.modifiers ?? [])].sort().join(",");
  const order = "order" in t && t.order ? JSON.stringify(t.order) : "";
  return `keys:${[...t.keys].sort().join(",")}|mods:${mods}|order:${order}`;
}

/**
 * Cross-file duplicate-trigger guard — replaces the barrel's `mergeTapHoldRecords`
 * keyString check. Throws on two bindings whose triggers are equivalent
 * (keys + modifiers, order-independent). Returns the input unchanged when unique.
 */
export function assertUniqueTriggers(bindings: Binding[]): Binding[] {
  const seen = new Map<string, Binding>();
  for (const b of bindings) {
    const sig = triggerSignature(b.trigger);
    if (seen.has(sig)) {
      throw new Error(`Duplicate trigger across definition files: ${sig}`);
    }
    seen.set(sig, b);
  }
  return bindings;
}
```

- [ ] **Step 5: Re-export from the engine barrel**

In `src/engine/index.ts`, add:
```ts
export * from "./binding-helpers";
```

- [ ] **Step 6: Run tests + gate**

Run: `npx tsx --test src/tests/binding-helpers.test.ts` → PASS (6 tests).
Run: `npm run typecheck && npm run lint` → clean.
Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json` → **empty** (nothing consumes the helpers yet).

- [ ] **Step 7: Commit**

```bash
git add src/engine/binding-helpers.ts src/engine/index.ts src/tests/binding-helpers.test.ts
git -c commit.gpgsign=false commit -m "feat(engine): add Binding constructors + assertUniqueTriggers"
```

---

## Task 2: Atomic tap-hold switchover (5 files + barrel + index + simultaneous)

This is the coupled core. Migrate all five `*TapHoldMappings` records to `Binding[]`, switch the barrel to `assertUniqueTriggers`, rewire `index.ts`, update `generateSimultaneousRules`, and delete `generateTapHoldRules` + `mergeTapHoldRecords` — all in one commit because the pieces are interdependent. The structural gate is the proof.

**Files:**
- Modify: `src/definitions/single-key.ts`, `hyper.ts` (tap-hold half only), `left-command.ts` (tap-hold half only), `apps/antinote.ts` (tap-hold half only), `right-option.ts`
- Modify: `src/definitions/index.ts`
- Modify: `src/index.ts`
- Modify: `src/engine/simultaneous-rules.ts`
- Delete: `src/engine/tap-hold-rules.ts`
- Modify: `src/tests/mappings.test.ts`, `src/tests/rules-factories.test.ts`

**Transformation rule (apply to every entry):**
- `"<mods>+<key>": { description, alone?: [a], hold?: [h], timeoutMs?, thresholdMs? }` → `tapHoldBinding("<key>", ["<mod1>", ...], { alone?: [a], hold?: [h], timeoutMs?, thresholdMs? })`. The modifier string is split on `+`; each part is a `ModComboAlias`/`ModKey` (e.g. `"vmCOCS"`, `"left_command"`, `"left_shift"`, `"right_option"`, `"left_control"`). `parseKeyWithModifiers` already lowercases non-alias single mods — but every live entry already uses canonical tokens (`left_command`, `left_shift`, `right_option`, `vmCOCS`, …), so pass them through verbatim.
- `"<barekey>": { description, hold: [h] }` → `holdKey("<barekey>", [h])`.
- `"shift+s": { description, hold: [h] }` → `holdKey("s", [h], { modifiers: ["left_shift"] })`.
- `description` is DROPPED (auto-derived).

**Exemplars** (single-key.ts):
```ts
//   a: { description: "Raycast AI-quick search", hold: [{type:"key",key:"f18",modifiers:["vmCOC_"],options:{repeat:false}}] }
// =>
holdKey("a", [{ type: "key", key: "f18", modifiers: ["vmCOC_"], options: { repeat: false } }]),

//   "shift+s": { description: "Screenshot Window", hold: [{type:"cleanShot", ref: cleanShotRegistry.captureWindow}] }
// =>
holdKey("s", [{ type: "cleanShot", ref: cleanShotRegistry.captureWindow }], { modifiers: ["left_shift"] }),
```
**Exemplars** (hyper.ts tap-hold):
```ts
//   "vmCOCS+q": { description:"Focus window to the left", alone:[{type:"key",key:"left_arrow",modifiers:["left_command","left_control","left_option"],options:{repeat:false}}] }
// =>
tapHoldBinding("q", ["vmCOCS"], { alone: [{ type: "key", key: "left_arrow", modifiers: ["left_command", "left_control", "left_option"], options: { repeat: false } }] }),
```
**Exemplars** (right-option.ts):
```ts
//   "right_option+s": { description:"Spotify toggle (tap), search (hold)", alone:[{type:"shell",command:spotifyToggleCommand()}], hold:[{type:"raycast",ref:raycastRegistry.spotifySearch}], timeoutMs, thresholdMs }
// =>
tapHoldBinding("s", ["right_option"], { alone: [{ type: "shell", command: spotifyToggleCommand() }], hold: [{ type: "raycast", ref: raycastRegistry.spotifySearch }], timeoutMs: TIMINGS.delayHoldMs, thresholdMs: TIMINGS.delayHoldMs }),
```

- [ ] **Step 1: Rewrite `src/definitions/single-key.ts`**

Replace `export const singleKeyTapHoldMappings: Record<string, TapHoldConfig> = { ... }` with `export const singleKeyTapHoldBindings: Binding[] = [ ... ]`, transforming all ~40 entries via the rule above. Keep the big descriptive comment block at the top. Import `holdKey` from `../engine` (or `../engine/binding-helpers`) and `Binding` type. Drop the `TapHoldConfig` import. Every `hold` action array is copied verbatim; only the wrapper changes. (The `8:` numeric-key entry and `grave_accent_and_tilde:` etc. are bare keys → `holdKey`.)

- [ ] **Step 2: Rewrite the tap-hold half of `src/definitions/hyper.ts`**

Convert `hyperTapHoldMappings` (14 `vmCOCS+X` entries) → `export const hyperTapHoldBindings: Binding[] = [ ... ]` using `tapHoldBinding("<key>", ["vmCOCS"], { alone?, hold? })`. Leave `hyperLauncherMappings` and `buildHyperLauncherRules` UNCHANGED for now (Task 3). Drop the `TapHoldConfig` import only if `hyperLauncherMappings` doesn't need it (it doesn't — it uses `ModifierLauncherMapping`).

- [ ] **Step 3: Rewrite the tap-hold half of `src/definitions/left-command.ts`**

Convert `leftCommandTapHoldMappings` (2 entries: `left_command+m`, `left_command+p`) → `export const leftCommandTapHoldBindings: Binding[] = [ tapHoldBinding("m", ["left_command"], { hold: [...] }), tapHoldBinding("p", ["left_command"], { hold: [...] }) ]`. Leave `leftCommandMultiTap`, `cmdQGuard`, `buildLeftCommandRule`, `buildCmdQRule` UNCHANGED (Task 4 / specials). Drop the `TapHoldConfig` import.

- [ ] **Step 4: Rewrite the tap-hold half of `src/definitions/apps/antinote.ts`**

Convert `antinoteTapHoldMappings` (1 entry: `left_shift+a`) → `export const antinoteTapHoldBindings: Binding[] = [ tapHoldBinding("a", ["left_shift"], { hold: [{ type: "url", url: "antinote://", background: true }] }) ]`. Leave `antinoteDeleteGuard` + `buildAntinoteRules` UNCHANGED (special). Drop the `TapHoldConfig` import.

- [ ] **Step 5: Rewrite `src/definitions/right-option.ts`**

Convert `rightOptionTapHoldMappings` (3 entries) → `export const rightOptionTapHoldBindings: Binding[] = [ ... ]` using `tapHoldBinding("<key>", ["right_option"], { alone?, hold?, timeoutMs: TIMINGS.delayHoldMs, thresholdMs: TIMINGS.delayHoldMs })`. Drop the `TapHoldConfig` import.

- [ ] **Step 6: Update the barrel `src/definitions/index.ts`**

Replace the `mergeTapHoldRecords` function and the `tapHoldMappings` export with:
```ts
import { assertUniqueTriggers, type Binding } from "../engine";
import { antinoteTapHoldBindings } from "./apps/antinote";
import { hyperTapHoldBindings } from "./hyper";
import { leftCommandTapHoldBindings } from "./left-command";
import { rightOptionTapHoldBindings } from "./right-option";
import { singleKeyTapHoldBindings } from "./single-key";

export const tapHoldBindings: Binding[] = assertUniqueTriggers([
  ...singleKeyTapHoldBindings,
  ...hyperTapHoldBindings,
  ...leftCommandTapHoldBindings,
  ...antinoteTapHoldBindings,
  ...rightOptionTapHoldBindings,
]);
```
Remove the old `import type { TapHoldConfig }`, the five old `*TapHoldMappings` imports, `mergeTapHoldRecords`, and `export const tapHoldMappings`. Remove `rightOptionTapHoldMappings` from the re-export block; add nothing for it (it's consumed only via `tapHoldBindings`). Keep exporting `hyperTapHoldBindings`/`leftCommandTapHoldMappings`? — they no longer exist; remove those barrel re-exports too. (Check `hyperTapHoldMappings`/`leftCommandTapHoldMappings` re-exports at lines 28–36 and delete them.)

- [ ] **Step 7: Update `src/engine/simultaneous-rules.ts`**

Drop the `suppressionVars` param and change `tapHoldKeys` to `tapHoldBindings: Binding[]`:
```ts
import { defineBindings, type Binding, type Case, type SimOrder } from "./binding";
// remove: import type { TapHoldConfig } from "./tap-hold-rules";

export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  tapHoldBindings: Binding[],
): Rule[] {
  validateMappings(mappings, tapHoldBindings);
  const bindings: Binding[] = Object.entries(mappings).map(([, config]) => {
    const cases: Case[] = [];
    if (config.alone) cases.push({ phase: "release", do: config.alone });
    if (config.hold) cases.push({ phase: "hold", do: config.hold });
    if (config.tapTap) cases.push({ tapCount: 2, phase: "release", do: config.tapTap });
    if (config.tapTapHold) cases.push({ tapCount: 2, phase: "hold", do: config.tapTapHold });
    return {
      trigger: {
        keys: config.keys,
        ...(resolveOrder(config.simultaneousOptions) ? { order: resolveOrder(config.simultaneousOptions) } : {}),
      },
      timing: { aloneMs: config.thresholdMs, heldThresholdMs: config.thresholdMs, simultaneousMs: config.simultaneousThresholdMs },
      ...(config.simultaneousOptions?.to_after_key_up ? { afterKeyUp: config.simultaneousOptions.to_after_key_up } : {}),
      cases,
    };
  });
  return defineBindings(bindings);
}
```
In `validateMappings`, replace Check 2's `bareHoldKeys` derivation:
```ts
function validateMappings(mappings: Record<string, SimultaneousConfig>, tapHoldBindings: Binding[]): void {
  // …Check 0 + Check 1 unchanged…
  const bareHoldKeys = new Set(
    tapHoldBindings
      .filter((b) => "keys" in b.trigger && !(b.trigger.modifiers?.length))
      .flatMap((b) => (b.trigger as { keys: string[] }).keys),
  );
  // …rest of Check 2 unchanged…
}
```
(`suppressionVars` is gone entirely — it was always `[]` in `index.ts`.)

- [ ] **Step 8: Rewire `src/index.ts`**

```ts
import { defineBindings } from "./engine";   // add if not already imported
// replace: const tapHoldRules = generateTapHoldRules(tapHoldMappings);
// replace: const simultaneousRules = generateSimultaneousRules(simultaneousMappings, [], tapHoldMappings);
const tapHoldRules = defineBindings(tapHoldBindings);
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, tapHoldBindings);
```
Swap the `tapHoldMappings` import for `tapHoldBindings` in the `./definitions` import block. Remove `generateTapHoldRules` from the `./engine` import.

- [ ] **Step 9: Delete `src/engine/tap-hold-rules.ts`**

`rm src/engine/tap-hold-rules.ts`. Remove `export * from "./tap-hold-rules"` from `src/engine/index.ts`.

- [ ] **Step 10: Update `src/tests/mappings.test.ts`**

Three tests reference `tapHoldMappings["..."]` (the Record). Rewrite them to find the binding in `tapHoldBindings` by trigger. Add a small helper at the top of the file:
```ts
import { tapHoldBindings } from "../definitions";
import type { Binding } from "../engine";

function findTapHold(key: string, modifiers: string[] = []): Binding {
  const mods = [...modifiers].sort().join(",");
  const found = tapHoldBindings.find(
    (b) =>
      "keys" in b.trigger &&
      b.trigger.keys.length === 1 &&
      b.trigger.keys[0] === key &&
      [...(b.trigger.modifiers ?? [])].sort().join(",") === mods,
  );
  if (!found) throw new Error(`tap-hold binding not found: ${modifiers.join("+")}+${key}`);
  return found;
}
```
- `"tap-hold mappings keep expected anchor keys"` → assert `findTapHold("a")`, `findTapHold("q", ["vmCOCS"])`, `findTapHold("left_arrow", ["vmCOCS"])`, `findTapHold("right_arrow", ["vmCOCS"])`, `findTapHold("spacebar", ["vmCOCS"])`, `findTapHold("tab")`, `findTapHold("tab", ["vmCOCS"])`, `findTapHold("keypad_1", ["vmCOCS"])`, … `findTapHold("s", ["right_option"])` all exist (wrap in `assert.doesNotThrow`).
- `"new vmCOCS rectangle mappings stay declarative"` → `const left = findTapHold("left_arrow", ["vmCOCS"]); const alone = left.cases.find(c => c.phase === "release")!.do; assert.deepEqual(alone, [{type:"shell", command: rectangleOrientationBasedCommand("left-half","top-half")}]); const hold = left.cases.find(c => c.phase === "hold")!.do; assert.deepEqual(hold, [{type:"url", url: rectangleActionUrl("previous-display"), background:true}]);` (and the spacebar / keypad_9 cases similarly).
- `"vmCOCS+q/e/r/f focus-window tap-hold mappings stay declarative"` → for each of q/e/r/f: `const b = findTapHold("<key>", ["vmCOCS"]); const alone = b.cases.find(c => c.phase === "release")!.do; assert.deepEqual(alone, [{type:"key", key:"<arrow>", modifiers:["left_command","left_control","left_option"], options:{repeat:false}}]);` (drop the old `.description` assertions — descriptions auto-derive; the `.alone` shape is the behavior lock).

- [ ] **Step 11: Update `src/tests/rules-factories.test.ts`**

The single-key/hyper tap-hold rules are generated via `defineBindings(tapHoldBindings)` in `index.ts` (not a per-file builder), so they aren't in this file. But the test imports — check for any `tapHoldMappings`/`generateTapHoldRules` references and remove them. (The hyper-launcher and left-command tests are handled in Tasks 3–4.)

- [ ] **Step 12: Regenerate + structural gate**

Run: `CI=true npx tsx src/index.ts`
```bash
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase3-structural.json
diff /tmp/phase2-structural.json /tmp/phase3-structural.json && echo "STRUCTURAL DIFF EMPTY"
```
Expected: **empty**. If non-empty, the diff shows which manipulator differs — fix the offending entry (a mis-copied action / wrong modifier / dropped timing) and re-run. Run `npm run typecheck && npm run lint && npm test` → green (the rewritten mappings tests + everything else).

- [ ] **Step 13: Commit**

```bash
git add -A
git -c commit.gpgsign=false commit -m "refactor(definitions): migrate tap-hold family to Binding[]; delete generateTapHoldRules"
```

---

## Task 3: Hyper launcher → `Binding[]`; delete `generateModifierLauncherRules`

`hyperLauncherMappings` (5 press-remaps on `vmCOCS`) becomes `Binding[]` via `remap`. Independent of Task 2.

**Files:**
- Modify: `src/definitions/hyper.ts`
- Modify: `src/definitions/index.ts` (re-export `hyperLauncherBindings`)
- Modify: `src/index.ts` (`buildHyperLauncherRules` body)
- Delete: `src/engine/launcher-rules.ts`
- Modify: `src/engine/index.ts` (drop re-export)
- Modify: `src/tests/rules-factories.test.ts`

- [ ] **Step 1: Rewrite the launcher half of `src/definitions/hyper.ts`**

Convert `hyperLauncherMappings: ModifierLauncherMapping[]` → `export const hyperLauncherBindings: Binding[] = hyperLauncherMappings` is NOT the move — rewrite each as `remap("<key>", ["vmCOCS"], [<action>])`. Concretely:
```ts
import { remap, type Binding } from "../engine";
// ...
export const hyperLauncherBindings: Binding[] = [
  remap("s", ["vmCOCS"], [{ type: "shell", command: formatSelectionCommand() }]),
  remap("t", ["vmCOCS"], [{ type: "shell", command: typinatorNewRuleCommand() }]),
  remap("comma", ["vmCOCS"], [{ type: "app", ref: appRegistry.systemSettings }]),
  remap("f12", ["vmCOCS"], [{ type: "osascript", scriptPath: `${PATHS.typinatorEditLastRule}` }]),
  remap("escape", ["vmCOCS"], [{ type: "app", ref: appRegistry.activityMonitor }]),
];
export const buildHyperLauncherRules = () => defineBindings(hyperLauncherBindings);
```
Drop the `generateModifierLauncherRules` / `ModifierLauncherMapping` import; add `defineBindings` + `remap` to the `../engine` import.

- [ ] **Step 2: Barrel + index.ts**

In `src/definitions/index.ts`: swap the `hyperLauncherMappings` re-export for `hyperLauncherBindings` (if anything imported `hyperLauncherMappings`, update it — nothing should outside tests). `src/index.ts` already calls `buildHyperLauncherRules()` — no change needed there (the function signature is unchanged).

- [ ] **Step 3: Delete `src/engine/launcher-rules.ts` + drop its barrel re-export**

`rm src/engine/launcher-rules.ts`; remove `export * from "./launcher-rules";` from `src/engine/index.ts`.

- [ ] **Step 4: Update `src/tests/rules-factories.test.ts` — `"vmCOC_ plus rules factory keeps grouped mappings"`**

The 5 launcher descriptions now auto-derive. Replace the exact-string `deepEqual(rules.map(r => r.description), [...])` with a structural check:
```ts
test("vmCOC_ plus rules factory keeps grouped mappings", () => {
  const rules = toRules(buildHyperLauncherRules());
  assert.equal(rules.length, 5);
  assert.ok(rules.every((r) => /^\[vmCOCS\]\+\[[^\]]+\]:\n---/.test(r.description)));
  assert.ok(rules.every((r) => r.manipulators.length === 1));
});
```

- [ ] **Step 5: Gate + commit**

Run: `CI=true npx tsx src/index.ts` then the structural diff vs `/tmp/phase2-structural.json` → **empty**. `npm run typecheck && npm run lint && npm test` → green.
```bash
git add -A
git -c commit.gpgsign=false commit -m "refactor(hyper): migrate launcher to Binding[]; delete generateModifierLauncherRules"
```

---

## Task 4: Left-command multi-tap → `Binding[]`; delete `generateMultiTapRule`

`leftCommandMultiTap` becomes a `Binding` with `multiTap` + tapCount-2 case.

**Files:**
- Modify: `src/definitions/left-command.ts`
- Delete: `src/engine/multi-tap-rules.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/tests/rules-factories.test.ts`

- [ ] **Step 1: Rewrite the multi-tap half of `src/definitions/left-command.ts`**

```ts
import { defineBindings, type Binding } from "../engine";
// ...
export const leftCommandMultiTapBinding: Binding = {
  trigger: { keys: ["left_command"] },
  timing: { aloneMs: TIMINGS.timeoutDoubleTapMs, heldThresholdMs: TIMINGS.timeoutDoubleTapMs },
  multiTap: { allowPassThrough: true, mods: [] },
  cases: [
    { phase: "release", do: [{ type: "key", key: "left_command" }] },
    { phase: "hold", do: [{ type: "key", key: "left_command" }] },
    { tapCount: 2, phase: "release", do: [{ type: "appHistory", index: 1 }] },
  ],
};
export const buildLeftCommandRule = () => defineBindings([leftCommandMultiTapBinding])[0]!;
```
Drop the `generateMultiTapRule` / `MultiTapConfig` import. (`cmdQGuard` + `buildCmdQRule` unchanged — special.)

- [ ] **Step 2: Delete `src/engine/multi-tap-rules.ts` + barrel re-export**

`rm src/engine/multi-tap-rules.ts`; remove `export * from "./multi-tap-rules";` from `src/engine/index.ts`.

- [ ] **Step 3: Update `src/tests/rules-factories.test.ts` — `"left command factory keeps dual manipulator behavior"`**

```ts
test("left command factory keeps dual manipulator behavior", () => {
  const rule = toRule(buildLeftCommandRule());
  assert.match(rule.description, /^\[⌘\]:\n---/);
  assert.equal(rule.manipulators.length, 2);
});
```
(The second left-command test — pass-through/app-switch manipulator contents — is behavior, unchanged; leave it.)

- [ ] **Step 4: Gate + commit**

Structural diff vs `/tmp/phase2-structural.json` → **empty**; typecheck/lint/test green.
```bash
git add -A
git -c commit.gpgsign=false commit -m "refactor(left-command): migrate multi-tap to Binding[]; delete generateMultiTapRule"
```

---

## Task 5: Final verification + cleanup + ledger

**Files:** none new (verification; possibly trim now-dead `formatRuleDescription` callers if any remain in the migrated files).

- [ ] **Step 1: Confirm no live `formatRuleDescription` callers remain in the migrated family**

Run: `rg -n "formatRuleDescription" src/definitions src/engine`
Expected remaining callers ONLY in: `core/rule-descriptions.ts` (def), `core/leader/build.ts`, `engine/conditional-tap-hold-rules.ts`, `engine/modifier-chord-rules.ts`, `engine/double-tap-guard-rules.ts`, `engine/escape-rule.ts`, `tests/rule-descriptions.test.ts`. (These are specials/leader — out of Phase 3 scope per §13.)

- [ ] **Step 2: Confirm the three adapters are gone**

Run: `ls src/engine/tap-hold-rules.ts src/engine/launcher-rules.ts src/engine/multi-tap-rules.ts 2>&1`
Expected: all three "No such file".

- [ ] **Step 3: Full structural gate vs Phase 1 AND Phase 2**

```bash
CI=true npx tsx src/index.ts
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/phase3-structural.json
diff /tmp/phase2-structural.json /tmp/phase3-structural.json && echo "vs Phase 2 EMPTY"
diff /tmp/phase1-structural.json /tmp/phase3-structural.json && echo "vs Phase 1 EMPTY"
```
Expected: both empty.

- [ ] **Step 4: Full check**

Run: `npm run typecheck && npm run lint && npm test` → green (≥139 pass).

- [ ] **Step 5: Regenerate snapshot + commit**

```bash
git add karabiner-output.json
git -c commit.gpgsign=false commit -m "chore(output): regenerate snapshot after tap-hold migration"
```

- [ ] **Step 6: Update progress ledger**

Append a Phase 3 section to `.superpowers/sdd/progress.md`: list the commits, structural diff empty vs Phase 1+2, adapters deleted, `assertUniqueTriggers` replaces `mergeTapHoldRecords`, specials kept, the `vmCOCS+t` hyper launcher/tap-hold overlap FLAGGED as pre-existing (preserved, not fixed). Note `formatRuleDescription` now remains only in leader/conditional-tap-hold/modifier-chord/double-tap-guard/escape-rule + its unit test.
```bash
git add docs/superpowers/plans/2026-07-22-tap-hold-migration-phase3.md
git -c commit.gpgsign=false commit -m "docs(progress): tap-hold migration Phase 3 complete + plan"
```
(`.superpowers/sdd/progress.md` is gitignored — local only, as in Phases 1–2.)

---

## Self-Review (completed during authoring)

**Spec coverage:**
- §11 Phase 3 migrate single-key/hyper/left-command/antinote/right-option → Task 2 (tap-hold) + Task 3 (launcher) + Task 4 (multi-tap). ✓
- §11 "relocate collision detection to `assertUniqueTriggers`" → Task 1 (helper) + Task 2 (barrel). ✓
- §11 "delete `generateTapHoldRules`/`generateModifierLauncherRules`/`generateMultiTapRule`" → Tasks 2/3/4. ✓
- §11 "descriptions auto-derive, no formatRuleDescription / no per-entry description" → every migrated entry drops `description`; auto-derive (Phase 2 synthesizer) handles it. ✓
- §13 specials stay specialized (double-tap-guard, modifier-chord, conditional-tap-hold, escape-rule) → explicitly untouched. ✓
- §13 simultaneous keeps conflict-validation, `tapHoldKeys` param → Binding[] → Task 2 Step 7. ✓
- §12 description-agnostic structural gate → Global Constraints + after every behavior task. ✓

**Placeholder scan:** constructor code is complete; transformation rule + exemplars cover each entry variant (bare key, `shift+key`, `vmCOCS+key`, `right_option+key`, `left_command+key`, alone/hold/timing). Bulk entries (single-key 40, hyper 14) are mechanical applications of the stated rule, verified by the structural gate — not placeholders (the transformation is fully defined). Test rewrites show real code.

**Type consistency:** `holdKey`/`tapHoldBinding`/`remap`/`assertUniqueTriggers` defined once (Task 1), consumed in Tasks 2–4. `tapHoldBindings: Binding[]` (barrel) replaces `tapHoldMappings: Record`. `generateSimultaneousRules(mappings, tapHoldBindings: Binding[])` signature changed once (Task 2 Step 7) and called once (`index.ts` Task 2 Step 8). `Binding.description` optional (Phase 2) — all migrated bindings omit it.

**Deferred / out of scope:** simultaneous.ts stays an empty `Record<string, SimultaneousConfig>` (its full →`Binding[]` migration is zero-value while empty; `generateSimultaneousRules` is retained for when it's populated). Mouse unification (task 9) is its own sub-project. Leader layer + the four specials keep `formatRuleDescription`.
