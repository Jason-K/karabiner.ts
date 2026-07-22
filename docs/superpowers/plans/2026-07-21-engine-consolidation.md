# Engine Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `src/engine/`'s duplicated rule generators with one standardized declarative schema (`Binding[]` → `defineBindings`) backed by a small set of builders, keeping keyboard output byte-identical to `karabiner-output.json` (one intentional normalization, §8.1) and proving it by migrating `home-end.ts`.

**Architecture:** A `Binding` is `{description, trigger, cases[]}` where each `Case` is `{tapCount, phase, conditions, do}`. `defineBindings` groups cases by `(tapCount, conditions)`, selects a builder (`remap` / `tapHold` / `multiTap`) by which phases/tapCounts are present, and routes to the *existing* core primitives (`map`, `tapHold`, `varTapTapHold`, `mapSimultaneous`) — so manipulator output is identical by construction. Each current generator becomes a thin adapter that translates its bespoke config into `Binding[]` and calls `defineBindings`. `modifierChord`, `guard`, and `reset` stay specialized.

**Tech Stack:** TypeScript, `karabiner.ts`, `node:test` (`tsx --test`), `tsx` to run `src/index.ts`.

## Global Constraints

- **Byte-identical gate:** after every generator change, `CI=true npx tsx src/index.ts` (regenerates `karabiner-output.json` *without* writing the live profile or reloading Hammerspoon), then `git diff --stat karabiner-output.json` must show **no changes** — except Task 9 (ctrl-escape loses its manipulator `description` key, the one intentional §8.1 normalization).
- **Never run `npm run build` during refactoring** — it writes the live Karabiner profile and reloads Hammerspoon. Use `CI=true npx tsx src/index.ts` for golden regeneration.
- **Generator signatures frozen:** every generator keeps its exported name, parameter signature, and config type (e.g. `TapHoldConfig`) so `definitions/*.ts` and `src/index.ts` are untouched until Task 13.
- **Keyboard-only:** no edits to `mouse-rules.ts`, `core/mouse.ts`, or any `data/mouse.ts` consumer.
- **No new dependencies.** TypeScript strict; `npm run lint` must stay `--max-warnings=0`.
- **Commit signing note:** this repo has `commit.gpgsign=true` (ssh key via agent). If signing hangs in the worker's environment, commit with `git -c commit.gpgsign=false commit …` and flag it.

**Spec:** `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md`

---

## File Structure

- **Create `src/engine/binding.ts`** — the standardized schema: `Phase`, `Condition`, `Trigger`, `Case`, `Binding` types + resolvers (`resolveCondition`, `triggerToFrom`) + `defineBindings` (the single entry point) and its private builder helpers (`buildRemap`, `buildTapHold`, `buildMultiTap`). One focused file; this is the new public surface every definition will eventually speak.
- **Modify `src/core/action-dsl.ts`** — add `{ type: "noop" }` to `ActionSpec`.
- **Modify `src/engine/action-resolver.ts`** — return `[]` for `noop` (so a `noop` case omits the `to` key).
- **Modify each keyboard generator** (`simple-rules`, `tap-hold-rules`, `tap-alone-hold-rules`, `multi-tap-rules`, `simultaneous-rules`, `launcher-rules`, `pointer-remap-rules`, `conditional-action-rules`, `conditional-tap-hold-rules`) — rewrite the *body* as an adapter over `defineBindings`; keep the exported signature.
- **Lightly modify** `double-tap-guard-rules`, `modifier-chord-rules`, `escape-rule` — adopt the shared `resolveCondition`/`resolveActions` helpers where it's a clean swap; they stay specialized.
- **Create `src/tests/binding.test.ts`** — unit tests for `defineBindings` (the engine core's TDD).
- **Modify `src/definitions/home-end.ts`** — the proof migration to `Binding[]`.
- **Modify `src/engine/index.ts`** — re-export `defineBindings` and the schema types.
- **Delete (Task 14)** `rule-factory-base.ts` / `variant-types.ts` if unused after adapters land.

---

## Task 1: Add the `noop` action

**Files:**
- Modify: `src/core/action-dsl.ts` (the `ActionSpec` union)
- Modify: `src/engine/action-resolver.ts:85` (`resolveActionToEvents` switch)
- Test: `src/tests/rules-factories.test.ts` (add a case)

**Interfaces:**
- Produces: `{ type: "noop" }` member of `ActionSpec`; `resolveActionToEvents({type:"noop"})` returns `[]`.

- [ ] **Step 1: Write the failing test**

Append to `src/tests/rules-factories.test.ts`:
```ts
test("resolveActionToEvents returns no events for noop", () => {
  assert.deepEqual(resolveActionToEvents({ type: "noop" } as any), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test src/tests/rules-factories.test.ts`
Expected: FAIL — `noop` is not assignable to `ActionSpec` / resolves to default shell path.

- [ ] **Step 3: Add the `noop` variant to `ActionSpec`**

In `src/core/action-dsl.ts`, add this arm to the `ActionSpec` union (before the `sequence` arm):
```ts
  | { type: "noop" }
```

- [ ] **Step 4: Handle `noop` in the resolver**

In `src/engine/action-resolver.ts`, as the first case inside `resolveActionToEvents`'s `switch`:
```ts
export function resolveActionToEvents(action: ActionSpec): ToEvent[] {
  switch (action.type) {
    case "noop":
      return [];
    case "app": {
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx --test src/tests/rules-factories.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/action-dsl.ts src/engine/action-resolver.ts src/tests/rules-factories.test.ts
git commit -m "feat(action-dsl): add noop action that emits no to-events"
```

---

## Task 2: Standardized schema types

**Files:**
- Create: `src/engine/binding.ts` (types only this task — logic in later tasks)
- Modify: `src/engine/index.ts` (re-export)

**Interfaces:**
- Produces: exported types `Phase`, `Condition`, `SimOrder`, `Trigger`, `Case`, `Binding` (defined below). No runtime code yet.

- [ ] **Step 1: Create `src/engine/binding.ts` with the types**

```ts
import type { ActionSpec } from "../core/action-dsl";

/** When in the key lifecycle the case's action fires. Maps to a Karabiner output channel. */
export type Phase = "press" | "release" | "hold";
// press      -> to
// release    -> to_if_alone   (tap: release within aloneMs, uninterrupted)
// hold       -> to_if_held_down

/** External state condition. Realized as a Karabiner `conditions[]` entry. */
export type Condition =
  | { app: string | string[]; unless?: boolean }
  | { var: string; equals: string | number; unless?: boolean }
  | { device: string; unless?: boolean }; // reserved for the later mouse round

export type SimOrder = {
  down?: "insensitive" | "strict" | "strict_inverse";
  up?: "insensitive" | "strict" | "strict_inverse";
  upWhen?: "any" | "all";
  detectUninterrupted?: boolean;
};

/** What was pressed. 1 key = single; 2+ keys = simultaneous chord. */
export type Trigger =
  | { keys: string[]; modifiers?: string[]; order?: SimOrder }
  | { pointer: string; modifiers?: string[] };

/** One (state + timing) -> action pairing. */
export type Case = {
  tapCount?: number; // default 1; 2 = double-tap, etc. (framework-managed state)
  phase?: Phase; // default "press"
  conditions?: Condition[];
  do: ActionSpec[]; // { type: "noop" } = swallow (omits `to`)
};

/** One binding = one description = one Karabiner rule. */
export type Binding = {
  description: string;
  trigger: Trigger;
  timing?: {
    aloneMs?: number;
    heldThresholdMs?: number;
    delayedMs?: number;
    simultaneousMs?: number;
  };
  conditions?: Condition[]; // hoisted — applied to every case
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: { allowPassThrough?: boolean; mods?: string[] };
  afterKeyUp?: ActionSpec[];
};
```

- [ ] **Step 2: Re-export from the engine barrel**

In `src/engine/index.ts`, add (alphabetized):
```ts
export * from "./binding";
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (types only, no runtime).

- [ ] **Step 4: Commit**

```bash
git add src/engine/binding.ts src/engine/index.ts
git commit -m "feat(engine): add standardized Binding schema types"
```

---

## Task 3: Condition + Trigger resolvers

**Files:**
- Modify: `src/engine/binding.ts` (append resolvers)
- Test: `src/tests/binding.test.ts` (create)

**Interfaces:**
- Produces: `resolveCondition(c: Condition): unknown` (a Karabiner condition object) and `triggerToFrom(t: Trigger): FromEvent`.
- Consumes: `ifApp` from `karabiner.ts`.

- [ ] **Step 1: Write the failing tests**

Create `src/tests/binding.test.ts`:
```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolveCondition, triggerToFrom } from "../engine/binding";

