# Simultaneous Triggers Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a framework for defining Karabiner-Elements rules triggered by simultaneous key presses, supporting tap, hold, double-tap, and double-tap-hold behaviors with full `simultaneous_options` exposure.

**Architecture:** `src/core/simultaneous.ts` builds the Karabiner from-event and routes to existing `tapHoldFrom`/`varTapTapHoldFrom` core logic. `src/engine/simultaneous-rules.ts` exposes `SimultaneousConfig`, resolves `ActionSpec` → `ToEvent`, runs conflict validation, injects space-layer conditions, and wraps results in rules. The existing `karabiner.ts` library's `mapSimultaneous` builder is used for the tap-hold path; `varTapTapHoldFrom` (from `src/core/tap-hold.ts`) is used for the multi-tap path.

**Tech Stack:** TypeScript, karabiner.ts library (v1.36+), Node.js test runner via tsx.

> **Note on test execution:** The sandbox prevents `tsx --test` from running (requires a Unix socket). After writing tests in any task, verify with `npm run typecheck` in the agent. Ask the user to run `! npm test` in the terminal to confirm tests pass.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/core/rule-descriptions.ts` | Modify | Add `'simultaneous'` to `RuleTrigger` union |
| `src/core/simultaneous.ts` | Create | from-event construction, tap-hold and multi-tap core routes |
| `src/engine/simultaneous-rules.ts` | Create | Types, conflict validation, `generateSimultaneousRules` |
| `src/definitions/simultaneous.ts` | Create | Empty `simultaneousMappings` export for user to populate |
| `src/tests/simultaneous.test.ts` | Create | Full test suite |
| `src/engine/index.ts` | Modify | Re-export `simultaneous-rules` |
| `src/definitions/index.ts` | Modify | Export `simultaneousMappings` |
| `src/index.ts` | Modify | Import and wire `generateSimultaneousRules` |

---

## Task 0: Extend RuleTrigger for 'simultaneous'

**Files:**
- Modify: `src/core/rule-descriptions.ts`

- [ ] **Step 1: Add 'simultaneous' to RuleTrigger and triggerLabel**

In `src/core/rule-descriptions.ts`, make two changes:

```ts
// Line 1 — change the RuleTrigger type:
export type RuleTrigger = 'tap' | 'hold' | 'multi-tap' | 'simultaneous';
```

In the `triggerLabel` switch, add the new case before the closing brace:

```ts
    case 'simultaneous':
      return '(on simultaneous)';
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/rule-descriptions.ts
git commit -m "feat: add 'simultaneous' to RuleTrigger"
```

---

## Task 1: Scaffold types and empty exports

**Files:**
- Create: `src/engine/simultaneous-rules.ts`
- Create: `src/definitions/simultaneous.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/index.ts`

- [ ] **Step 1: Create `src/engine/simultaneous-rules.ts` with types and stub**

```ts
import { rule } from "karabiner.ts";
import type { SimultaneousOptions as KarSimultaneousOptions } from "karabiner.ts";
import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { getAllSublayerVars } from "../core/leader/runtime";
import type { SubLayerConfig } from "../core/leader/types";
import { resolveActionToEvents } from "./action-resolver";
import type { TapHoldConfig } from "./tap-hold-rules";

export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_when?: "any" | "all";
  to_after_key_up?: ActionSpec[];
};

export type SimultaneousConfig = {
  keys: string[];
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs?: number;
  simultaneousOptions?: SimultaneousOptions;
  simultaneousThresholdMs?: number;
};

export function generateSimultaneousRules(
  _mappings: Record<string, SimultaneousConfig>,
  _spaceLayers: SubLayerConfig[],
  _tapHoldKeys: Record<string, TapHoldConfig>,
): any[] {
  throw new Error("generateSimultaneousRules: not implemented");
}
```

- [ ] **Step 2: Create `src/definitions/simultaneous.ts`**

```ts
import type { SimultaneousConfig } from "../engine";

