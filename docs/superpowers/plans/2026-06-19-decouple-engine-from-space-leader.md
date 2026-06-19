# Decouple Engine From Space Leader Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the rule engine leader-agnostic so it emits zero leader-suppression conditions when no leader layer is active, while preserving and generalizing the ability to add any leader-type layer later.

**Architecture:** Engine functions (`generateTapHoldRules`, `generateSimultaneousRules`) accept a `suppressionVars: string[]` instead of hardcoding `"space"`. A new `leaderSuppressionVars(prefix, layers)` helper in `core/leader/runtime.ts` is the single source of truth for a leader's variable names. `generateEscapeRule` and `emitLayerDefinitions` are generalized off the `"space"` literal. Space-specific data files and their tests are deleted; the orchestrator passes `[]`.

**Tech Stack:** TypeScript, `karabiner.ts`, `tsx` (runtime + test runner), ESLint (`--max-warnings=0`), `tsc`. Node v26.

## Global Constraints

- **Verify per task:** every task ends with `npm run typecheck && npm run lint && npm test` locally green for the code it touches (pre-existing failures listed in Task 7 are exempt).
- **Test runner:** `npm test` runs `tsx --test src/*.test.ts src/**/*.test.ts`. New test files live in `src/tests/` and are auto-discovered.
- **Lint is strict:** `eslint src --max-warnings=0`. Remove every import that becomes unused (the refactor removes several) — unused imports fail lint.
- **Commit trailer:** every commit message ends with a blank line then `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Backups:** this is a git repo; per-task commits on branch `refactor/decouple-space-leader` are the backup mechanism. Do **not** create `.bak` files (not this repo's convention).
- **Branch:** all work is on `refactor/decouple-space-leader` (already created and checked out).
- **Karabiner event shapes (verified in `karabiner-output.json`):**
  - condition: `{ type: "variable_unless", name: "<var>", value: 1 }`
  - to-event: `{ set_variable: { name: "<var>", value: 0 } }`

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/core/leader/runtime.ts` | Modify | Add `leaderSuppressionVars()` — derives a leader's full suppression var list |
| `src/core/leader/index.ts` | Modify | Re-export `leaderSuppressionVars` |
| `src/engine/tap-hold-rules.ts` | Modify | Accept `suppressionVars: string[]`; drop leader imports |
| `src/engine/simultaneous-rules.ts` | Modify | Accept `suppressionVars: string[]`; rename helper; drop leader imports |
| `src/engine/escape-rule.ts` | Modify | Accept `suppressionVars: string[]`; drop leader imports |
| `src/engine/layer-emit.ts` | Modify | Accept `prefix`, `label`; drop the `"space"` literal |
| `src/index.ts` | Modify | Pass `[]`; remove all dead space wiring |
| `src/definitions/space.ts` | Delete | Obsolete space layer data |
| `src/data/space-layer.ts` | Delete | Obsolete space constants |
| `src/definitions/index.ts` | Modify | Remove commented `spaceLayerDefinitions` re-export |
| `src/data/index.ts` | Modify | Remove commented `SPACE_LAYER_*` re-export |
| `src/tests/leader-runtime.test.ts` | Create | Test `leaderSuppressionVars` |
| `src/tests/tap-hold-rules.test.ts` | Create | Test suppression injection (positive + negative) |
| `src/tests/simultaneous.test.ts` | Modify | Rename fixture; generic + negative tests; drop `SubLayerConfig` import |
| `src/tests/escape-rule.test.ts` | Create | Test generalized escape reset |
| `src/tests/layer-emit.test.ts` | Create | Test prefix-keyed emission |
| `src/tests/mappings.test.ts` | Modify | Drop space-data import + 2 tests |
| `src/tests/integration.test.ts` | Modify | Drop 2 space tests; repurpose 1 to a negative assertion |

---

### Task 1: `leaderSuppressionVars` helper

**Files:**
- Modify: `src/core/leader/runtime.ts`
- Modify: `src/core/leader/index.ts`
- Test: `src/tests/leader-runtime.test.ts`

**Interfaces:**
- Consumes: `getAllSublayerVars(prefix, layers)` (already in `runtime.ts`), `SubLayerConfig` (already imported in `runtime.ts`).
- Produces: `leaderSuppressionVars(prefix: string, layers: SubLayerConfig[]): string[]` — returns `[`${prefix}_mod`, ...getAllSublayerVars(layers, prefix)]`. Exported from `core/leader`.