test("resolveCondition app if -> frontmost_application_if", () => {
  const c = resolveCondition({ app: "com.microsoft.Excel" }) as any;
  assert.equal(c.type, "frontmost_application_if");
  assert.deepEqual(c.bundle_identifiers, ["com.microsoft.Excel"]);
});

test("resolveCondition app unless -> frontmost_application_unless", () => {
  const c = resolveCondition({ app: ["a", "b"], unless: true }) as any;
  assert.equal(c.type, "frontmost_application_unless");
  assert.deepEqual(c.bundle_identifiers, ["a", "b"]);
});

test("resolveCondition var if/unless -> variable_if/unless", () => {
  assert.deepEqual(
    resolveCondition({ var: "x", equals: 1 }) as any,
    { type: "variable_if", name: "x", value: 1 },
  );
  assert.deepEqual(
    resolveCondition({ var: "x", equals: 1, unless: true }) as any,
    { type: "variable_unless", name: "x", value: 1 },
  );
});

test("triggerToFrom single key with modifiers", () => {
  assert.deepEqual(
    triggerToFrom({ keys: ["a"], modifiers: ["left_command"] }) as any,
    { key_code: "a", modifiers: { mandatory: ["left_command"] } },
  );
});

test("triggerToFrom simultaneous chord", () => {
  const from = triggerToFrom({ keys: ["j", "k"] }) as any;
  assert.deepEqual(from.simultaneous, [{ key_code: "j" }, { key_code: "k" }]);
  assert.deepEqual(from.modifiers, { optional: ["any"] });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — `resolveCondition` / `triggerToFrom` not exported.

- [ ] **Step 3: Implement the resolvers**

Append to `src/engine/binding.ts` (and add imports at top):
```ts
import { ifApp, type FromEvent, type SimultaneousOptions } from "karabiner.ts";

export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const ids = Array.isArray(c.app) ? c.app : [c.app];
    return c.unless ? ifApp(ids).unless().build() : ifApp(ids).build();
  }
  if ("var" in c) {
    return {
      type: c.unless ? "variable_unless" : "variable_if",
      name: c.var,
      value: c.equals,
    };
  }
  // device — reserved for the mouse round
  throw new Error("device conditions are not supported yet (mouse is out of scope)");
}

function resolveSimOrder(order?: SimOrder): SimultaneousOptions | undefined {
  if (!order) return undefined;
  const o: Record<string, unknown> = {};
  if (order.down) o.key_down_order = order.down;
  if (order.up) o.key_up_order = order.up;
  if (order.upWhen) o.key_up_when = order.upWhen;
  if (order.detectUninterrupted) o.detect_key_down_uninterruptedly = order.detectUninterrupted;
  return Object.keys(o).length ? (o as SimultaneousOptions) : undefined;
}

export function triggerToFrom(trigger: Trigger): FromEvent {
  if ("pointer" in trigger) {
    const from: Record<string, unknown> = { pointing_button: trigger.pointer };
    if (trigger.modifiers?.length) from.modifiers = { mandatory: trigger.modifiers };
    return from as FromEvent;
  }
  if (trigger.keys.length > 1) {
    return {
      simultaneous: trigger.keys.map((k) => ({ key_code: k })),
      simultaneous_options: resolveSimOrder(trigger.order),
      modifiers: { optional: ["any"] },
    } as unknown as FromEvent;
  }
  const from: Record<string, unknown> = { key_code: trigger.keys[0] };
  if (trigger.modifiers?.length) from.modifiers = { mandatory: trigger.modifiers };
  return from as FromEvent;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): add Condition + Trigger resolvers"
```

---

## Task 4: `defineBindings` — the remap arm (press-only)

**Files:**
- Modify: `src/engine/binding.ts` (append `defineBindings` + `buildRemap`)
- Test: `src/tests/binding.test.ts` (append)

**Interfaces:**
- Produces: `defineBindings(bindings: Binding[]): Rule[]`. This task handles only press-phase cases (the `remap` arm). Each condition-group of press cases becomes one `map(from).condition(...).to(...)` manipulator.
- Consumes: `map`, `rule` from `karabiner.ts`; `resolveActionToEvents` from `./action-resolver`.

- [ ] **Step 1: Write the failing test**

Append to `src/tests/binding.test.ts`:
```ts
import { defineBindings } from "../engine/binding";

test("defineBindings remap: one press case -> single manipulator with to", () => {
  const rules = defineBindings([
    {
      description: "[HOME]        →    Move to line start (on tap)",
      trigger: { keys: ["home"] },
      cases: [
        {
          phase: "press",
          do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
        },
      ],
    },
  ]);
  assert.equal(rules.length, 1);
  const built = (rules[0] as any).build ? (rules[0] as any).build() : rules[0];
  assert.equal(built.ruleDescription, "[HOME]        →    Move to line start (on tap)");
  const m = built.manipulatorSources[0];
  assert.deepEqual(m.from, { key_code: "home" });
  assert.deepEqual(m.to, [{ key_code: "left_arrow", modifiers: ["left_command"] }]);
});

test("defineBindings remap: noop case -> manipulator with no `to` key", () => {
  const rules = defineBindings([
    {
      description: "swallow",
      trigger: { keys: ["h"], modifiers: ["left_command"] },
      cases: [{ phase: "press", do: [{ type: "noop" }] }],
    },
  ]);
  const built = (rules[0] as any).build ? (rules[0] as any).build() : rules[0];
  const m = built.manipulatorSources[0];
  assert.equal("to" in m, false, "noop must omit the `to` key");
});

test("defineBindings remap: two press cases with different conditions -> two manipulators", () => {
  const rules = defineBindings([
    {
      description: "conditional",
      trigger: { keys: ["x"] },
      cases: [
        { phase: "press", conditions: [{ app: "com.a" }], do: [{ type: "key", key: "1" }] },
        { phase: "press", conditions: [{ app: "com.b" }], do: [{ type: "key", key: "2" }] },
      ],
    },
  ]);
  const built = (rules[0] as any).build ? (rules[0] as any).build() : rules[0];
  assert.equal(built.manipulatorSources.length, 2);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — `defineBindings` not exported.

- [ ] **Step 3: Implement `defineBindings` + the remap arm**

Append to `src/engine/binding.ts`:
```ts
import { map, rule, type Manipulator, type Rule, type ToEvent } from "karabiner.ts";
import { resolveActionToEvents } from "./action-resolver";

type ResolvedCase = {
  tapCount: number;
  phase: Phase;
  conditions: unknown[];
  do: ToEvent[];
};

function resolveCases(cases: Case[], shared: Condition[] | undefined): ResolvedCase[] {
  return cases.map((c) => ({
    tapCount: c.tapCount ?? 1,
    phase: c.phase ?? "press",
    conditions: [...(shared ?? []), ...(c.conditions ?? [])].map(resolveCondition),
    do: (c.do ?? []).flatMap(resolveActionToEvents),
  }));
}

/** Group cases that share the same condition signature into one manipulator. */
function groupByConditions(cases: ResolvedCase[]) {
  const groups = new Map<
    string,
    { conditions: unknown[]; pressDo: ToEvent[]; releaseDo: ToEvent[]; holdDo: ToEvent[] }
  >();
  for (const c of cases) {
    const key = JSON.stringify(c.conditions);
    if (!groups.has(key)) {
      groups.set(key, { conditions: c.conditions, pressDo: [], releaseDo: [], holdDo: [] });
    }
    const g = groups.get(key)!;
    if (c.phase === "press") g.pressDo.push(...c.do);
    if (c.phase === "release") g.releaseDo.push(...c.do);
    if (c.phase === "hold") g.holdDo.push(...c.do);
  }
  return [...groups.values()];
}

export function defineBindings(bindings: Binding[]): Rule[] {
  return bindings.map((b) => rule(b.description).manipulators(buildManipulators(b)) as Rule);
}

function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2);
  if (hasMultiTap) {
    throw new Error("multiTap arm not implemented until Task 6");
  }
  const isPointer = "pointer" in b.trigger;
  return groupByConditions(resolved).flatMap((g) => buildRemap(b, g, isPointer));
}