export const simultaneousMappings: Record<string, SimultaneousConfig> = {
  // Example (uncomment and modify to add a chord):
  // "jk": {
  //   keys: ["j", "k"],
  //   description: "J+K chord",
  //   alone: [{ type: "key", key: "escape" }],
  //   hold: [{ type: "app", ref: "finder" }],
  // },
};
```

- [ ] **Step 3: Add export to `src/engine/index.ts`**

Add this line at the end of `src/engine/index.ts`:

```ts
export * from "./simultaneous-rules";
```

- [ ] **Step 4: Add export to `src/definitions/index.ts`**

Add this line at the end of `src/definitions/index.ts`:

```ts
export { simultaneousMappings } from "./simultaneous";
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/engine/simultaneous-rules.ts src/definitions/simultaneous.ts src/engine/index.ts src/definitions/index.ts
git commit -m "feat: scaffold SimultaneousConfig types and empty exports"
```

---

## Task 2: Write failing tests

**Files:**
- Create: `src/tests/simultaneous.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { SubLayerConfig } from "../core/leader/types";
import { generateSimultaneousRules } from "../engine";
import type { SimultaneousConfig, TapHoldConfig } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

const noLayers: SubLayerConfig[] = [];
const noTapHold: Record<string, TapHoldConfig> = {};

// ── Tap-hold path ─────────────────────────────────────────────────────────────

test("tap-hold: from.simultaneous contains the chord keys", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(Array.isArray(m.from.simultaneous), "from.simultaneous should be an array");
  assert.deepEqual(
    m.from.simultaneous.map((e: any) => e.key_code),
    ["j", "k"],
  );
});

test("tap-hold: produces to_if_alone and to_if_held_down", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        hold: [{ type: "key", key: "f1" }],
      },
    },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(Array.isArray(m.to_if_alone) && m.to_if_alone.length > 0, "should have to_if_alone");
  assert.ok(Array.isArray(m.to_if_held_down) && m.to_if_held_down.length > 0, "should have to_if_held_down");
});

// ── Multi-tap path ─────────────────────────────────────────────────────────────

test("multi-tap: produces two manipulators", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noLayers,
    noTapHold,
  );
  const rule = toRule(rules[0]);
  assert.equal(rule.manipulators.length, 2);
});

test("multi-tap: second manipulator has sim_tap_{label} variable condition", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noLayers,
    noTapHold,
  );
  const secondManipulator = toRule(rules[0]).manipulators[0];
  assert.ok(
    secondManipulator?.conditions?.some((c: any) => c.name === "sim_tap_jk"),
    "Expected sim_tap_jk variable condition on second manipulator",
  );
});

test("multi-tap: chord from event appears on both manipulators", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noLayers,
    noTapHold,
  );
  const { manipulators } = toRule(rules[0]);
  for (const m of manipulators) {
    assert.ok(Array.isArray(m.from.simultaneous), "Both manipulators must have from.simultaneous");
  }
});

// ── simultaneous_options ───────────────────────────────────────────────────────

test("simultaneous_options: key_down_order is emitted when set", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousOptions: { key_down_order: "strict" },
      },
    },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.from.simultaneous_options?.key_down_order, "strict");
});

test("simultaneous_options: absent when config has none", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.from.simultaneous_options, undefined);
});

test("simultaneous_options: to_after_key_up is resolved and emitted", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousOptions: {
          to_after_key_up: [{ type: "key", key: "f2" }],
        },
      },
    },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(
    Array.isArray(m.from.simultaneous_options?.to_after_key_up) &&
      m.from.simultaneous_options.to_after_key_up.length > 0,
    "to_after_key_up should appear in from.simultaneous_options",
  );
});

// ── simultaneousThresholdMs ────────────────────────────────────────────────────

test("simultaneousThresholdMs: emitted as basic.simultaneous_threshold_milliseconds", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousThresholdMs: 100,
      },
    },
    noLayers,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.parameters?.["basic.simultaneous_threshold_milliseconds"], 100);
});

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

// ── Conflict check 1: duplicate chords ────────────────────────────────────────

test("conflict 1: throws on duplicate insensitive chords regardless of key order", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        {
          jk_a: { keys: ["j", "k"], description: "First", alone: [{ type: "key", key: "escape" }] },
          jk_b: { keys: ["k", "j"], description: "Second", alone: [{ type: "key", key: "f1" }] },
        },
        noLayers,
        noTapHold,
      ),
    /duplicate/i,
  );
});