- [ ] **Step 1: Write the failing test**

Create `src/tests/leader-runtime.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { leaderSuppressionVars } from "../core/leader";
import type { SubLayerConfig } from "../core/leader";

const layers: SubLayerConfig[] = [
  { layerKey: "d", layerName: "Downloads", mappings: {} },
  {
    layerKey: "f",
    layerName: "Folders",
    mappings: {},
    subLayers: [{ layerKey: "r", layerName: "Recent", mappings: {} }],
  },
];

test("leaderSuppressionVars: returns <prefix>_mod plus all sublayer vars", () => {
  assert.deepEqual(leaderSuppressionVars("leader", layers), [
    "leader_mod",
    "leader_d_sublayer",
    "leader_f_sublayer",
    "leader_f_r_sublayer",
  ]);
});

test("leaderSuppressionVars: empty layers yields just <prefix>_mod", () => {
  assert.deepEqual(leaderSuppressionVars("leader", []), ["leader_mod"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/leader-runtime.test.ts`
Expected: FAIL — `leaderSuppressionVars` is not exported from `../core/leader`.

- [ ] **Step 3: Implement the helper**

In `src/core/leader/runtime.ts`, add at the end of the file (after `getAllSublayerVars`):

```ts
export function leaderSuppressionVars(
  prefix: string,
  layers: SubLayerConfig[],
): string[] {
  return [`${prefix}_mod`, ...getAllSublayerVars(layers, prefix)];
}
```

(`SubLayerConfig` is already imported at the top of `runtime.ts`; no new import needed.)

- [ ] **Step 4: Re-export from the leader barrel**

In `src/core/leader/index.ts`, add a runtime re-export line so the file reads:

```ts
export { generateLayerRules } from './build';
export { leaderSuppressionVars } from './runtime';
export type {
    LayerMappingConfig, LayerRuleOptions, NestedLayerConfig,
    SubLayerConfig
} from './types';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test src/tests/leader-runtime.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/core/leader/runtime.ts src/core/leader/index.ts src/tests/leader-runtime.test.ts
git commit -m "feat(leader): add leaderSuppressionVars helper" -m "Single source of truth for a leader layer's suppression variable names (<prefix>_mod plus all sublayer vars)." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Make `generateTapHoldRules` leader-agnostic

**Files:**
- Modify: `src/engine/tap-hold-rules.ts`
- Test: `src/tests/tap-hold-rules.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `generateTapHoldRules(tapHoldKeys: Record<string, TapHoldConfig>, suppressionVars: string[] = []): any[]`. Empty `suppressionVars` → no `conditions` pushed on any manipulator. `src/index.ts` still compiles (it passes `undefined`, which hits the default).

- [ ] **Step 1: Write the failing tests**

Create `src/tests/tap-hold-rules.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { generateTapHoldRules } from "../engine";
import type { TapHoldConfig } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

const baseConfig: Record<string, TapHoldConfig> = {
  f: {
    alone: [{ type: "key", key: "f" }],
    hold: [{ type: "key", key: "f" }],
    description: "F tap-hold",
  },
};

test("tap-hold: injects variable_unless for each supplied suppression var", () => {
  const rules = generateTapHoldRules(baseConfig, [
    "leader_mod",
    "leader_d_sublayer",
  ]);
  const m = toRule(rules[0]).manipulators[0];
  const names = (m.conditions ?? [])
    .filter((c: any) => c.type === "variable_unless")
    .map((c: any) => c.name);
  assert.ok(names.includes("leader_mod"), "should suppress leader_mod");
  assert.ok(
    names.includes("leader_d_sublayer"),
    "should suppress leader_d_sublayer",
  );
});

test("tap-hold: empty suppression emits no variable_unless conditions", () => {
  const rules = generateTapHoldRules(baseConfig);
  const m = toRule(rules[0]).manipulators[0];
  const hasUnless = (m.conditions ?? []).some(
    (c: any) => c.type === "variable_unless",
  );
  assert.equal(hasUnless, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test src/tests/tap-hold-rules.test.ts`
Expected: FAIL — the current implementation unconditionally injects `space_mod`, so the negative test fails (it asserts no `variable_unless`, but `space_mod` is present), and the positive test fails (`leader_mod`/`leader_d_sublayer` are not injected because the old signature takes `SubLayerConfig[]`, not these strings).