function buildRemap(
  b: Binding,
  g: { conditions: unknown[]; pressDo: ToEvent[] },
  isPointer: boolean,
): Manipulator | Manipulator[] {
  const builder = isPointer
    ? map({ pointing_button: (b.trigger as { pointer: string }).pointer })
    : map(triggerToFrom(b.trigger));
  for (const cond of g.conditions) builder.condition(cond as any);
  // pressDo may be empty (noop) -> omit `to` (swallow). map().build() already omits empty `to`.
  for (const e of g.pressDo) builder.to(e);
  return builder.build();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): defineBindings remap arm (press-only cases)"
```

---

## Task 5: `defineBindings` — the tapHold arm (release/hold)

**Files:**
- Modify: `src/engine/binding.ts`
- Test: `src/tests/binding.test.ts`

**Interfaces:**
- Produces: tapHold handling inside `buildManipulators`. When a condition-group has `release`/`hold` phases (no multi-tap), it builds one tap-hold manipulator via `core/tap-hold.ts`'s `tapHold({key, alone, hold, timeoutMs, thresholdMs})`, attaches the group's conditions, and — for single-key triggers — injects `from.modifiers.mandatory` exactly like today's `tap-hold-rules`.
- Consumes: `tapHold` from `../core/tap-hold`; default-alone pass-through = the trigger key with `halt:true`.

- [ ] **Step 1: Write the failing test**

Append to `src/tests/binding.test.ts`:
```ts
test("defineBindings tapHold: hold case -> to_if_held_down + default-alone pass-through", () => {
  const rules = defineBindings([
    {
      description: "[A]        →    X (on hold)",
      trigger: { keys: ["a"] },
      timing: { aloneMs: 400, heldThresholdMs: 400 },
      cases: [{ phase: "hold", do: [{ type: "key", key: "f18", modifiers: ["vmCOC_"], options: { repeat: false } }] }],
    },
  ]);
  const built = (rules[0] as any).build ? (rules[0] as any).build() : rules[0];
  const m = built.manipulatorSources[0];
  // default-alone pass-through: the key itself with halt:true
  assert.deepEqual(m.to_if_alone, [{ halt: true, key_code: "a" }]);
  assert.deepEqual(m.to_if_held_down, [
    { repeat: false, key_code: "f18", modifiers: ["left_command", "left_option", "left_control"] },
  ]);
  assert.deepEqual(m.to_delayed_action, { to_if_invoked: [], to_if_canceled: [{ halt: true, key_code: "a" }] });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — hold case currently routes to `buildRemap` (produces `to`, not `to_if_held_down`).

- [ ] **Step 3: Add the tapHold arm**

Add imports and modify `buildManipulators` in `src/engine/binding.ts`:
```ts
import { tapHold } from "../core/tap-hold";
import { resolveModComboAlias } from "../data/key-aliases";
import type { ActionSpec } from "../core/action-dsl";
```
Replace the body of `buildManipulators` (after the `hasMultiTap` guard) so groups with release/hold go to a new `buildTapHold`:
```ts
function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2);
  if (hasMultiTap) {
    throw new Error("multiTap arm not implemented until Task 6");
  }
  return groupByConditions(resolved).flatMap((g) =>
    g.releaseDo.length || g.holdDo.length ? buildTapHold(b, g) : buildRemap(b, g, "pointer" in b.trigger),
  );
}

function buildTapHold(
  b: Binding,
  g: { conditions: unknown[]; releaseDo: ToEvent[]; holdDo: ToEvent[] },
): Manipulator | Manipulator[] {
  if ("pointer" in b.trigger) {
    throw new Error("tapHold pointer triggers are not supported (mouse is out of scope)");
  }
  const keys = (b.trigger as { keys: string[] }).keys;
  const key = keys[0]!;
  const mods = (b.trigger as { modifiers?: string[] }).modifiers ?? [];
  const defaultAlone: ActionSpec[] = [
    { type: "key", key, modifiers: mods as ActionSpec["modifiers"], options: { halt: true } },
  ];
  const alone = g.releaseDo.length ? g.releaseDo : defaultAlone.flatMap((a) => resolveActionToEvents(a));
  const hold = g.holdDo;
  const manipulators = tapHold({
    key,
    alone,
    hold,
    timeoutMs: b.timing?.aloneMs,
    thresholdMs: b.timing?.heldThresholdMs,
  }).build();
  // Inject mandatory from-modifiers exactly like tap-hold-rules (vm alias -> resolved mods)
  if (mods.length) {
    const mandatory = mods.flatMap((m) => resolveModComboAlias(m) ?? [m]);
    manipulators.forEach((m: any) => {
      m.from.modifiers = m.from.modifiers || {};
      m.from.modifiers.mandatory = mandatory;
    });
  }
  g.conditions.forEach((cond) =>
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];
      m.conditions.push(cond);
    }),
  );
  return manipulators;
}
```
Update `buildRemap`'s call site is already handled by the ternary above.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): defineBindings tapHold arm (release/hold + default alone)"
```

---

## Task 6: `defineBindings` — multiTap + simultaneous arms

**Files:**
- Modify: `src/engine/binding.ts`
- Test: `src/tests/binding.test.ts`

**Interfaces:**
- Produces: when any case has `tapCount >= 2`, `buildMultiTap` constructs a `varTapTapHold` call (single-key) or `simultaneousMultiTap` (chord) carrying tap/hold/tapTap/tapTapHold from the binding's cases; `firstTapPendingVar` is framework-generated (`multi_tap_${key}` / `sim_tap_${label}`). When the trigger is simultaneous *without* multi-tap, the tapHold/remap arms must route via `simultaneousTapHold`/`mapSimultaneous` instead of `map`/`tapHold`.
- Consumes: `varTapTapHold` from `../core/tap-hold`; `simultaneousTapHold`, `simultaneousMultiTap` from `../core/simultaneous`.

- [ ] **Step 1: Write the failing test**

Append to `src/tests/binding.test.ts`:
```ts
test("defineBindings multiTap: escape tap/hold/doubleTapHold -> 2 var-dance manipulators", () => {
  const rules = defineBindings([
    {
      description: "[␛]        →    Escape / Kill app (on multi-tap)",
      trigger: { keys: ["escape"] },
      timing: { aloneMs: 400, heldThresholdMs: 400 },
      cases: [
        { phase: "release", do: [{ type: "key", key: "escape" }] },
        { phase: "hold", do: [{ type: "shell", command: "kill fg" }] },
        { tapCount: 2, phase: "hold", do: [{ type: "shell", command: "kill all" }] },
      ],
    },
  ]);
  const built = (rules[0] as any).build ? (rules[0] as any).build() : rules[0];
  // varTapTapHold emits [secondTap, firstTap]
  assert.equal(built.manipulatorSources.length, 2);
  const first = built.manipulatorSources.find((m: any) => m.to_if_alone?.some((e: any) => e.key_code === "escape"));
  assert.ok(first, "first tap carries the escape alone action");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — `buildManipulators` throws "multiTap arm not implemented".

- [ ] **Step 3: Implement the multiTap arm**

Add imports and replace the `hasMultiTap` throw in `buildManipulators` in `src/engine/binding.ts`:
```ts
import { varTapTapHold } from "../core/tap-hold";
import { simultaneousMultiTap, simultaneousTapHold } from "../core/simultaneous";
```
```ts
function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  const hasMultiTap = resolved.some((c) => c.tapCount >= 2);
  const isSim = "keys" in b.trigger && b.trigger.keys.length > 1;
  if (hasMultiTap) return buildMultiTap(b, resolved, isSim);
  if (isSim) return buildSimultaneousTapHold(b, resolved);
  return groupByConditions(resolved).flatMap((g) =>
    g.releaseDo.length || g.holdDo.length ? buildTapHold(b, g) : buildRemap(b, g, false),
  );
}

function buildMultiTap(b: Binding, cases: ResolvedCase[], isSim: boolean): Manipulator[] {
  const key = isSim ? "" : (b.trigger as { keys: string[] }).keys[0]!;
  const byPhase = (p: Phase, tapCount = 1) =>
    cases.filter((c) => c.tapCount === tapCount && c.phase === p).flatMap((c) => c.do);
  const threshold = b.timing?.aloneMs ?? b.timing?.heldThresholdMs;
  if (isSim) {
    const keys = (b.trigger as { keys: string[] }).keys;
    const label = keys.join("");
    return simultaneousMultiTap({
      keys,
      label,
      alone: byPhase("release"),
      hold: byPhase("hold"),
      tapTap: cases.filter((c) => c.tapCount === 2 && c.phase === "release").flatMap((c) => c.do),
      tapTapHold: cases.filter((c) => c.tapCount === 2 && c.phase === "hold").flatMap((c) => c.do),
      thresholdMs: threshold,
      simultaneousThresholdMs: b.timing?.simultaneousMs,
    });
  }
  const manipulators = varTapTapHold({
    key,
    firstTapPendingVar: `multi_tap_${key}`,
    immediateSingleTapEvents: byPhase("release"),
    holdEvents: byPhase("hold"),
    doubleTapEvents: cases.filter((c) => c.tapCount === 2 && c.phase === "release").flatMap((c) => c.do),
    doubleTapHoldEvents: cases.filter((c) => c.tapCount === 2 && c.phase === "hold").flatMap((c) => c.do),
    thresholdMs: threshold,
    allowPassThrough: b.multiTap?.allowPassThrough,
    mods: b.multiTap?.mods as any,
  });
  // attach hoisted/case conditions (multi-tap bindings are normally unconditional)
  const conds = cases.flatMap((c) => c.conditions);
  if (conds.length) {
    manipulators.forEach((m: any) => {
      m.conditions = m.conditions || [];
      m.conditions.push(...conds);
    });
  }
  return manipulators;
}

function buildSimultaneousTapHold(b: Binding, cases: ResolvedCase[]): Manipulator[] {
  const keys = (b.trigger as { keys: string[] }).keys;
  const byPhase = (p: Phase) => cases.filter((c) => c.phase === p).flatMap((c) => c.do);
  const manipulators = simultaneousTapHold({
    keys,
    alone: byPhase("release"),
    hold: byPhase("hold"),
    thresholdMs: b.timing?.aloneMs,
    simultaneousThresholdMs: b.timing?.simultaneousMs,
  });
  return manipulators;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS (fix any unused-import warnings).

- [ ] **Step 6: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): defineBindings multiTap + simultaneous arms"
```

---

## Task 7: Adapter — `simple-rules` (the pattern-establishing conversion)

**Files:**
- Modify: `src/engine/simple-rules.ts` (rewrite bodies; keep `SimpleRemapMapping`, `DisabledShortcutMapping`, `AppScopedRemapMapping`, and all three `generate*` export signatures)

**Interfaces:**
- Consumes: `defineBindings`, `Binding`, `Case` from `./binding`.

- [ ] **Step 1: Rewrite `simple-rules.ts` as adapters**

Replace the file contents:
```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type SimpleRemapMapping = {
  from: { key: string; modifiers?: ModKey[] };
  description: string;
  to: { key: string; modifiers?: ModKey[] };
};

export type DisabledShortcutMapping = {
  key: string;
  modifiers: ModKey[];
  description: string;
};

export type AppScopedRemapMapping = {
  from: { key: string; modifiers?: ModKey[] };
  description: string;
  to: { key: string; modifiers?: ModKey[] };
  ifApp?: string | string[];
};

const tapDesc = (chord: string[], description: string) =>
  formatRuleDescription(chord, description, "tap");

export function generateSimpleRemapRules(mappings: ReadonlyArray<SimpleRemapMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...(m.from.modifiers ?? []), m.from.key], m.description),
      trigger: { keys: [m.from.key], modifiers: m.from.modifiers as string[] | undefined },
      cases: [{ phase: "press", do: [{ type: "key", key: m.to.key, modifiers: m.to.modifiers as any }] }],
    })),
  );
}

export function generateDisabledShortcutRules(mappings: ReadonlyArray<DisabledShortcutMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...m.modifiers, m.key], m.description),
      trigger: { keys: [m.key], modifiers: m.modifiers as string[] },
      cases: [{ phase: "press", do: [{ type: "noop" }] }],
    })),
  );
}

export function generateAppScopedRemapRules(mappings: ReadonlyArray<AppScopedRemapMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: tapDesc([...(m.from.modifiers ?? []), m.from.key], m.description),
      trigger: { keys: [m.from.key], modifiers: m.from.modifiers as string[] | undefined },
      ...(m.ifApp ? { conditions: [{ app: m.ifApp }] } : {}),
      cases: [{ phase: "press", do: [{ type: "key", key: m.to.key, modifiers: m.to.modifiers as any }] }],
    })),
  );
}
```

- [ ] **Step 2: Regenerate the golden file (no profile side effects)**

Run: `CI=true npx tsx src/index.ts`
Expected: prints "✓ Wrote workspace copy: …/karabiner-output.json".

- [ ] **Step 3: Verify byte-identical output**

Run: `git diff --stat karabiner-output.json`
Expected: **empty** (no output). If non-empty, the `buildRemap` key-order differs from the old `map().to()` — fix `buildRemap` in `binding.ts` and re-run Step 2 until empty.

- [ ] **Step 4: Run the existing test suite**

Run: `npm test`
Expected: PASS (incl. `generateAppScopedRemapRules attaches ifApp condition…`).

- [ ] **Step 5: Commit**

```bash
git add src/engine/simple-rules.ts karabiner-output.json
git commit -m "refactor(engine): simple-rules as defineBindings adapter"
```
(karabiner-output.json should show no diff — stage it anyway to confirm.)

---

## Task 8: Adapter — `tap-hold-rules`

**Files:**
- Modify: `src/engine/tap-hold-rules.ts` (keep `TapHoldConfig`, `generateTapHoldRules` signature; reuse the existing `parseKeyWithModifiers` helper)

**Interfaces:**
- Consumes: `defineBindings`, `Binding` from `./binding`; `parseKeyWithModifiers` (already in this file).

- [ ] **Step 1: Rewrite `generateTapHoldRules` body**

In `src/engine/tap-hold-rules.ts`, replace the `generateTapHoldRules` function body to build `Binding[]` from `Object.entries(tapHoldKeys)` and call `defineBindings`. Each entry: parse `keyString` via `parseKeyWithModifiers` → `trigger.keys=[key]`, `trigger.modifiers=modifiers` (the default-alone with `halt:true` and `from.modifiers.mandatory` injection is handled by the tapHold arm — verify the default-alone uses the *bare key* with no modifiers, matching today's `defaultAlone` which is `{key, modifiers:[], halt:true}`... see Step 3 note). Carry `appOverrides` as extra `{phase:"hold"/"release", conditions:[{app}], do:…}` cases (grouped by condition automatically).

```ts
export function generateTapHoldRules(
  tapHoldKeys: Record<string, TapHoldConfig>,
  suppressionVars: string[] = [],
): Rule[] {
  const bindings: Binding[] = Object.entries(tapHoldKeys).map(([keyString, config]) => {
    const { key, modifiers } = parseKeyWithModifiers(keyString);
    const cases: Case[] = [];
    if (config.alone) cases.push({ phase: "release", do: config.alone });
    if (config.hold) cases.push({ phase: "hold", do: config.hold });
    for (const ov of config.appOverrides ?? []) {
      const conds = [{ app: ov.app, ...(ov.unless ? { unless: true } : {}) }];
      if (ov.alone) cases.push({ phase: "release", conditions: conds, do: ov.alone });
      if (ov.hold) cases.push({ phase: "hold", conditions: conds, do: ov.hold });
    }
    return {
      description: formatRuleDescription(keyString, config.description, "hold"),
      trigger: { keys: [key], modifiers },
      timing: { aloneMs: config.timeoutMs, heldThresholdMs: config.thresholdMs },
      cases,
      ...(suppressionVars.length ? { conditions: suppressionVars.map((v) => ({ var: v, equals: 1, unless: true })) } : {}),
    };
  });
  return defineBindings(bindings);
}
```
Add imports: `import { defineBindings, type Binding, type Case } from "./binding";` and `import type { Rule } from "karabiner.ts";`. Remove now-unused `resolveActionToEvents`, `tapHold`, `ActionSpec` imports if the linter flags them.

- [ ] **Step 2: Note the default-alone modifier behavior**

Today's `tap-hold-rules` sets `defaultAlone = [{key, modifiers, halt:true}]` — i.e. the default-alone *includes* the parsed modifiers (e.g. `vmCOCS+t` alone → `t` with `vmCOCS`). Verify against the golden file in Step 4: if `defineBindings`' tapHold arm (Task 5) uses `mods` in `defaultAlone` it already matches; if the golden diff shows a mismatch on a `vmCOCS+X` entry's `to_if_alone`, update `buildTapHold`'s `defaultAlone` to include `mods` (it already does — confirm).

- [ ] **Step 3: Regenerate + diff**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: empty. Fix drift in `buildTapHold` if any.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/tap-hold-rules.ts
git commit -m "refactor(engine): tap-hold-rules as defineBindings adapter"
```

---

## Task 9: Adapter — `tap-alone-hold-rules` (the §8.1 normalization)

**Files:**
- Modify: `src/engine/tap-alone-hold-rules.ts` (keep `TapAloneHoldConfig`, `generateTapAloneHoldRule` signature)

**Interfaces:**
- Consumes: `defineBindings`, `Binding` from `./binding`.

- [ ] **Step 1: Rewrite `generateTapAloneHoldRule` body**

```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type TapAloneHoldConfig = {
  key: string;
  modifiers?: ModKey[];
  description: string;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
};

export function generateTapAloneHoldRule(config: TapAloneHoldConfig): Rule {
  const binding: Binding = {
    description: formatRuleDescription(
      config.modifiers ? [...config.modifiers, config.key] : config.key,
      config.description,
      "hold",
    ),
    trigger: { keys: [config.key], modifiers: config.modifiers as string[] | undefined },
    timing: { aloneMs: config.timeoutMs, heldThresholdMs: config.timeoutMs },
    cases: [
      { phase: "release", do: config.alone },
      { phase: "hold", do: config.hold },
    ],
  };
  return defineBindings([binding])[0]!;
}
```

- [ ] **Step 2: Regenerate + diff (expect exactly ONE change)**

Run: `CI=true npx tsx src/index.ts && git diff karabiner-output.json`
Expected: the **only** diff is ctrl-escape's manipulator losing its `"description"` key (the §8.1 normalization). Confirm:
```
git diff karabiner-output.json | grep -E '^\+|^-' | grep -i 'description\|Process Spy'
```
should show only the removal of the manipulator-level description on the "Activity Monitor / Process Spy" manipulator. If ANY other line differs, fix `buildTapHold` and re-run.

- [ ] **Step 3: Update the test that asserts manipulator count (unchanged) + run suite**

Run: `npm test`
Expected: PASS. (The `ctrl-escape monitor factory` test asserts manipulator count = 1 and description at the *rule* level, both unchanged.)

- [ ] **Step 4: Commit**

```bash
git add src/engine/tap-alone-hold-rules.ts karabiner-output.json
git commit -m "refactor(engine): tap-alone-hold-rules as adapter; normalize manipulator description (§8.1)"
```

---

## Task 10: Adapter — `multi-tap-rules`

**Files:**
- Modify: `src/engine/multi-tap-rules.ts` (keep `MultiTapConfig`, `generateMultiTapRule` signature; keep the mutual-exclusion validation)

**Interfaces:**
- Consumes: `defineBindings`, `Binding` from `./binding`.

- [ ] **Step 1: Rewrite `generateMultiTapRule` body**

```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type MultiTapConfig = {
  key: string;
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs: number;
  allowPassThrough?: boolean;
  mods?: string[];
};

export function generateMultiTapRule(config: MultiTapConfig): Rule {
  if (config.tapTap && config.tapTapHold) {
    throw new Error("MultiTapConfig: tapTap and tapTapHold are mutually exclusive");
  }
  const cases = [];
  if (config.alone) cases.push({ phase: "release" as const, do: config.alone });
  if (config.hold) cases.push({ phase: "hold" as const, do: config.hold });
  if (config.tapTap) cases.push({ tapCount: 2, phase: "release" as const, do: config.tapTap });
  if (config.tapTapHold) cases.push({ tapCount: 2, phase: "hold" as const, do: config.tapTapHold });
  const binding: Binding = {
    description: formatRuleDescription(config.key, config.description, "multi-tap"),
    trigger: { keys: [config.key] },
    timing: { aloneMs: config.thresholdMs, heldThresholdMs: config.thresholdMs },
    multiTap: { allowPassThrough: config.allowPassThrough, mods: config.mods },
    cases,
  };
  return defineBindings([binding])[0]!;
}
```

- [ ] **Step 2: Regenerate + diff**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: empty. (escape, left-command, shift all flow here.) Fix `buildMultiTap` arg mapping if drift (esp. `allowPassThrough` → `passThrough` key, `mods`, `firstTapPendingVar` naming).

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS (incl. `escape tap-tap-hold`, `left command factory`).

- [ ] **Step 4: Commit**

```bash
git add src/engine/multi-tap-rules.ts
git commit -m "refactor(engine): multi-tap-rules as defineBindings adapter"
```

---

## Task 11: Adapter — `simultaneous-rules`

**Files:**
- Modify: `src/engine/simultaneous-rules.ts` (keep `SimultaneousConfig`, `SimultaneousOptions`, `generateSimultaneousRules` signature; keep all validation)

**Interfaces:**
- Consumes: `defineBindings`, `Binding` from `./binding`. The `resolveKarOptions`/`injectSuppressionConditions` helpers fold into the adapter (suppression vars become hoisted `{var, equals:1, unless:true}` conditions).

- [ ] **Step 1: Rewrite `generateSimultaneousRules` body**

Map each `SimultaneousConfig` entry to a `Binding`:
- `trigger = { keys: config.keys, order: <from simultaneousOptions> }`
- `cases`: alone→release, hold→hold, tapTap→`{tapCount:2,phase:release}`, tapTapHold→`{tapCount:2,phase:hold}`
- `timing`: aloneMs/thresholdMs → aloneMs/heldThresholdMs; simultaneousThresholdMs
- hoisted `conditions`: suppressionVars → `{var, equals:1, unless:true}`
- Keep `validateMappings(mappings, tapHoldKeys)` exactly as-is (call it first).
- Carry `simultaneousOptions.to_after_key_up` → `binding.afterKeyUp` (resolved).

```ts
export function generateSimultaneousRules(
  mappings: Record<string, SimultaneousConfig>,
  suppressionVars: string[] = [],
  tapHoldKeys: Record<string, TapHoldConfig>,
): Rule[] {
  validateMappings(mappings, tapHoldKeys);
  const bindings: Binding[] = Object.entries(mappings).map(([label, config]) => {
    const cases: Case[] = [];
    if (config.alone) cases.push({ phase: "release", do: config.alone });
    if (config.hold) cases.push({ phase: "hold", do: config.hold });
    if (config.tapTap) cases.push({ tapCount: 2, phase: "release", do: config.tapTap });
    if (config.tapTapHold) cases.push({ tapCount: 2, phase: "hold", do: config.tapTapHold });
    return {
      description: formatRuleDescription(config.keys, config.description, "simultaneous"),
      trigger: { keys: config.keys, order: resolveOrder(config.simultaneousOptions) },
      timing: {
        aloneMs: config.thresholdMs,
        heldThresholdMs: config.thresholdMs,
        simultaneousMs: config.simultaneousThresholdMs,
      },
      conditions: suppressionVars.map((v) => ({ var: v, equals: 1, unless: true })),
      afterKeyUp: config.simultaneousOptions?.to_after_key_up,
      cases,
    };
  });
  return defineBindings(bindings);
}
```
Add a small `resolveOrder(simOpts)` that maps `SimultaneousOptions` → `SimOrder` (`key_down_order`→`down`, `key_up_order`→`up`, `key_up_when`→`upWhen`, `detect_key_down_uninterruptedly`→`detectUninterrupted`). Delete `resolveKarOptions` and `injectSuppressionConditions` (now unused). Keep `validateMappings` and `normalizedChordKey` as-is.

- [ ] **Step 2: Regenerate + diff**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: empty. (`simultaneousMappings` is currently empty, so this is structurally verified by the typecheck + the unit test in Task 6; live output has no simultaneous rules to drift. Still confirm no diff.)

- [ ] **Step 3: Run tests + typecheck**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine/simultaneous-rules.ts
git commit -m "refactor(engine): simultaneous-rules as defineBindings adapter"
```

---

## Task 12: Adapters — `launcher-rules`, `pointer-remap-rules`, `conditional-action-rules`, `conditional-tap-hold-rules`

**Files:**
- Modify: `src/engine/launcher-rules.ts`, `src/engine/pointer-remap-rules.ts`, `src/engine/conditional-action-rules.ts`, `src/engine/conditional-tap-hold-rules.ts` (keep all exported types + signatures)

**Interfaces:**
- Consumes: `defineBindings`, `Binding`, `Case` from `./binding`.

- [ ] **Step 1: `launcher-rules` → adapter**

Each launcher mapping → one `Binding` with `trigger.keys=[key]`, `trigger.modifiers=triggerKey`, one `case {phase:"press", do:[action]}`.

```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type ModifierLauncherMapping<TKey extends string = string> = {
  key: TKey;
  description: string;
  action: ActionSpec;
};

type LauncherRuleConfig<TKey extends string> = {
  triggerKey: string | string[];
  triggerLabel?: string;
  launchers: ReadonlyArray<ModifierLauncherMapping<TKey>>;
};

export function generateModifierLauncherRules<TKey extends string>(
  config: LauncherRuleConfig<TKey>,
): Rule[] {
  const { triggerKey, triggerLabel, launchers } = config;
  const desc = triggerLabel ?? triggerKey;
  return defineBindings(
    launchers.map<Binding>((l) => ({
      description: formatRuleDescription(
        Array.isArray(desc) ? [...desc, l.key] : [desc, l.key],
        l.description,
        "tap",
      ),
      trigger: { keys: [l.key], modifiers: Array.isArray(triggerKey) ? triggerKey : [triggerKey] },
      cases: [{ phase: "press", do: [l.action] }],
    })),
  );
}
```

- [ ] **Step 2: `pointer-remap-rules` → adapter**

```ts
import { ifApp } from "karabiner.ts";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type PointerRemapConfig = {
  button: string;
  modifiers?: ModKey[];
  description: string;
  to: ActionSpec[];
  ifApp?: string | string[];
};

export function generatePointerRemapRule(config: PointerRemapConfig): Rule {
  const binding: Binding = {
    description: formatRuleDescription(config.button, config.description, "tap"),
    trigger: { pointer: config.button, modifiers: config.modifiers as string[] | undefined },
    ...(config.ifApp ? { conditions: [{ app: config.ifApp }] } : {}),
    cases: [{ phase: "press", do: config.to }],
  };
  return defineBindings([binding])[0]!;
}
```
Note: `buildRemap` must produce the same raw manipulator shape as today's `pointer-remap-rules` (`{type:"basic", from:{pointing_button}, to, description, conditions?}`). If `map({pointing_button})` differs, adjust `buildRemap`'s pointer branch to build the raw object directly — verify via the onepiece test (`buildOnePieceClickEnterRule`) in Step 5.

- [ ] **Step 3: `conditional-action-rules` → adapter**

Map each `ConditionalActionMapping` → one `Binding` with one `case` per variant (`{phase:"press", conditions: <mapped>, do: variant.actions}`), plus `variant.delayedAction` ignored (YAGNI per spec §3.6 — no definition uses it). Map `ConditionalActionCondition` → `Condition`: `frontmostApp` → `{app: bundleIds, unless?}`, `variable` → `{var: name, equals: value, unless: match==="unless"}`.

```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import type { ModKey } from "../data/key-aliases";
import { defineBindings, type Binding, type Condition } from "./binding";
import type { Rule } from "karabiner.ts";

export type ConditionalActionCondition =
  | { type: "frontmostApp"; bundleIds: string[]; unless?: boolean }
  | { type: "variable"; name: string; match: "if" | "unless"; value: string | number };

export type ConditionalActionVariant = {
  when: ConditionalActionCondition[];
  actions: ActionSpec[];
};

export type ConditionalActionMapping = {
  key: string;
  modifiers: ModKey[];
  description: string;
  variants: ConditionalActionVariant[];
};

function toCondition(c: ConditionalActionCondition): Condition {
  return c.type === "frontmostApp"
    ? { app: c.bundleIds, ...(c.unless ? { unless: true } : {}) }
    : { var: c.name, equals: c.value, ...(c.match === "unless" ? { unless: true } : {}) };
}

export function generateConditionalActionRules(mappings: ReadonlyArray<ConditionalActionMapping>): Rule[] {
  return defineBindings(
    mappings.map<Binding>((m) => ({
      description: formatRuleDescription([...m.modifiers, m.key], m.description, "tap"),
      trigger: { keys: [m.key], modifiers: m.modifiers as string[] },
      cases: m.variants.map((v) => ({
        phase: "press" as const,
        conditions: v.when.map(toCondition),
        do: v.actions,
      })),
    })),
  );
}
```
(The old `delayedAction`/`parameters.delayedActionDelayMs` fields are dropped — no definition populates them; if a future need appears, add `onUndisturbed`/`onInterrupted` phases per spec §3.6.)

- [ ] **Step 4: `conditional-tap-hold-rules` → adapter**

```ts
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ActionSpec } from "../core/action-dsl";
import { defineBindings, type Binding } from "./binding";
import type { Rule } from "karabiner.ts";

export type TapHoldVariantMapping = {
  description: string;
  when?: { app: string; unless?: boolean };
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
  thresholdMs: number;
};

export type ConditionalTapHoldMapping = { key: string; variants: TapHoldVariantMapping[] };

export function generateConditionalTapHoldRules(
  mappings: ReadonlyArray<ConditionalTapHoldMapping>,
): Rule[] {
  const bindings: Binding[] = mappings.flatMap(({ key, variants }) =>
    variants.map<Binding>((v) => ({
      description: formatRuleDescription(key, v.description, "hold"),
      trigger: { keys: [key] },
      timing: { aloneMs: v.timeoutMs, heldThresholdMs: v.thresholdMs },
      ...(v.when ? { conditions: [{ app: v.when.app, ...(v.when.unless ? { unless: true } : {}) }] } : {}),
      cases: [
        { phase: "release", do: v.alone },
        { phase: "hold", do: v.hold },
      ],
    })),
  );
  return defineBindings(bindings);
}
```
Each variant becomes its own `Binding` (own description) → its own rule, matching today's `buildRulesWithVariantRules` one-rule-per-variant output.

- [ ] **Step 5: Regenerate + diff**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: empty. (Hyper launchers, onepiece, skim, zen, passwords, enter-equals all flow through these.) Fix drift per generator.

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS (incl. `right-option app factory`, `password quick-fill`, `enter rules factory`, `onepiece click-enter`).

- [ ] **Step 7: Commit**

```bash
git add src/engine/launcher-rules.ts src/engine/pointer-remap-rules.ts src/engine/conditional-action-rules.ts src/engine/conditional-tap-hold-rules.ts
git commit -m "refactor(engine): launcher/pointer-remap/conditional-action/conditional-tap-hold as adapters"
```

---

## Task 13: Migrate `home-end.ts` to `Binding[]` (the proof)

**Files:**
- Modify: `src/definitions/home-end.ts` (replace `SimpleRemapMapping[]` + `generateSimpleRemapRules` with `Binding[]` + `defineBindings`)

**Interfaces:**
- Consumes: `defineBindings`, `Binding` from `../engine`.

- [ ] **Step 1: Rewrite `home-end.ts`**

```ts
import { defineBindings, type Binding } from "../engine";

export const homeEndBindings: Binding[] = [
  {
    description: "[HOME]        →    Move to line start (on tap)",
    trigger: { keys: ["home"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }] }],
  },
  {
    description: "[HOME]        →    Select to line start (on tap)",
    trigger: { keys: ["home"], modifiers: ["left_shift"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command", "left_shift"] }] }],
  },
  {
    description: "[END]        →    Move to line end (on tap)",
    trigger: { keys: ["end"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "right_arrow", modifiers: ["left_command"] }] }],
  },
  {
    description: "[END]        →    Select to line end (on tap)",
    trigger: { keys: ["end"], modifiers: ["left_shift"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "right_arrow", modifiers: ["left_command", "left_shift"] }] }],
  },
];

export const buildHomeEndRule = () => defineBindings(homeEndBindings);
```
**Note:** the description strings must match the current output *exactly* (the `→` and spacing come from `formatRuleDescription`). To get them verbatim, first run `CI=true npx tsx src/index.ts` on the *current* code and copy the four `[HOME]/[END]…` `ruleDescription` values from `karabiner-output.json` into the `description` fields above.

- [ ] **Step 2: Regenerate + diff**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: empty. If the home-end descriptions differ by spacing, fix the copied strings.

- [ ] **Step 3: Update the definition barrel if needed**

`src/definitions/index.ts` exports `buildHomeEndRule` and `homeEndNavigationMappings` — update the second export to `homeEndBindings`.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (incl. `home-end factory keeps four navigation mappings`).

- [ ] **Step 5: Commit**

```bash
git add src/definitions/home-end.ts src/definitions/index.ts
git commit -m "refactor(definitions): migrate home-end to Binding[] + defineBindings"
```

---

## Task 14: Final verification + dead-code cleanup

**Files:**
- Possibly delete: `src/engine/rule-factory-base.ts`, `src/engine/variant-types.ts` (if no longer imported)

- [ ] **Step 1: Confirm full golden diff is exactly the §8.1 normalization**

Run: `CI=true npx tsx src/index.ts && git diff karabiner-output.json`
Expected: the ONLY diff is the removal of the `"description"` key on the ctrl-escape ("Activity Monitor / Process Spy") manipulator. Verify:
```bash
git diff karabiner-output.json | grep -E '^[-+]' | grep -v '^[-+]{3}' | grep -viE 'process spy|description'
```
Expected: **no output** (every changed line is part of the ctrl-escape description removal).

- [ ] **Step 2: Full check (without deploying)**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS. (Deliberately skips `npm run build` — that writes the live Karabiner profile and reloads Hammerspoon, a deployment the human runs themselves once they've reviewed the golden diff: `npm run build`.)

- [ ] **Step 3: Check for dead code**

Run: `rg -n "rule-factory-base|variant-types|buildRulesFromMappings|buildRulesWithVariant|ConditionalVariantBase" src/`
If no imports remain, delete `src/engine/rule-factory-base.ts` and `src/engine/variant-types.ts` and remove their `export *` lines from `src/engine/index.ts`. Re-run `npm run typecheck`.

- [ ] **Step 4: Commit cleanup (if any)**

```bash
git add -A src/engine
git commit -m "refactor(engine): remove dead rule-factory-base and variant-types"
```

- [ ] **Step 5: Summary commit (optional, if golden change not yet committed)**

If `karabiner-output.json` has the §8.1 diff staged separately, ensure it's committed with Task 9's commit (it should be). Run `git status` to confirm a clean tree (modulo the unrelated pre-existing WIP changes that were present at branch start).

---

## Self-Review (completed during authoring)

**Spec coverage:**
- §3.1 Trigger (keys/modifiers/order) → Task 2 types, Task 3 resolver. ✓
- §3.2 Conditions (state vs timing; Phase press/release/hold; tapCount) → Tasks 2–3, used in 4–6. ✓
- §3.2 delayed-action not exposed (§3.6) → noop added (Task 1); delayed stays internal via core primitives (Tasks 5–6). ✓
- §3.3 noop vs vk_none → Task 1. ✓
- §3.4 Binding/Case shapes + merge rule → Tasks 2, 4–6 (`groupByConditions`). ✓
- §3.5 builders (remap/tapHold/multiTap) + specials (modifierChord/guard/reset) → Tasks 4–6 (arms) + Tasks 7–12 (adapters) + Task 14 (specials kept). ✓
- §3.6 not-exposed delayed phases → respected (conditional-action drops dead `delayedAction` field, Task 12). ✓
- §4 mapping table → Tasks 7–13. ✓
- §5 specials → guard/modifierChord/reset stay specialized (Task 14 light touch; guard untouched). ✓
- §6 phasing (1 primitives+adapters, 2 defineBindings, 3 home-end proof) → Tasks 1–12 (engine+adapters), Task 13 (proof). ✓
- §7 scope (keyboard-only, mouse untouched) → no mouse files modified. ✓
- §8.1 normalization → Task 9. ✓

**Placeholder scan:** all code steps contain real code; no TBD/TODO. Adapter tasks that depend on empirical drift explicitly call out the rebuild→diff→fix loop (that is the method, not a placeholder).

**Type consistency:** `Binding`, `Case`, `Condition`, `Phase`, `Trigger` defined once (Task 2) and reused with identical field names across Tasks 3–13. `defineBindings` signature constant. `resolveCondition` / `triggerToFrom` names match between definition (Task 3) and use (Tasks 4–6).