test("conflict 1: strict-order [j,k] and [k,j] are NOT duplicates", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      {
        jk: {
          keys: ["j", "k"],
          description: "First",
          alone: [{ type: "key", key: "escape" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
        kj: {
          keys: ["k", "j"],
          description: "Second",
          alone: [{ type: "key", key: "f1" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
      },
      noLayers,
      noTapHold,
    ),
  );
});

test("conflict 1: same keys with different key_down_order are NOT duplicates", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      {
        jk_strict: {
          keys: ["j", "k"],
          description: "Strict",
          alone: [{ type: "key", key: "escape" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
        jk_insensitive: {
          keys: ["j", "k"],
          description: "Insensitive",
          alone: [{ type: "key", key: "f1" }],
        },
      },
      noLayers,
      noTapHold,
    ),
  );
});

// ── Conflict check 2: tap-hold key overlap ────────────────────────────────────

test("conflict 2: throws when a simultaneous key matches a bare tap-hold key", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
        noLayers,
        { j: { description: "J tap-hold", alone: [{ type: "key", key: "j" }] } } as any,
      ),
    /conflict/i,
  );
});

test("conflict 2: modifier-prefixed tap-hold key does NOT conflict", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
      noLayers,
      { "cmd+j": { description: "cmd+J", alone: [{ type: "key", key: "f1" }] } } as any,
    ),
  );
});

// ── Input validation ───────────────────────────────────────────────────────────

test("throws when tapTap and tapTapHold are both specified", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        {
          jk: {
            keys: ["j", "k"],
            description: "Bad",
            tapTap: [{ type: "key", key: "escape" }],
            tapTapHold: [{ type: "key", key: "f1" }],
            thresholdMs: 300,
          },
        },
        noLayers,
        noTapHold,
      ),
    /mutually exclusive/i,
  );
});

test("throws when keys has fewer than 2 entries", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { j: { keys: ["j"], description: "Single", alone: [{ type: "key", key: "escape" }] } },
        noLayers,
        noTapHold,
      ),
    /at least 2 keys/i,
  );
});

test("throws when no action fields are specified", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { jk: { keys: ["j", "k"], description: "No-op" } },
        noLayers,
        noTapHold,
      ),
    /no action/i,
  );
});
```

- [ ] **Step 2: Typecheck (tests should compile even though stub throws)**

```bash
npm run typecheck
```

Expected: no errors. (The `throw new Error("not implemented")` in the stub means tests compile but will fail at runtime.)

- [ ] **Step 3: Ask user to run tests to confirm they fail correctly**

Ask the user to run `! npm test` and confirm all tests in `simultaneous.test.ts` fail with "not implemented".

- [ ] **Step 4: Commit**

```bash
git add src/tests/simultaneous.test.ts
git commit -m "test: write failing tests for simultaneous triggers"
```

---

## Task 3: Implement `src/core/simultaneous.ts`

**Files:**
- Create: `src/core/simultaneous.ts`

This file provides two exported functions:
- `simultaneousTapHold` — for entries with only `alone`/`hold` (uses `mapSimultaneous` builder)
- `simultaneousMultiTap` — for entries with `tapTap`/`tapTapHold` (uses `varTapTapHoldFrom`)

- [ ] **Step 1: Create the file**

```ts
import {
  mapSimultaneous,
  type SimultaneousOptions as KarSimultaneousOptions,
  type ToEvent,
  type FromEvent,
} from "karabiner.ts";
import { varTapTapHoldFrom } from "./tap-hold";

// Internal: builds a raw FromEvent with from.simultaneous for the multi-tap path.
// (The tap-hold path uses mapSimultaneous directly, which handles this internally.)
function buildSimultaneousFromEvent(
  keys: string[],
  karOptions?: KarSimultaneousOptions,
): FromEvent {
  return {
    simultaneous: keys.map((k) => ({ key_code: k as any })),
    simultaneous_options: karOptions,
    modifiers: { optional: ["any"] },
  } as any;
}