- [ ] **Step 3: Update the implementation**

In `src/engine/tap-hold-rules.ts`:

**3a.** Delete these two imports (lines 3–4):

```ts
import { getAllSublayerVars } from "../core/leader/runtime";
import type { SubLayerConfig } from "../core/leader/types";
```

**3b.** Replace the signature and the derived-var lines (currently):

```ts
export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  spaceLayers?: SubLayerConfig[],
): any[] {
  const spaceModVar = "space_mod";
  const allSublayerVars = getAllSublayerVars(spaceLayers ?? [], "space");
```

with:

```ts
export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  suppressionVars: string[] = [],
): any[] {
```

**3c.** Replace the condition-injection block (currently):

```ts
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];

      m.conditions.push({
        type: "variable_unless",
        name: spaceModVar,
        value: 1,
      });

      allSublayerVars.forEach((sublayerVar) => {
        m.conditions.push({
          type: "variable_unless",
          name: sublayerVar,
          value: 1,
        });
      });
    });
```

with:

```ts
    if (suppressionVars.length > 0) {
      manipulators.forEach((m: any) => {
        m.conditions = m.conditions || [];
        suppressionVars.forEach((name) => {
          m.conditions.push({ type: "variable_unless", name, value: 1 });
        });
      });
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test src/tests/tap-hold-rules.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Verify typecheck + lint are clean**

Run: `npm run typecheck && npm run lint`
Expected: both succeed (no unused-import errors). Note: `npm test` will still show the pre-existing failures and the not-yet-updated `simultaneous.test.ts` (Task 3) — that is expected mid-plan; only confirm typecheck + lint here.

- [ ] **Step 6: Commit**

```bash
git add src/engine/tap-hold-rules.ts src/tests/tap-hold-rules.test.ts
git commit -m "refactor(engine): make generateTapHoldRules leader-agnostic" -m "Accept suppressionVars: string[] instead of SubLayerConfig[]; emit zero conditions when the list is empty." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Make `generateSimultaneousRules` leader-agnostic

**Files:**
- Modify: `src/engine/simultaneous-rules.ts`
- Modify: `src/tests/simultaneous.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `generateSimultaneousRules(mappings, suppressionVars: string[], tapHoldKeys)`. Internal helper renamed `injectSpaceLayerConditions` → `injectSuppressionConditions(manipulators, suppressionVars: string[])`. Empty list → no conditions.

- [ ] **Step 1: Update the test file (fixtures + rewritten test)**

In `src/tests/simultaneous.test.ts`:

**1a.** Delete the `SubLayerConfig` import on line 3 (it becomes unused after the rewrite):

```ts
import type { SubLayerConfig } from "../core/leader/types";
```

**1b.** Change the fixture definition on line 11 from:

```ts
const noLayers: SubLayerConfig[] = [];
```

to:

```ts
const noSuppression: string[] = [];
```

**1c.** Rename the fixture at every call site: replace every occurrence of the token `noLayers` with `noSuppression` (17 call sites). Use a project-wide replace within this file only.

**1d.** Replace the section header and the `space_mod` test (the `// ── Space-layer conditions ──` comment and the test that follows it):

```ts
// ── Space-layer conditions ─────────────────────────────────────────────────────

test("space-layer: variable_unless space_mod injected on all manipulators", () => {
  const spaceLayers: SubLayerConfig[] = [
    { layerKey: "d", layerName: "Downloads", mappings: {} },
  ];
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    spaceLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(
    m.conditions?.some(
      (c: any) => c.type === "variable_unless" && c.name === "space_mod",
    ),
    "should have space_mod variable_unless condition",
  );
});
```

with:

```ts
// ── Leader-suppression conditions ─────────────────────────────────────────────

test("suppression: variable_unless injected for each supplied var", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    ["leader_mod", "leader_d_sublayer"],
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  const names = (m.conditions ?? [])
    .filter((c: any) => c.type === "variable_unless")
    .map((c: any) => c.name);
  assert.ok(names.includes("leader_mod"), "should suppress leader_mod");
  assert.ok(
    names.includes("leader_d_sublayer"),
    "should suppress leader_d_sublayer",
  );
});

test("suppression: empty list emits no variable_unless conditions", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  const hasUnless = (m.conditions ?? []).some(
    (c: any) => c.type === "variable_unless",
  );
  assert.equal(hasUnless, false, "no suppression conditions when list is empty");
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx tsx --test src/tests/simultaneous.test.ts`
Expected: FAIL — type errors / wrong behavior because the implementation still takes `SubLayerConfig[]` and hardcodes `space_mod`.

