# Double-Tap Guard Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the double-tap guard mechanism so combos require two presses within a timeout before firing, by adding a dedicated `guard()` DSL helper + engine arm that emits the bespoke two-manipulator pattern — replacing the broken `doubleTap()` routing through `varTapTapHold`.

**Architecture:** Three changes. (1) DSL: add a `guard(action)` case helper that marks a `CaseBuilder` with `guard: true`. (2) Engine: add `Case.guard?: boolean` + `ResolvedCase.guard`, a `buildGuard(b, resolved)` arm, gated FIRST in `buildManipulators` (before `hasMultiTap`). (3) Definition + tests: switch `guards.ts` from `doubleTap(...)` to `guard(...)`; restore the regression test to assert the known-good guard shape (not the `multi_tap_q` var).

**Tech Stack:** TypeScript, `karabiner.ts` (`map`/`toKey`/`toSetVar`/`ifVar` builders), `node:test` + `node:assert/strict`.

## Global Constraints

- Guards stay first-class bindings (`bind`/`from`/`to`/`when`). The engine gains a narrow `guard` arm.
- The `guard` arm is gated on the `guard` marker — no binding without `guard()` routes through it. `varTapTapHold`/`buildMultiTap` stay untouched.
- The `doubleTap()` helper is KEPT (correct primitive for genuine double-tap; no current consumer).
- Guard var name = `guard_<normalizedMod>_<key>` from the trigger's FIRST mandatory modifier + key, where `normalizeModifier` strips `left_`/`right_` and aliases `command→cmd`, `control→ctrl`, `option→opt`; no-modifier trigger → `<normalizedMod> = "none"`. Overridable via a new `Binding.guardVar?: string`.
- Timeout = `Binding.guardMs ?? TIMINGS.timeoutDoubleTapMs` (300ms), emitted as `basic.to_delayed_action_delay_milliseconds` on the first-press manipulator ONLY.
- `from.modifiers = {mandatory: [...]}` (the trigger's modifiers), via the existing `fromModifiersObj` helper.
- Hoisted binding conditions (`when(condApp(...))`) attach to BOTH manipulators.
- Test runner: `npx tsx --test src/tests/*.test.ts`. Typecheck: `npx tsc -p tsconfig.json --noEmit`.
- A pre-existing, UNRELATED test failure exists in `src/tests/integration.test.ts` ("Missing tap-hold rules" — stale `(on hold)` description assertion). Do NOT try to fix it; it is expected to remain failing. All other tests must pass.
- Commits are UNSIGNED during execution: `git -c commit.gpgsign=false commit -m "..."` (repo signs via 1Password, unreachable non-interactively).

**Reference — the known-good two-manipulator shape (must be reproduced), for `bind(from("q", ["left_command"]), to(guard(key("q", ["left_command"]))))`:**

```jsonc
[
  {
    "type": "basic",
    "from": { "key_code": "q", "modifiers": { "mandatory": ["left_command"] } },
    "conditions": [{ "type": "variable_if", "name": "guard_cmd_q", "value": 1 }],
    "to": [
      { "key_code": "q", "modifiers": ["left_command"] },
      { "set_variable": { "name": "guard_cmd_q", "value": 0 } }
    ]
  },
  {
    "type": "basic",
    "from": { "key_code": "q", "modifiers": { "mandatory": ["left_command"] } },
    "parameters": { "basic.to_delayed_action_delay_milliseconds": 300 },
    "conditions": [{ "type": "variable_if", "name": "guard_cmd_q", "value": 0 }],
    "to": [ { "set_variable": { "name": "guard_cmd_q", "value": 1 } } ],
    "to_delayed_action": {
      "to_if_invoked": [ { "set_variable": { "name": "guard_cmd_q", "value": 0 } } ],
      "to_if_canceled": [ { "set_variable": { "name": "guard_cmd_q", "value": 0 } } ]
    }
  }
]
```

---

### Task 1: Add `guard()` DSL helper + `Case.guard` marker

**Files:**
- Modify: `src/engine/case-helpers.ts` — `CaseBuilder` class (add `guard` field + `withGuard()` method) and add the `guard()` standalone helper.
- Modify: `src/engine/binding.ts:75-83` — `Case` type (add `guard?: boolean`).
- Test: `src/tests/case-helpers.test.ts`

**Interfaces:**
- Produces: `guard(action, conditions?)` → `CaseBuilder` (phase "press", `guard: true`, carrying the actions in `do`). `Case.guard?: boolean`.

**Reference — current `CaseBuilder` class start (`case-helpers.ts:40-65`):**

```ts
export class CaseBuilder implements Case {
  phase?: Phase;
  do: Action[];
  declare conditions?: Condition[];
  declare tapCount?: number;
  declare description?: string;
  declare suppress?: boolean;
  declare delayed?: boolean;

  constructor(
    phase: Phase,
    actions: Action | Action[],
    conditions?: Condition | Condition[],
  ) {
    this.phase = phase;
    this.do = Array.isArray(actions) ? actions : [actions];
    delete this.conditions;
    delete this.tapCount;
    delete this.description;
    delete this.suppress;
    delete this.delayed;

    if (conditions) {
      this.when(conditions);
    }
  }
```

**Reference — current `withDelayed` method (`case-helpers.ts:107-113`) — mirror its shape for `withGuard`:**

```ts
  withDelayed(delayed = true): this {
    this.delayed = delayed;
    return this;
  }
```

- [ ] **Step 1: Write the failing test**

Add to `src/tests/case-helpers.test.ts` (at the end of the file, as a new top-level `test(...)`):

```ts
test("guard() produces a press case marked guard with the action", () => {
  const g = guard(key("q", ["left_command"]));
  assert.equal(g.phase, "press");
  assert.equal((g as any).guard, true);
  assert.equal(g.do.length, 1);
  const action = g.do[0] as any;
  assert.equal(action.type, "key");
  assert.equal(action.key, "q");
  assert.deepEqual(action.modifiers, ["left_command"]);
});

test("guard() accepts conditions", () => {
  const g = guard(key("d"), condApp({ type: "app", name: "com.x", refDesc: "X" }));
  assert.equal((g as any).guard, true);
  assert.deepEqual(g.conditions ?? [], [
    { app: { type: "app", name: "com.x", refDesc: "X" } },
  ]);
});
```

Ensure `guard`, `key`, and `condApp` are imported at the top of the test file. Check the existing imports at the top of `src/tests/case-helpers.test.ts`; add `guard` to the import from `"../engine"` (or wherever `key`/`condApp` come from), and `key`/`condApp` if not already imported.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/case-helpers.test.ts`
Expected: FAIL — `guard is not defined` (and/or TypeScript `Property 'guard' does not exist on type 'Case'`).

- [ ] **Step 3: Add `guard?: boolean` to the `Case` type**

In `src/engine/binding.ts`, the `export type Case = { ... }` block (lines 75-83). After the `delayed?: boolean;` line (line 82), add:

```ts
  guard?: boolean; // double-tap guard: require two presses within a timeout before firing the combo (routes to buildGuard)
```

- [ ] **Step 4: Add the `guard` field + `withGuard()` method to `CaseBuilder`**

In `src/engine/case-helpers.ts`:

(a) In the `CaseBuilder` class field declarations (after `declare delayed?: boolean;`), add:

```ts
  declare guard?: boolean;
```

(b) In the constructor, after `delete this.delayed;`, add:

```ts
    delete this.guard;
```

(c) Add the `withGuard()` method. Place it right after the `withDelayed()` method (mirroring its shape):

```ts
  /**
   * Mark this case as a double-tap guard (require two presses within a timeout
   * before firing). Routed to the guard arm of `buildManipulators`.
   */
  withGuard(guard = true): this {
    this.guard = guard;
    return this;
  }
```

- [ ] **Step 5: Add the standalone `guard()` helper**

In `src/engine/case-helpers.ts`, add the `guard()` standalone helper. Place it right AFTER the existing `doubleTap()` helper (which is at ~line 188-193), so the two related helpers sit together:

```ts
/**
 * Defines a double-tap guard case: the combo fires only after the user presses
 * the trigger combo twice within a timeout (300ms by default). The first press
 * arms a guard variable; the second press fires the real combo.
 *
 * Distinct from `doubleTap()` — which fires on a clean double tap-RELEASE via
 * the multi-tap state machine. A guard fires the combo immediately in `to` on
 * the second press, with a delayed-action arming window.
 *
 * @param actions The combo to fire on the second press.
 * @param conditions Optional conditions for this guard.
 *
 * @example
 * guard(key("q", ["left_command"]))
 */
export function guard(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("press", actions, conditions).withGuard();
}
```

- [ ] **Step 6: Verify `guard` is re-exported from the engine barrel**

Check `src/engine/index.ts` — it re-exports from `case-helpers`. If `doubleTap` is re-exported there, add `guard` alongside it (same import line). Run:

```bash
rg -n "doubleTap" src/engine/index.ts
```

If `doubleTap` appears in the re-export, add `guard` next to it. If `doubleTap` is NOT explicitly re-exported (the barrel may do `export * from "./case-helpers"`), no change is needed — verify `guard` is reachable via `from "../engine"` by the test import.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx tsx --test src/tests/case-helpers.test.ts`
Expected: PASS — both new `guard()` tests pass and all prior tests pass.

- [ ] **Step 8: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/engine/case-helpers.ts src/engine/binding.ts src/tests/case-helpers.test.ts src/engine/index.ts
git commit -c gpgsign=false -m "feat(engine): add guard() DSL helper + Case.guard marker"
```

(If `src/engine/index.ts` was unchanged in Step 6, drop it from the `git add`.)

---

### Task 2: Implement `buildGuard` engine arm + route it in `buildManipulators`

**Files:**
- Modify: `src/engine/binding.ts` — `ResolvedCase` type (add `guard`), `resolveCases` (carry `guard`), `Binding` type (add `guardVar?` + `guardMs?`), add `buildGuard()`, add the gate in `buildManipulators`, add `TIMINGS` to the `../data` import.
- Test: `src/tests/binding.test.ts`

**Interfaces:**
- Consumes: `Case.guard` (Task 1), `fromModifiersObj(b.trigger)` (existing), `resolveCondition` (existing), `deviceLast` (existing), `TIMINGS.timeoutDoubleTapMs` (from `../data`).
- Produces: when any resolved case has `guard === true`, `buildManipulators` returns `buildGuard(b, resolved)` — the two-manipulator pattern. `Binding.guardVar?: string`, `Binding.guardMs?: number`.

**Reference — bespoke var-name derivation (reproduce exactly):**
`normalizeModifier(mod)`: strip a leading `left_` or `right_` prefix, then alias `command→cmd`, `control→ctrl`, `option→opt` (everything else, e.g. `shift`, passes through). `deriveGuardVar(key, modifiers)`: `guard_<normalizeModifier(modifiers[0] ?? "none")>_<key>`. Note: bespoke operates on raw modifier strings like `"left_command"`; the binding engine's `resolveModifiers` expands VMOD aliases but left_/right_ keys pass through as-is — so derive from `b.trigger.modifiers` raw input, not the expanded form.

**Reference — current `ResolvedCase` type (`binding.ts:256-263`):**

```ts
type ResolvedCase = {
  tapCount: number;
  phase: Phase;
  delayed: boolean;
  conditions: unknown[];
  rawConditions: Condition[];
  do: ToEvent[];
};
```

**Reference — current `resolveCases` (`binding.ts:265-280`):**

```ts
function resolveCases(
  cases: Case[],
  shared: Condition[] | undefined,
): ResolvedCase[] {
  return cases.map((c) => {
    const rawConditions = [...(shared ?? []), ...(c.conditions ?? [])];
    return {
      tapCount: c.tapCount ?? 1,
      phase: c.phase ?? "press",
      delayed: c.delayed ?? false,
      conditions: rawConditions.map(resolveCondition),
      rawConditions,
      do: (c.do ?? []).flatMap(resolveActionToEvents),
    };
  });
}
```

**Reference — current `buildManipulators` start (`binding.ts:378-403`):**

```ts
function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  // ... hasMultiTap comment ...
  const hasMultiTap =
    resolved.some((c) => c.tapCount >= 2) || b.multiTap !== undefined;
  const keys = getTriggerKeys(b.trigger);
  const isSim = keys.length > 1;
  const isPointer = keys.length === 1 && isPointerButton(keys[0]!);
  let manipulators: Manipulator[];
  if (hasMultiTap) manipulators = buildMultiTap(b, resolved, isSim);
  else if (isSim) manipulators = buildSimultaneousTapHold(b, resolved);
  else {
    manipulators = distributeUnconditionalTap(
      groupByConditions(resolved),
    ).flatMap((g) =>
      g.hasRelease || g.hasHold
        ? buildTapHold(b, g)
        : buildRemap(b, g, isPointer),
    );
  }
  stampDeviceScope(manipulators, b.trigger);
  return manipulators;
}
```

**Reference — current `../data` import (`binding.ts:27`):**

```ts
import { DEVICES, isModifierKey } from "../data";
```

- [ ] **Step 1: Write the failing test**

Add to `src/tests/binding.test.ts`:

```ts
test("buildGuard: double-tap guard emits two-manipulator arm/fire pattern", () => {
  const rules = defineBindings([
    {
      description: "guard test",
      trigger: { keys: ["q"], modifiers: ["left_command"] },
      cases: [
        {
          phase: "press",
          guard: true,
          do: [{ type: "key", key: "q", modifiers: ["left_command"] }],
        },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 2, "guard emits two manipulators");
  const [secondPress, firstPress] = built.manipulatorSources;
  // var name derived: guard_cmd_q
  const varName = "guard_cmd_q";
  // SECOND press: var=1, fires the real combo in `to`, resets var
  assert.equal(secondPress.conditions[0], { type: "variable_if", name: varName, value: 1 });
  // toSetVar emits extra undefined keys; check name/value directly.
  assert.equal(secondPress.to[0].key_code, "q");
  assert.equal(secondPress.to[1].set_variable.name, varName);
  assert.equal(secondPress.to[1].set_variable.value, 0);
  // mandatory from-modifiers
  assert.deepEqual(secondPress.from.modifiers, { mandatory: ["left_command"] });
  // FIRST press: var=0, arms guard, delayed-action disarms
  assert.equal(firstPress.conditions[0], { type: "variable_if", name: varName, value: 0 });
  assert.equal(firstPress.to[0].set_variable.name, varName);
  assert.equal(firstPress.to[0].set_variable.value, 1);
  assert.deepEqual(firstPress.parameters, { "basic.to_delayed_action_delay_milliseconds": 300 });
  assert.equal(firstPress.to_delayed_action.to_if_invoked[0].set_variable.name, varName);
  assert.equal(firstPress.to_delayed_action.to_if_canceled[0].set_variable.name, varName);
  assert.deepEqual(firstPress.from.modifiers, { mandatory: ["left_command"] });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — `Property 'guard' does not exist on type 'Case'` during typecheck, or at runtime the guard case routes to `buildMultiTap` (since `tapCount` defaults to 1, it actually routes to `buildRemap` producing ONE manipulator, so `manipulatorSources.length === 2` fails with `1 !== 2`).

- [ ] **Step 3: Add `TIMINGS` to the `../data` import**

In `src/engine/binding.ts`, change the import line:

```ts
import { DEVICES, isModifierKey } from "../data";
```

to:

```ts
import { DEVICES, isModifierKey, TIMINGS } from "../data";
```

- [ ] **Step 4: Add `guard` to `ResolvedCase` + `resolveCases`**

(a) In the `ResolvedCase` type, after `delayed: boolean;`, add:

```ts
  guard: boolean;
```

(b) In `resolveCases`, in the returned object literal, after `delayed: c.delayed ?? false,`, add:

```ts
      guard: c.guard ?? false,
```

- [ ] **Step 5: Add `guardVar?` + `guardMs?` to the `Binding` type**

In `src/engine/binding.ts`, the `export type Binding = { ... }` block. After the `modWhileDown?: boolean;` line (added in the prior feature), add:

```ts
  guardVar?: string; // override the derived guard_<mod>_<key> variable name
  guardMs?: number; // double-tap guard timeout (default TIMINGS.timeoutDoubleTapMs)
```

- [ ] **Step 6: Add the `buildGuard` function**

Add this function in `src/engine/binding.ts`, placed just ABOVE `buildManipulators` (so it's defined before use). It builds the two manipulators directly with `map()`, reproducing the bespoke shape:

```ts
/**
 * Derive the double-tap guard variable name from the trigger, matching the
 * bespoke `deriveGuardVar` convention: `guard_<normalizedMod>_<key>`, where the
 * modifier is the first mandatory trigger modifier with its `left_`/`right_`
 * prefix stripped and `command→cmd`/`control→ctrl`/`option→opt` aliased. A
 * trigger with no modifiers uses `<mod> = "none"`.
 */
function deriveGuardVar(trigger: Trigger): string {
  const key = getTriggerKeys(trigger)[0] ?? "none";
  const mods = resolveModifiers(trigger.modifiers).mandatory;
  const firstMod = mods[0];
  const normalized = firstMod
    ? firstMod
        .replace(/^(left|right)_/, "")
        .replace("command", "cmd")
        .replace("control", "ctrl")
        .replace("option", "opt")
    : "none";
  return `guard_${normalized}_${key}`;
}

/**
 * Double-tap guard arm: require two presses of the trigger combo within a
 * timeout before firing the real combo. Emits two manipulators —
 *   (1) second press (guard var = 1): fires the combo in `to`, resets the var;
 *   (2) first press  (guard var = 0): arms the var, disarmed by a
 *       `to_delayed_action` whether the delay invokes (timeout) or is canceled
 *       (another key pressed).
 * This bypasses `varTapTapHold`, which routes the combo into `to_if_alone` and
 * cannot reproduce the guard's immediate fire-on-second-press semantics.
 * Hoisted binding conditions attach to BOTH manipulators.
 */
function buildGuard(b: Binding, resolved: ResolvedCase[]): Manipulator[] {
  const key = getTriggerKeys(b.trigger)[0]!;
  const varName = b.guardVar ?? deriveGuardVar(b.trigger);
  const timeoutMs = b.guardMs ?? TIMINGS.timeoutDoubleTapMs;
  // The guard case carries the combo to fire on the second press.
  const guardCase = resolved.find((c) => c.guard);
  const combo = guardCase?.do ?? [];
  const modifiersObj = fromModifiersObj(b.trigger);
  // Hoisted conditions attach to both manipulators, device_if last.
  const conds = deviceLast(resolved.flatMap((c) => c.conditions));

  // Second press: var = 1 → fire combo, reset var.
  const secondPress = map(key as any);
  secondPress.condition({ type: "variable_if", name: varName, value: 1 } as any);
  for (const e of combo) secondPress.to(e);
  secondPress.to(toSetVar(varName, 0));
  for (const c of conds) secondPress.condition(c as any);
  (secondPress as any).from.modifiers = modifiersObj;

  // First press: var = 0 → arm var, delayed-action disarms.
  const firstPress = map(key as any);
  firstPress.condition({ type: "variable_if", name: varName, value: 0 } as any);
  firstPress.parameters({ "basic.to_delayed_action_delay_milliseconds": timeoutMs });
  firstPress.to(toSetVar(varName, 1));
  firstPress.toDelayedAction([toSetVar(varName, 0)], [toSetVar(varName, 0)]);
  for (const c of conds) firstPress.condition(c as any);
  (firstPress as any).from.modifiers = modifiersObj;

  const built = [...secondPress.build(), ...firstPress.build()];
  stampLabel(built, guardCase?.rawConditions);
  return built as Manipulator[];
}
```

Note: `stampLabel` already exists in `binding.ts` and takes `(manipulators, conditions)`. `toSetVar`, `map` are imported from `karabiner.ts` (`toSetVar` was added in the prior feature). `deviceLast`, `fromModifiersObj`, `resolveModifiers`, `getTriggerKeys`, `resolveCondition` are all existing functions in this file.

- [ ] **Step 7: Add the gate at the top of `buildManipulators`**

In `src/engine/binding.ts`, `buildManipulators`. Immediately after the `const resolved = resolveCases(b.cases, b.conditions);` line (the FIRST line of the function), add the guard gate BEFORE the `hasMultiTap` computation:

```ts
function buildManipulators(b: Binding): Manipulator[] {
  const resolved = resolveCases(b.cases, b.conditions);
  if (resolved.some((c) => c.guard)) {
    const manipulators = buildGuard(b, resolved);
    stampDeviceScope(manipulators, b.trigger);
    return manipulators;
  }
  // A binding routes to the multiTap arm if any case has tapCount >= 2 OR the
  // ... existing comment continues ...
```

Leave the rest of `buildManipulators` unchanged.

- [ ] **Step 8: Run test to verify it passes**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS — the new `buildGuard` test passes and all prior tests still pass.

- [ ] **Step 9: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 10: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -c gpgsign=false -m "feat(engine): buildGuard arm emits double-tap guard two-manipulator pattern"
```

---

### Task 3: Switch `guards.ts` to `guard()` + restore the regression test

**Files:**
- Modify: `src/definitions/guards.ts` — `doubleTap(...)` → `guard(...)`.
- Modify: `src/tests/double-tap-guard.test.ts` — restore assertions to the known-good guard shape.

**Interfaces:**
- Consumes: `guard()` (Task 1), `buildGuard` (Task 2).
- Produces: `guardBindings` consumed by `src/index.ts` (unchanged export name).

**Reference — current `src/definitions/guards.ts` (full file):**

```ts
import { APP_ID } from "../data";
import {
  bind,
  condApp,
  doubleTap,
  from,
  key,
  to,
  when,
  type Binding,
} from "../engine";

export const globalGuardBinding: Binding = bind(
  from("q", ["left_command"]),
  to(doubleTap(key("q", ["left_command"]))),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["left_command"]),
  to(doubleTap(key("d", ["left_command"]))),
  when(condApp(APP_ID.antinote)),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
```

**Reference — current `src/tests/double-tap-guard.test.ts` (full file — asserts the BROKEN `multi_tap_q` behavior; must be restored):**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { antinoteGuardBinding, globalGuardBinding, guardBindings } from "../definitions/guards";
import { defineBindings } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("guardBindings produces rules with two manipulators per double-tap guard", () => {
  const rules = defineBindings(guardBindings).map(toRule);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].manipulators.length, 2);
  assert.equal(rules[1].manipulators.length, 2);
});

test("globalGuardBinding sets multi-tap pending variable on first tap", () => {
  const [rule] = defineBindings([globalGuardBinding]).map(toRule);
  const firstPress: any = rule.manipulators[1];
  assert.ok(
    firstPress?.to?.some((e: any) => e.set_variable?.name === "multi_tap_q"),
    "Expected multi_tap_q variable",
  );
});

test("antinoteGuardBinding adds frontmost application condition to manipulators", () => {
  const [rule] = defineBindings([antinoteGuardBinding]).map(toRule);
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "Both manipulators should have app condition",
  );
});

test("globalGuardBinding has no app condition when omitted", () => {
  const [rule] = defineBindings([globalGuardBinding]).map(toRule);
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        !m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "No app condition expected for global rule",
  );
});
```

- [ ] **Step 1: Update `guards.ts` — `doubleTap` → `guard`**

Replace the `doubleTap` import with `guard`, and switch both bindings. The full new file:

```ts
import { APP_ID } from "../data";
import {
  bind,
  condApp,
  from,
  guard,
  key,
  to,
  when,
  type Binding,
} from "../engine";

export const globalGuardBinding: Binding = bind(
  from("q", ["left_command"]),
  to(guard(key("q", ["left_command"]))),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["left_command"]),
  to(guard(key("d", ["left_command"]))),
  when(condApp(APP_ID.antinote)),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
```

- [ ] **Step 2: Rewrite `double-tap-guard.test.ts` to assert the known-good guard shape**

Replace the entire `src/tests/double-tap-guard.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { antinoteGuardBinding, globalGuardBinding, guardBindings } from "../definitions/guards";
import { defineBindings } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("guardBindings produces rules with two manipulators per double-tap guard", () => {
  const rules = defineBindings(guardBindings).map(toRule);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].manipulators.length, 2);
  assert.equal(rules[1].manipulators.length, 2);
});

test("globalGuardBinding uses the guard_cmd_q variable and fires the combo on the second press", () => {
  const [rule] = defineBindings([globalGuardBinding]).map(toRule);
  const [secondPress, firstPress]: any[] = rule.manipulators;
  // var name derived from trigger q + left_command
  assert.equal(secondPress.conditions[0].name, "guard_cmd_q");
  assert.equal(secondPress.conditions[0].value, 1);
  // second press fires the real combo in `to` (not to_if_alone), then resets
  assert.equal(secondPress.to[0].key_code, "q");
  assert.deepEqual(secondPress.to[0].modifiers, ["left_command"]);
  assert.equal(secondPress.to[1].set_variable.name, "guard_cmd_q");
  assert.equal(secondPress.to[1].set_variable.value, 0);
  // first press arms the var, delayed-action disarms
  assert.equal(firstPress.conditions[0].name, "guard_cmd_q");
  assert.equal(firstPress.conditions[0].value, 0);
  assert.equal(firstPress.to[0].set_variable.name, "guard_cmd_q");
  assert.equal(firstPress.to[0].set_variable.value, 1);
  assert.equal(firstPress.to_delayed_action.to_if_invoked[0].set_variable.value, 0);
  assert.equal(firstPress.to_delayed_action.to_if_canceled[0].set_variable.value, 0);
});

test("globalGuardBinding uses mandatory left_command from-modifiers", () => {
  const [rule] = defineBindings([globalGuardBinding]).map(toRule);
  for (const m of rule.manipulators) {
    assert.deepEqual(m.from.modifiers, { mandatory: ["left_command"] });
  }
});

test("antinoteGuardBinding adds frontmost application condition to BOTH manipulators", () => {
  const [rule] = defineBindings([antinoteGuardBinding]).map(toRule);
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "Both manipulators should have app condition",
  );
});

test("globalGuardBinding has no app condition when omitted", () => {
  const [rule] = defineBindings([globalGuardBinding]).map(toRule);
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        !m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "No app condition expected for global rule",
  );
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx tsx --test src/tests/double-tap-guard.test.ts`
Expected: PASS — all 5 tests pass (the restored assertions match the `buildGuard` output from Task 2).

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/definitions/guards.ts src/tests/double-tap-guard.test.ts
git commit -c gpgsign=false -m "fix(guards): use guard() to restore double-tap guard semantics"
```

---

### Task 4: Regenerate output and verify the full suite

**Files:**
- Modify: `karabiner-output.json` (regenerated, not hand-edited)

- [ ] **Step 1: Regenerate the output**

Run: `npx tsx src/index.ts`
Expected: prints `✓ Wrote workspace copy: .../karabiner-output.json`.

- [ ] **Step 2: Verify the cmd+q guard matches the known-good shape byte-for-byte**

Run:

```bash
python3 -c "
import json
d = json.load(open('karabiner-output.json'))
for r in d['complex_modifications']['rules']:
    if r['ruleDescription'].startswith('[⌘]+[Q]'):
        ms = r['manipulatorSources']
        assert len(ms) == 2, f'expected 2 manipulators, got {len(ms)}'
        sp, fp = ms
        # second press
        assert sp['conditions'] == [{'type':'variable_if','name':'guard_cmd_q','value':1}], sp['conditions']
        assert sp['to'][0] == {'repeat': False, 'key_code':'q','modifiers':['left_command']}, sp['to'][0]
        assert sp['to'][1]['set_variable']['name'] == 'guard_cmd_q'
        assert sp['to'][1]['set_variable']['value'] == 0
        assert sp['from'] == {'key_code':'q','modifiers':{'mandatory':['left_command']}}
        # first press
        assert fp['conditions'] == [{'type':'variable_if','name':'guard_cmd_q','value':0}], fp['conditions']
        assert fp['parameters'] == {'basic.to_delayed_action_delay_milliseconds':300}, fp['parameters']
        assert fp['to'][0]['set_variable'] == {'name':'guard_cmd_q','value':1}
        assert fp['from'] == {'key_code':'q','modifiers':{'mandatory':['left_command']}}
        assert fp['to_delayed_action']['to_if_invoked'][0]['set_variable'] == {'name':'guard_cmd_q','value':0}
        assert fp['to_delayed_action']['to_if_canceled'][0]['set_variable'] == {'name':'guard_cmd_q','value':0}
        print('CMD+Q GUARD OK')
        break
else:
    raise SystemExit('cmd+q guard rule not found')
"
```

Expected output: `CMD+Q GUARD OK`.

Note on the second-press `to[0]` assertion: the resolved key event from `key("q", ["left_command"])` includes `repeat: false` (the `key()` helper sets it). The known-good paste shows `{"key_code":"q","modifiers":["left_command"]}` without `repeat`, but Karabiner treats `repeat:false` identically and it's the shape `key()` has always produced in this codebase — this is a known, accepted deviation consistent with every other key event in the output. If the assertion fails on the `repeat` key, adjust the expected dict to include `"repeat": False`.

- [ ] **Step 3: Verify the antinote cmd+d guard has the app condition on both manipulators**

```bash
python3 -c "
import json
d = json.load(open('karabiner-output.json'))
for r in d['complex_modifications']['rules']:
    if r['ruleDescription'].startswith('[⌘]+[D]'):
        ms = r['manipulatorSources']
        assert len(ms) == 2
        for m in ms:
            assert m['conditions'][-1]['type'] == 'frontmost_application_if', m['conditions']
            assert 'guard_cmd_d' in [c.get('name') for c in m['conditions']], m['conditions']
        print('ANTINOTE GUARD OK')
        break
else:
    raise SystemExit('cmd+d guard rule not found')
"
```

Expected output: `ANTINOTE GUARD OK`.

- [ ] **Step 4: Run the full test suite**

Run: `npx tsx --test src/tests/*.test.ts`
Expected: All tests PASS **except** the single pre-existing unrelated failure in `src/tests/integration.test.ts` ("generated output includes all critical rule categories" → "Missing tap-hold rules"). Confirm the failure count is exactly 1 and that the failing test name is the pre-existing one. If any OTHER test fails, STOP and investigate.

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add karabiner-output.json
git commit -c gpgsign=false -m "chore: regenerate karabiner-output.json (guard rules restored)"
```

---

## Self-Review

**1. Spec coverage:**
- "DSL: `guard()` case helper marking `CaseBuilder` with `guard: true`" → Task 1 (helper + `Case.guard` + `withGuard`). ✓
- "Engine: `Case.guard` + `ResolvedCase.guard` + `buildGuard(b, resolved)` gated first in `buildManipulators`" → Task 2. ✓
- "Var name `guard_<mod>_<key>` derived, overridable via `guardVar?`" → Task 2 (`deriveGuardVar` + `Binding.guardVar?`). ✓
- "Timeout `guardMs ?? TIMINGS.timeoutDoubleTapMs` (300ms) as `to_delayed_action_delay_milliseconds` on first-press only" → Task 2 (`buildGuard`). ✓
- "`from.modifiers = {mandatory}` via `fromModifiersObj`; hoisted conditions on both manipulators" → Task 2. ✓
- "Definition `guards.ts`: `doubleTap` → `guard`" → Task 3. ✓
- "Restore regression test to known-good shape" → Task 3. ✓
- "Expected output matches known-good byte-for-byte" → Task 4 Step 2/3 verification. ✓

**2. Placeholder scan:** No TBD/TODO. Every code step has complete code. Verification steps have runnable scripts with exact assertions. The `repeat:false` deviation is explicitly called out (not a placeholder). ✓

**3. Type consistency:** `Case.guard` (Task 1) → `ResolvedCase.guard` + `resolveCases` carry (Task 2) → `buildGuard` reads `c.guard` / `guardCase.guard` (Task 2). `guard()` returns `CaseBuilder` (Task 1) consumed by `guards.ts` (Task 3). `Binding.guardVar?`/`guardMs?` (Task 2) — not yet set by any definition (defaults used), consistent. `deriveGuardVar(trigger)` signature matches its call `deriveGuardVar(b.trigger)`. `buildGuard(b, resolved)` matches gate call `buildGuard(b, resolved)`. `TIMINGS.timeoutDoubleTapMs` imported (Task 2 Step 3) and used (Task 2 Step 6). ✓