export type SimultaneousTapHoldCoreOpts = {
  keys: string[];
  alone?: ToEvent[];
  hold?: ToEvent[];
  thresholdMs?: number;
  karOptions?: KarSimultaneousOptions;
  simultaneousThresholdMs?: number;
};

/** Tap-hold path: uses mapSimultaneous builder from karabiner.ts. */
export function simultaneousTapHold({
  keys,
  alone,
  hold,
  thresholdMs = 300,
  karOptions,
  simultaneousThresholdMs,
}: SimultaneousTapHoldCoreOpts): any[] {
  const builder = mapSimultaneous(
    keys as any[],
    karOptions,
    simultaneousThresholdMs,
  )
    .parameters({
      "basic.to_if_alone_timeout_milliseconds": thresholdMs,
      "basic.to_if_held_down_threshold_milliseconds": thresholdMs,
    })
    .modifiers({ optional: ["any"] });

  if (alone) alone.forEach((e) => builder.toIfAlone(e));
  if (hold) hold.forEach((e) => builder.toIfHeldDown(e));
  builder.toDelayedAction([], alone ?? []);

  return builder.build();
}

export type SimultaneousMultiTapCoreOpts = {
  keys: string[];
  label: string;
  alone?: ToEvent[];
  hold?: ToEvent[];
  tapTap?: ToEvent[];
  tapTapHold?: ToEvent[];
  thresholdMs?: number;
  karOptions?: KarSimultaneousOptions;
  simultaneousThresholdMs?: number;
};

/** Multi-tap path: uses varTapTapHoldFrom with a simultaneous from event. */
export function simultaneousMultiTap({
  keys,
  label,
  alone,
  hold,
  tapTap,
  tapTapHold,
  thresholdMs = 300,
  karOptions,
  simultaneousThresholdMs,
}: SimultaneousMultiTapCoreOpts): any[] {
  const from = buildSimultaneousFromEvent(keys, karOptions);
  const firstVar = `sim_tap_${label}`;

  const manipulators = varTapTapHoldFrom({
    from,
    firstVar,
    aloneEvents: alone,
    holdEvents: hold,
    tapTapEvents: tapTap,
    tapTapHoldEvents: tapTapHold,
    thresholdMs,
  });

  if (simultaneousThresholdMs !== undefined) {
    manipulators.forEach((m: any) => {
      m.parameters = {
        ...m.parameters,
        "basic.simultaneous_threshold_milliseconds": simultaneousThresholdMs,
      };
    });
  }

  return manipulators;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/simultaneous.ts
git commit -m "feat: add simultaneousTapHold and simultaneousMultiTap core functions"
```

---

## Task 4: Implement `generateSimultaneousRules` (routing + space-layer conditions)

**Files:**
- Modify: `src/engine/simultaneous-rules.ts`

Replace the stub body with the full implementation. The conflict validation is added in Task 5.

- [ ] **Step 1: Replace the stub in `src/engine/simultaneous-rules.ts`**

```ts
import { rule } from "karabiner.ts";
import type { SimultaneousOptions as KarSimultaneousOptions } from "karabiner.ts";
import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { getAllSublayerVars } from "../core/leader/runtime";
import type { SubLayerConfig } from "../core/leader/types";
import { simultaneousMultiTap, simultaneousTapHold } from "../core/simultaneous";
import { resolveActionToEvents } from "./action-resolver";
import type { TapHoldConfig } from "./tap-hold-rules";

export type SimultaneousOptions = {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_order?: "insensitive" | "strict" | "strict_inverse";
  key_up_when?: "any" | "all";
  to_after_key_up?: ActionSpec[];
};

export type SimultaneousConfig = {
  keys: string[];
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs?: number;
  simultaneousOptions?: SimultaneousOptions;
  simultaneousThresholdMs?: number;
};

function resolveKarOptions(
  simOpts: SimultaneousOptions | undefined,
): KarSimultaneousOptions | undefined {
  if (!simOpts) return undefined;
  const resolvedAfterKeyUp = simOpts.to_after_key_up?.flatMap(resolveActionToEvents);
  return {
    detect_key_down_uninterruptedly: simOpts.detect_key_down_uninterruptedly,
    key_down_order: simOpts.key_down_order,
    key_up_order: simOpts.key_up_order,
    key_up_when: simOpts.key_up_when,
    ...(resolvedAfterKeyUp?.length ? { to_after_key_up: resolvedAfterKeyUp } : {}),
  };
}

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

export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  spaceLayers: SubLayerConfig[],
  tapHoldKeys: Record<string, TapHoldConfig>,
): any[] {
  validateMappings(mappings, tapHoldKeys);

  return Object.entries(mappings).map(([label, config]) => {
    const karOptions = resolveKarOptions(config.simultaneousOptions);
    const alone = config.alone?.flatMap(resolveActionToEvents);
    const hold = config.hold?.flatMap(resolveActionToEvents);
    const tapTap = config.tapTap?.flatMap(resolveActionToEvents);
    const tapTapHold = config.tapTapHold?.flatMap(resolveActionToEvents);

    const isMultiTap = tapTap !== undefined || tapTapHold !== undefined;
    const manipulators: any[] = isMultiTap
      ? simultaneousMultiTap({
          keys: config.keys,
          label,
          alone,
          hold,
          tapTap,
          tapTapHold,
          thresholdMs: config.thresholdMs,
          karOptions,
          simultaneousThresholdMs: config.simultaneousThresholdMs,
        })
      : simultaneousTapHold({
          keys: config.keys,
          alone,
          hold,
          thresholdMs: config.thresholdMs,
          karOptions,
          simultaneousThresholdMs: config.simultaneousThresholdMs,
        });

    injectSpaceLayerConditions(manipulators, spaceLayers);

    return rule(
      formatRuleDescription(config.keys, config.description, "simultaneous"),
    ).manipulators(manipulators);
  });
}