- [ ] **Step 3: Update the implementation**

In `src/engine/simultaneous-rules.ts`:

**3a.** Delete these two imports (lines 5–6):

```ts
import { getAllSublayerVars } from "../core/leader/runtime";
import type { SubLayerConfig } from "../core/leader/types";
```

**3b.** Replace `injectSpaceLayerConditions` (currently):

```ts
function injectSpaceLayerConditions(
  manipulators: any[],
  spaceLayers: SubLayerConfig[],
): void {
  const spaceModVar = "space_mod";
  const allSublayerVars = getAllSublayerVars(spaceLayers, "space");

  manipulators.forEach((m: any) => {
    m.conditions = m.conditions ?? [];
    m.conditions.push({ type: "variable_unless", name: spaceModVar, value: 1 });
    allSublayerVars.forEach((v) => {
      m.conditions.push({ type: "variable_unless", name: v, value: 1 });
    });
  });
}
```

with:

```ts
function injectSuppressionConditions(
  manipulators: any[],
  suppressionVars: string[],
): void {
  if (suppressionVars.length === 0) return;

  manipulators.forEach((m: any) => {
    m.conditions = m.conditions ?? [];
    suppressionVars.forEach((name) => {
      m.conditions.push({ type: "variable_unless", name, value: 1 });
    });
  });
}
```

**3c.** Change the `generateSimultaneousRules` signature (currently):

```ts
export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  spaceLayers: SubLayerConfig[],
  tapHoldKeys: Record<string, TapHoldConfig>,
): any[] {
```

to:

```ts
export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  suppressionVars: string[],
  tapHoldKeys: Record<string, TapHoldConfig>,
): any[] {
```

**3d.** Change the call site (currently `injectSpaceLayerConditions(manipulators, spaceLayers);`) to:

```ts
    injectSuppressionConditions(manipulators, suppressionVars);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test src/tests/simultaneous.test.ts`
Expected: PASS (all tests in the file, including the two new suppression tests).

- [ ] **Step 5: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: both succeed. (Pre-existing unrelated failures in the full `npm test` are still present; that is fine here.)

- [ ] **Step 6: Commit**

```bash
git add src/engine/simultaneous-rules.ts src/tests/simultaneous.test.ts
git commit -m "refactor(engine): make generateSimultaneousRules leader-agnostic" -m "Accept suppressionVars: string[]; rename helper to injectSuppressionConditions; emit zero conditions when empty." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Generalize `generateEscapeRule`

**Files:**
- Modify: `src/engine/escape-rule.ts`
- Test: `src/tests/escape-rule.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `generateEscapeRule(suppressionVars: string[] = []): any[]`. Resets each name in `suppressionVars` to `0` on Escape, plus the unchanged baseline state vars and sticky modifiers.

- [ ] **Step 1: Write the failing tests**

Create `src/tests/escape-rule.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { generateEscapeRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

function setVars(rules: any[]): any[] {
  return toRule(rules[0]).manipulators[0].to
    .filter((e: any) => e.set_variable)
    .map((e: any) => e.set_variable);
}

test("escape rule: resets each supplied suppression var to 0", () => {
  const vars = setVars(generateEscapeRule(["leader_mod", "leader_d_sublayer"]));
  const names = vars.map((v: any) => v.name);
  assert.ok(names.includes("leader_mod"));
  assert.ok(names.includes("leader_d_sublayer"));
  vars.forEach((v: any) => assert.equal(v.value, 0));
});

test("escape rule: empty suppression still resets baseline state vars", () => {
  const names = setVars(generateEscapeRule()).map((v: any) => v.name);
  assert.ok(names.includes("caps_lock_pressed"));
  assert.ok(!names.includes("leader_mod"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test src/tests/escape-rule.test.ts`
Expected: FAIL — current signature requires a `SubLayerConfig[]` argument and resets `space_mod`, not the supplied var names.

- [ ] **Step 3: Rewrite the implementation**

Replace the entire contents of `src/engine/escape-rule.ts` with:

```ts
import { map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import { L } from '../core/mods';
import { formatRuleDescription } from "../core/rule-descriptions";

export function generateEscapeRule(suppressionVars: string[] = []): any[] {
  const otherVars = [
    'caps_lock_pressed',
    'command_q_pressed',
    'ctrl_opt_esc_first',
    'cmd_d_ready',
  ];

  return [
    rule(
      formatRuleDescription("escape", "Reset all variables", "tap"),
    ).manipulators([
      ...map("escape")
        .to([
          toKey("escape"),
          ...suppressionVars.map((v) => toSetVar(v, 0)),
          ...otherVars.map((v) => toSetVar(v, 0)),
          toStickyModifier(L.shift, "off"),
          toStickyModifier(L.opt, "off"),
          toStickyModifier(L.cmd, "off"),
          toStickyModifier(L.ctrl, "off"),
        ])
        .build(),
    ]),
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test src/tests/escape-rule.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/engine/escape-rule.ts src/tests/escape-rule.test.ts
git commit -m "refactor(engine): generalize generateEscapeRule" -m "Accept suppressionVars: string[] and reset those plus the baseline state vars; drop the hardcoded space_mod." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Generalize `emitLayerDefinitions`

**Files:**
- Modify: `src/engine/layer-emit.ts`
- Test: `src/tests/layer-emit.test.ts`

**Interfaces:**
- Consumes: `SubLayerConfig` (already imported), `HOME_DIR` (already imported).
- Produces: `emitLayerDefinitions(prefix: string, label: string, layers: SubLayerConfig[], outputPath?: string, debugMode = false): void`. All `"space"` literals (root key, layer IDs, default filename) become prefix-driven; the root label is the `label` argument.

- [ ] **Step 1: Write the failing test**

Create `src/tests/layer-emit.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { emitLayerDefinitions } from "../engine";
import type { SubLayerConfig } from "../core/leader";

const layers: SubLayerConfig[] = [
  {
    layerKey: "d",
    layerName: "Downloads",
    mappings: { q: { description: "Query", key: "q" } },
  },
];

test("layer-emit: writes prefix-keyed layer json to the given path", () => {
  const tmp = path.join(os.tmpdir(), `layer-emit-${process.pid}.json`);
  emitLayerDefinitions("leader", "L", layers, tmp, false);
  const written = JSON.parse(fs.readFileSync(tmp, "utf8"));
  assert.ok(written.leader, "root layer key uses the prefix");
  assert.ok(written.leader_d, "sublayer id is <prefix>_<KEY>");
  assert.equal(written.leader.label, "L");
  fs.unlinkSync(tmp);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/layer-emit.test.ts`
Expected: FAIL — current signature is `emitLayerDefinitions(spaceLayers, outputPath?, debugMode?)`; calling with `(prefix, label, layers, …)` does not match, and output is `space`-keyed.

- [ ] **Step 3: Rewrite the implementation**

Replace the entire contents of `src/engine/layer-emit.ts` with:

```ts
import fs from 'fs';
import path from 'path';
import type { SubLayerConfig } from '../core/leader/types';
import { HOME_DIR } from "../data";

function getDefaultOutputPaths(home: string, prefix: string): string[] {
  const filename = `${prefix}_layers.json`;
  const candidates = [
    path.join(home, `.config/hammerspoon/modules/karabiner_layer_gui/${filename}`),
    path.join(home, `.hammerspoon/karabiner_layer_gui/${filename}`),
  ];

  const existingDirCandidates = candidates.filter((candidate) =>
    fs.existsSync(path.dirname(candidate)),
  );

  if (existingDirCandidates.length > 0) {
    return existingDirCandidates;
  }

  return [candidates[0]];
}

export function emitLayerDefinitions(
  prefix: string,
  label: string,
  layers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false,
): void {
  try {
    const home = HOME_DIR;
    const outputPaths = outputPath ? [outputPath] : getDefaultOutputPaths(home, prefix);
    const finalPath = outputPaths[0];

    if (debugMode) {
      console.log(`[LayerEmit Debug] Starting emission to: ${outputPaths.join(', ')}`);
    }

    const layerMap: Record<string, any> = {};

    layerMap[prefix] = {
      label,
      keys: layers.map((layer) => ({
        key: layer.layerKey.toUpperCase(),
        desc: layer.layerName,
      })),
      widthHintPx: 235,
    };

    layers.forEach(({ layerKey, layerName, mappings, subLayers }) => {
      const layerId = `${prefix}_${layerKey.toUpperCase()}`;
      const keys = Object.entries(mappings).map(([key, config]) => ({
        key: key.toUpperCase(),
        desc: config.description,
      }));

      (subLayers || []).forEach((subLayer) => {
        keys.push({
          key: subLayer.layerKey.toUpperCase(),
          desc: subLayer.layerName,
        });
      });

      layerMap[layerId] = {
        label: layerKey.toUpperCase(),
        keys,
        widthHintPx: 235,
      };

      if (debugMode) {
        console.log(
          `[LayerEmit Debug] Emitted layer ${layerId} with ${keys.length} keys`,
        );
      }

      (subLayers || []).forEach((subLayer) => {
        const nestedId = `${prefix}_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}`;
        const nestedKeys = Object.entries(subLayer.mappings).map(([key, config]) => ({
          key: key.toUpperCase(),
          desc: config.description,
        }));

        layerMap[nestedId] = {
          label: `${layerKey.toUpperCase()}${subLayer.layerKey.toUpperCase()}`,
          keys: nestedKeys,
          widthHintPx: 235,
        };

        if (debugMode) {
          console.log(
            `[LayerEmit Debug] Emitted layer ${nestedId} with ${nestedKeys.length} keys`,
          );
        }
      });
    });

    const serialized = JSON.stringify(layerMap, null, 2);

    outputPaths.forEach((targetPath) => {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        if (debugMode) {
          console.log(`[LayerEmit Debug] Creating directory: ${dir}`);
        }
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(targetPath, serialized);

      console.log(
        `✓ Emitted ${Object.keys(layerMap).length} layer definitions to ${targetPath}`,
      );
    });

    if (debugMode) {
      console.log('[LayerEmit Debug] Emission complete. Layers:', Object.keys(layerMap));
    }
  } catch (error) {
    console.error('✗ Failed to emit layer definitions:', error);
    if (debugMode) {
      console.error('[LayerEmit Debug] Full error:', error);
    }
  }
}
```

(The local variable is renamed `layers` → `layerMap` only to avoid shadowing the new `layers` parameter; behavior is identical.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/tests/layer-emit.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/engine/layer-emit.ts src/tests/layer-emit.test.ts
git commit -m "refactor(engine): generalize emitLayerDefinitions" -m "Accept prefix + label; all space literals (root key, layer IDs, default filename) are now prefix-driven so the Hammerspoon indicator works for any leader." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Remove obsolete space layer data and its tests

**Files:**
- Delete: `src/definitions/space.ts`
- Delete: `src/data/space-layer.ts`
- Modify: `src/definitions/index.ts`
- Modify: `src/data/index.ts`
- Modify: `src/tests/mappings.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: removal of `spaceLayerDefinitions` and `SPACE_LAYER_*` from the codebase. No active importer remains after this task (`src/index.ts` already has its space import commented out).

- [ ] **Step 1: Drop the space-data import and tests from `mappings.test.ts`**

**1a.** Delete the import on line 23:

```ts
import { spaceLayerDefinitions } from "../definitions/space";
```

**1b.** Delete the two space-data tests. Remove this exact block (and its trailing blank line):

```ts
test("space layer definitions keep expected top-level layers", () => {
  const layerKeys = spaceLayerDefinitions.map((l) => l.layerKey);
  assert.deepEqual(layerKeys, ["a", "c", "d", "f", "r", "s", "w"]);
});

test("folders layer uses folder and raycast refs", () => {
  const folders = spaceLayerDefinitions.find((l) => l.layerKey === "f");
  assert.ok(folders);
  assert.equal(Object.keys(folders?.mappings ?? {}).length, 11);
  assert.deepEqual(folders?.mappings.r, {
    description: "Recent Folders",
    action: { type: "raycast", ref: "recentFolders" },
  });
  assert.deepEqual(folders?.mappings.s, {
    description: "Scripts",
    action: { type: "folder", ref: "scripts" },
  });
});

```

(The `vmCOC_+spacebar` assertions elsewhere in this file stay — that is a modified-spacebar tap-hold, unrelated to the leader.)

- [ ] **Step 2: Delete the space data files**

Run:

```bash
git rm src/definitions/space.ts src/data/space-layer.ts
```

- [ ] **Step 3: Remove the commented re-exports**

**3a.** In `src/definitions/index.ts`, delete the trailing two lines (the blank line and the comment):

```ts

// export { spaceLayerDefinitions } from "./space";
```

**3b.** In `src/data/index.ts`, delete the commented block:

```ts
// export {
//     SPACE_LAYER_DEBUG,
//     SPACE_LAYER_DEBUG_LOG_PATH,
//     SPACE_LAYER_INDICATOR_ROOT,
//     SPACE_LAYER_LABEL,
//     SPACE_LAYER_LEADER_KEY,
//     SPACE_LAYER_PREFIX
// } from "./space-layer";

```

- [ ] **Step 4: Verify typecheck + lint + the affected tests**

Run: `npm run typecheck && npm run lint && npx tsx --test src/tests/mappings.test.ts`
Expected: all succeed. No remaining import references `definitions/space` or `data/space-layer`.

- [ ] **Step 5: Commit**

```bash
git add src/definitions/index.ts src/data/index.ts src/tests/mappings.test.ts
git commit -m "refactor: remove obsolete space layer data and tests" -m "Delete definitions/space.ts and data/space-layer.ts; drop their (commented) re-exports and the two space-data tests in mappings.test.ts." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(`git rm` already staged the deletions; the `git add` stages the edits.)

---

### Task 7: Rewire orchestrator; stop emitting suppression; update integration tests

**Files:**
- Modify: `src/index.ts`
- Modify: `src/tests/integration.test.ts`
- Regenerate: `karabiner-output.json`

**Interfaces:**
- Consumes: Tasks 2–3 (the new `suppressionVars` signatures).
- Produces: a generated `karabiner-output.json` containing zero `space_` occurrences; integration tests that assert that negative.

- [ ] **Step 1: Rewire `src/index.ts`**

Make these exact edits (each is a find/replace):

**1a.** In the `./definitions` import block, delete the commented import line:

```ts
  //   spaceLayerDefinitions,
```

**1b.** Delete the commented leader assignment and its trailing blank line:

```ts
// const spaceLayers = spaceLayerDefinitions;

```

**1c.** Change the two generator calls from:

```ts
const tapHoldRules = generateTapHoldRules(tapHoldMappings, undefined);
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, undefined, tapHoldMappings);
```

to:

```ts
const tapHoldRules = generateTapHoldRules(tapHoldMappings);
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, [], tapHoldMappings);
```

**1d.** Delete the debug-mode block (3 lines):

```ts
// Emit layer definitions for Hammerspoon (enable debug mode via KARABINER_DEBUG env var)
const debugMode = process.env.KARABINER_DEBUG === "true";
// emitLayerDefinitions(spaceLayers, undefined, debugMode);
```

**1e.** Delete the commented `generateLayerRules` block inside the `rules` array (9 lines):

```ts
  // Generate space layer rules with sublayer persistence
  //   ...generateLayerRules(spaceLayers, {
  //     leaderKey: SPACE_LAYER_LEADER_KEY,
  //     layerPrefix: SPACE_LAYER_PREFIX,
  //     leaderLabel: SPACE_LAYER_LABEL,
  //     indicatorRootLayer: SPACE_LAYER_INDICATOR_ROOT,
  //     leaderHoldEvents: [toKey("c", ["left_command"], { repeat: false })],
  //     debugSwallowedKeys: SPACE_LAYER_DEBUG,
  //     debugLogPath: SPACE_LAYER_DEBUG_LOG_PATH,
  //   }),