// Stub — full implementation added in Task 5
function validateMappings(
  _mappings: Record<string, SimultaneousConfig>,
  _tapHoldKeys: Record<string, TapHoldConfig>,
): void {}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Ask user to run tests — most should now pass**

Ask the user to run `! npm test`. Expected: all tests except the conflict validation and input validation tests pass. (Those throw from `validateMappings` which is a stub.)

- [ ] **Step 4: Commit**

```bash
git add src/engine/simultaneous-rules.ts
git commit -m "feat: implement generateSimultaneousRules routing and space-layer conditions"
```

---

## Task 5: Implement conflict validation

**Files:**
- Modify: `src/engine/simultaneous-rules.ts`

Replace the `validateMappings` stub with the real implementation.

- [ ] **Step 1: Replace `validateMappings` in `src/engine/simultaneous-rules.ts`**

Remove the stub `function validateMappings(...)` and replace with:

```ts
function normalizedChordKey(keys: string[], keyDownOrder?: string): string {
  const sorted = keyDownOrder === "strict" || keyDownOrder === "strict_inverse"
    ? keys.join(",")
    : [...keys].sort().join(",");
  return `${sorted}__${keyDownOrder ?? "insensitive"}`;
}

function validateMappings(
  mappings: Record<string, SimultaneousConfig>,
  tapHoldKeys: Record<string, TapHoldConfig>,
): void {
  // Input validation
  for (const [label, config] of Object.entries(mappings)) {
    if (config.keys.length < 2) {
      throw new Error(
        `Simultaneous chord "${label}": requires at least 2 keys, got ${config.keys.length}.`,
      );
    }
    if (config.tapTap && config.tapTapHold) {
      throw new Error(
        `Simultaneous chord "${label}": tapTap and tapTapHold are mutually exclusive.`,
      );
    }
    if (!config.alone && !config.hold && !config.tapTap && !config.tapTapHold) {
      throw new Error(
        `Simultaneous chord "${label}": no action fields specified (alone, hold, tapTap, or tapTapHold). This would produce a no-op rule.`,
      );
    }
  }

  // Check 1: duplicate chords (order-aware)
  const seen = new Map<string, string>(); // normalizedKey → label
  for (const [label, config] of Object.entries(mappings)) {
    const key = normalizedChordKey(config.keys, config.simultaneousOptions?.key_down_order);
    if (seen.has(key)) {
      throw new Error(
        `Simultaneous chord "${label}" is a duplicate of "${seen.get(key)}" — same keys and key_down_order.`,
      );
    }
    seen.set(key, label);
  }

  // Check 2: tap-hold key overlap (bare keys only — no modifier prefix)
  const bareHoldKeys = new Set(
    Object.keys(tapHoldKeys).filter((k) => !k.includes("+")),
  );
  for (const [label, config] of Object.entries(mappings)) {
    for (const key of config.keys) {
      if (bareHoldKeys.has(key)) {
        throw new Error(
          `Simultaneous chord "${label}" conflict: key "${key}" is also defined as a bare tap-hold key. ` +
          `Add a modifier prefix to the tap-hold entry (e.g., "cmd+${key}") to resolve the ambiguity.`,
        );
      }
    }
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Ask user to run all tests**

Ask the user to run `! npm test`. Expected: all tests in `simultaneous.test.ts` pass.

- [ ] **Step 4: Commit**

```bash
git add src/engine/simultaneous-rules.ts
git commit -m "feat: add conflict validation to generateSimultaneousRules"
```

---

## Task 6: Wire into `src/index.ts`

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add import at top of `src/index.ts`**

In the import block that pulls from `"./definitions"`, add `simultaneousMappings`:

```ts
import {
  // ... existing imports ...
  simultaneousMappings,
  tapHoldMappings,
} from "./definitions";
```

Add to the import block from `"./engine"`:

```ts
import {
  // ... existing imports ...
  generateSimultaneousRules,
} from "./engine";
```

- [ ] **Step 2: Generate simultaneous rules and prepend them**

After the line `const tapHoldRules = generateTapHoldRules(tapHoldMappings, spaceLayers);`, add:

```ts
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, spaceLayers, tapHoldMappings);
```

- [ ] **Step 3: Prepend simultaneous rules to the rules array**

In the `let rules: any[] = [` block, add `...simultaneousRules,` as the first entry (before `...tapHoldRules`):

```ts
let rules: any[] = [
  // Simultaneous chord rules — must come before tap-hold rules
  ...simultaneousRules,

  // All tap-hold rules generated from configuration
  ...tapHoldRules,

  // ... rest unchanged ...
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire simultaneousRules into main config pipeline"
```

---

## Task 7: Full verification

**Files:** none changed

- [ ] **Step 1: Run full type check**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 2: Ask user to run full test suite**

Ask the user to run `! npm test`. Expected: all existing tests plus all new simultaneous tests pass; zero failures.

- [ ] **Step 3: Ask user to verify build succeeds**

Ask the user to run `! npm run build`. Expected: no TypeScript errors; Karabiner config is updated; Hammerspoon reloads.

- [ ] **Step 4: Commit if any final fixups were needed**

If any fixes were made in this task:

```bash
git add -p
git commit -m "fix: final integration fixups for simultaneous triggers"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec requirements mapped to tasks — `buildSimultaneousFromEvent` (Task 3), `simultaneousTapHold` (Task 3), `simultaneousMultiTap` (Task 3), `SimultaneousOptions`/`SimultaneousConfig` types (Task 1), `generateSimultaneousRules` (Tasks 4–5), conflict checks (Task 5), space-layer conditions (Task 4), test table (Task 2), wiring (Tasks 1 + 6).
- [x] **Placeholder scan:** No TBDs. All code blocks are complete.
- [x] **Type consistency:** `SimultaneousOptions` (engine type, ActionSpec[]) vs `KarSimultaneousOptions` (library type, ToEvent[]) named distinctly throughout. `simultaneousTapHold`/`simultaneousMultiTap` exported from `src/core/simultaneous.ts` and imported in `src/engine/simultaneous-rules.ts` with matching signatures.
- [x] **Variable name:** `sim_tap_${label}` used in `simultaneousMultiTap` and asserted in test (`sim_tap_jk`).
- [x] **Conflict messages:** "duplicate" regex in test matches "duplicate" in error; "conflict" matches "conflict"; "mutually exclusive" matches; "at least 2 keys" matches; "no action" matches.