```

**1f.** Delete the commented escape-rule lines:

```ts
  // Generate escape rule to reset all variables
  //   ...generateEscapeRule(spaceLayers),
```

**1g.** In the header doc comment, remove the Space Layer bullet and renumber. Change:

```ts
 * 1. Tap-Hold Keys: Single keys that perform different actions when tapped vs held
 * 2. Space Layer: Space bar as a layer key for accessing sublayers (Downloads, Apps, Folders)
 * 3. Caps Lock: Multiple modifier behaviors based on how it's pressed
 * 4. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
```

to:

```ts
 * 1. Tap-Hold Keys: Single keys that perform different actions when tapped vs held
 * 2. Caps Lock: Multiple modifier behaviors based on how it's pressed
 * 3. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
```

- [ ] **Step 2: Update `src/tests/integration.test.ts`**

**2a.** Replace the "critical variable names" test (the one that currently asserts `space_a_sublayer || space_mod`):

```ts
test("generated output validates against critical variable names", () => {
  const output = loadGeneratedOutput();
  const fullContent = JSON.stringify(output);

  // Check for expected variable references in layer/tap-hold rules
  assert.ok(
    fullContent.includes("space_a_sublayer") ||
      fullContent.includes("space_mod"),
    "Missing expected layer variable references"
  );
});
```

with the negative assertion:

```ts
test("generated output contains no leader-suppression pollution", () => {
  const output = loadGeneratedOutput();
  const fullContent = JSON.stringify(output);

  assert.ok(
    !fullContent.includes("space_"),
    "Output should contain no space_ leader variables when no leader is active"
  );
});
```

**2b.** Delete the two space-layer tests. Remove this entire block:

```ts
test("output contains space layer rules", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;
  const descriptions = rules.map((r: any) => r.ruleDescription || "");

  const spaceRules = descriptions.filter((d: string) => d.startsWith("[SPACE]+["));
  assert.ok(spaceRules.length > 0, "No SPACE+ layer rules found");
  assert.ok(
    spaceRules.some((d: string) => d.includes("Applications")),
    "Missing SPACE+A Applications layer"
  );
});

test("space layer activation copies current selection before enabling leader mode", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;
  const spaceRule = rules.find(
    (rule: any) =>
      rule.ruleDescription === "[SPACE]        →    SPACE layer (on hold)",
  );

  assert.ok(spaceRule, "Missing SPACE leader rule");

  const holdEvents = spaceRule.manipulatorSources[0]?.to_if_held_down;
  assert.ok(Array.isArray(holdEvents), "SPACE leader rule missing hold events");

  assert.ok(
    holdEvents.some(
      (event: any) =>
        event.key_code === "c" &&
        Array.isArray(event.modifiers) &&
        event.modifiers.includes("left_command"),
    ),
    "SPACE leader hold path should send Cmd-C before activating the layer",
  );
});
```

**2c.** Update the inline comment on line 31 from:

```ts
  // Sample critical rules: tap-hold, space layer, special rules
```

to:

```ts
  // Sample critical rules: tap-hold, special rules
```

- [ ] **Step 3: Regenerate the output**

Run: `npx tsx src/index.ts`
Expected: the script writes `karabiner-output.json` (and, on this macOS machine, updates the live Karabiner profile — that is this project's normal build behavior). Console ends with `✓ Wrote workspace copy: .../karabiner-output.json`.

- [ ] **Step 4: Verify the output is clean**

Run: `rg -c "space_" karabiner-output.json || echo "0 occurrences (clean)"`
Expected: `0 occurrences (clean)` — no matches. (Down from 61 `space_mod` conditions.)

- [ ] **Step 5: Run the full verification suite**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck + lint pass; `npm test` passes for **all leader-related tests**, including the new negative integration test. The only remaining failures are the **pre-existing, out-of-scope** ones noted below — confirm their names match and that no *new* failure appears:

- `mouse rules factory builds declarative per-device mappings` (mouse-button `[BACK]`/`[SHIFT]` description prefix — predates this work)
- `tap-hold mappings keep expected anchor keys` (a `vmCOC_+`/`right_option+s` key expectation — predates this work)

These are documented in the spec's *Out of Scope* section for future correction and are intentionally not addressed here.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/tests/integration.test.ts karabiner-output.json
git commit -m "refactor: stop emitting leader-suppression conditions when no leader is active" -m "Wire index.ts to pass [] so the engine emits zero suppression conditions; regenerate karabiner-output.json (61 dead space_mod conditions removed); repurpose the integration assertion to a negative check and drop the obsolete space-layer tests." -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Every section of the spec maps to a task — helper (Task 1), tap-hold (2), simultaneous (3), escape (4), layer-emit (5), removals (6), orchestrator + integration (7). Test changes for all three test files are in the tasks that need them.
- **Type consistency:** `suppressionVars: string[]` is used identically across `generateTapHoldRules`, `generateSimultaneousRules`, `generateEscapeRule`, and produced by `leaderSuppressionVars`. `injectSuppressionConditions` is the single renamed internal helper (no stale `injectSpaceLayerConditions` references).
- **No mid-plan compile breakage:** `src/index.ts` keeps compiling after Tasks 2–3 because it passes `undefined` (defaulted) until Task 7 changes it to `[]`/omitted. The only file that breaks on the Task 3 signature change is `simultaneous.test.ts`, which is updated in the same task.
- **Pre-existing failures are explicitly exempted** in Task 7 Step 5 so the engineer does not chase them.
