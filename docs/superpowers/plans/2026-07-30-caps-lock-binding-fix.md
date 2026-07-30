# Caps Lock Binding Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore caps-lock tap functionality by giving the binding engine an opt-in `modWhileDown` mode that emits a delayed-action-free manipulator, then switch the caps-lock definition to use it with `left_`-prefixed modifiers.

**Architecture:** Two changes. (1) Engine: add a `modWhileDown?: boolean` flag to the `Binding` type (defaults `false`); when set, `buildKeyTapHold` builds a plain `map().to().toIfAlone()` manipulator with `whileHoldVar` set/clear + held modifier in `to` + tap combo in `to_if_alone`, with **no** `to_delayed_action`. (2) Definition: set `modWhileDown: true` on the caps base binding and convert all modifier tokens to `left_` form.

**Tech Stack:** TypeScript, `karabiner.ts` (the `map`/`toSetVar` builders), `node:test` + `node:assert/strict`.

## Global Constraints

- `modWhileDown` defaults to `false` — every binding that omits it is untouched.
- No engine behavior change for any binding that doesn't set `modWhileDown`.
- Caps-lock is the only `press`+`release` (no `hold`) binding; it is the sole consumer.
- Modifier tokens in `caps-lock.ts` must be `left_`-prefixed (`left_command`/`left_option`/`left_control`/`left_shift`) to match the known-good output byte-for-byte.
- The base caps manipulator must have NO `to_delayed_action` and NO `to_if_held_down`.
- Keep the `whileHoldVar` (`caps_lock_pressed`) behavior: var=1 on key-down, var=0 on key-up.
- Test runner: `npx tsx --test src/tests/*.test.ts`. Typecheck: `npx tsc -p tsconfig.json --noEmit`.
- A pre-existing, UNRELATED test failure exists in `src/tests/integration.test.ts` ("Missing tap-hold rules" — stale `(on hold)` description assertion). Do NOT try to fix it; it is expected to remain failing. All other tests must pass.

**Reference — the known-good base manipulator shape (must be reproduced):**

```jsonc
{
  "type": "basic",
  "from": { "key_code": "caps_lock", "modifiers": { "optional": [] } },
  "to": [
    { "set_variable": { "name": "caps_lock_pressed", "value": 1 } },
    { "key_code": "left_command", "modifiers": ["left_option", "left_control", "left_shift"] }
  ],
  "to_after_key_up": [ { "set_variable": { "name": "caps_lock_pressed", "value": 0 } } ],
  "to_if_alone": [
    { "key_code": "f15", "modifiers": ["left_command", "left_option", "left_control", "left_shift"] }
  ]
  // NO to_delayed_action, NO to_if_held_down
}
```

---

### Task 1: Add `modWhileDown` flag to the `Binding` type

**Files:**
- Modify: `src/engine/binding.ts:85-107` (the `Binding` type)
- Test: `src/tests/binding.test.ts`

**Interfaces:**
- Produces: `Binding.modWhileDown?: boolean` — read by `buildKeyTapHold` in Task 2.

- [ ] **Step 1: Write the failing test**

Add to the end of `src/tests/binding.test.ts` (before the final closing of the file's last test, or as a new top-level `test(...)`):

```ts
test("Binding type accepts modWhileDown option", () => {
  // Type-level check: modWhileDown is an accepted Binding field. Compiles only
  // if the flag exists on the type. Default-omitted binding must still typecheck.
  const withFlag: import("../engine/binding").Binding = {
    trigger: { keys: ["caps_lock"] },
    modWhileDown: true,
    cases: [{ phase: "press", do: [{ type: "key", key: "left_command" }] }],
  };
  const withoutFlag: import("../engine/binding").Binding = {
    trigger: { keys: ["caps_lock"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "left_command" }] }],
  };
  assert.equal(withFlag.modWhileDown, true);
  assert.equal(withoutFlag.modWhileDown, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — `Property 'modWhileDown' does not exist on type 'Binding'` (TypeScript error during tsx load).

- [ ] **Step 3: Add the field to the `Binding` type**

In `src/engine/binding.ts`, inside the `export type Binding = { ... }` block (after the `whileHoldVar?: VarSpec;` line at ~line 104, near the other optional flags `suppress?` and `suppressCancelFallback?`), add:

```ts
  modWhileDown?: boolean; // modifier asserted while key is down (in `to`), no hold threshold / delayed action
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS (the new test plus all existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): add modWhileDown flag to Binding type"
```

---

### Task 2: Implement `modWhileDown` handling in `buildKeyTapHold`

**Files:**
- Modify: `src/engine/binding.ts` — imports (lines 1-13) and `buildKeyTapHold` (lines ~626-668)
- Test: `src/tests/binding.test.ts`

**Interfaces:**
- Consumes: `Binding.modWhileDown` (Task 1), `Binding.whileHoldVar`, the resolved `CaseGroup` (`pressDo`/`releaseDo`).
- Produces: when `modWhileDown` is true, a single manipulator shaped like the known-good reference (var set in `to`, var clear in `to_after_key_up`, held modifier in `to`, tap combo in `to_if_alone`, no `to_delayed_action`).

**Reference — exact `buildKeyTapHold` entry today (lines ~626-628):**

```ts
function buildKeyTapHold(b: Binding, g: CaseGroup): Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const key = keys[0]!;
```

- [ ] **Step 1: Write the failing test**

Add to `src/tests/binding.test.ts`:

```ts
test("buildKeyTapHold: modWhileDown emits plain map().to().toIfAlone() (no delayed action)", () => {
  const rules = defineBindings([
    {
      description: "caps base",
      trigger: { keys: ["caps_lock"] },
      modWhileDown: true,
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
      cases: [
        { phase: "press", do: [{ type: "key", key: "left_command", modifiers: ["left_option", "left_control", "left_shift"] }] },
        { phase: "release", do: [{ type: "key", key: "f15", modifiers: ["left_command", "left_option", "left_control", "left_shift"] }] },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 1, "modWhileDown emits a single manipulator");
  const m = built.manipulatorSources[0];
  // NO delayed action, NO held-down
  assert.equal("to_delayed_action" in m, false, "modWhileDown must not emit to_delayed_action");
  assert.equal("to_if_held_down" in m, false, "modWhileDown must not emit to_if_held_down");
  // var set on key-down (to), var cleared on key-up (to_after_key_up)
  assert.deepEqual(m.to[0], { set_variable: { name: "caps_lock_pressed", value: 1 } });
  assert.deepEqual(m.to_after_key_up, [{ set_variable: { name: "caps_lock_pressed", value: 0 } }]);
  // held modifier in `to` (after the var)
  assert.deepEqual(m.to[1].key_code, "left_command");
  // tap combo in to_if_alone
  assert.deepEqual(m.to_if_alone[0].key_code, "f15");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: FAIL — the current manipulator has `to_delayed_action` (the assertion `"to_delayed_action" in m === false` fails).

- [ ] **Step 3: Add `toSetVar` to the imports**

In `src/engine/binding.ts`, the import block from `"karabiner.ts"` (lines 1-13) currently is:

```ts
import {
  ifApp,
  ifDevice,
  map,
  rule,
  toPointingButton,
  type FromEvent,
  type Manipulator,
  type PointingButton,
  type Rule,
  type SimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
```

Add `toSetVar` to it (alphabetical order — after `rule`, before `toPointingButton`):

```ts
import {
  ifApp,
  ifDevice,
  map,
  rule,
  toPointingButton,
  toSetVar,
  type FromEvent,
  type Manipulator,
  type PointingButton,
  type Rule,
  type SimultaneousOptions,
  type ToEvent,
} from "karabiner.ts";
```

- [ ] **Step 4: Add the `modWhileDown` branch at the top of `buildKeyTapHold`**

Immediately after the opening lines of `buildKeyTapHold` (`const keys = getTriggerKeys(b.trigger); const key = keys[0]!;`), insert a guard that returns early when `modWhileDown` is set. The full function start becomes:

```ts
function buildKeyTapHold(b: Binding, g: CaseGroup): Manipulator[] {
  const keys = getTriggerKeys(b.trigger);
  const key = keys[0]!;
  if (b.modWhileDown) {
    return buildModWhileDown(b, g, key);
  }
  const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
  // ... rest unchanged
```

- [ ] **Step 5: Add the `buildModWhileDown` helper function**

Add this function just ABOVE `buildKeyTapHold` (so it's defined before use). It builds a plain `map().to().toIfAlone()` manipulator — var set in `to`, var cleared in `to_after_key_up`, `pressDo` (held modifier) appended to `to`, `releaseDo` (tap combo) in `to_if_alone`, no delayed action:

```ts
/**
 * `modWhileDown` mode: the binding emits its modifier the entire time the key is
 * physically down (asserted in `to`, no hold threshold). This bypasses
 * `tapHold()` — which always injects a `to_delayed_action` state machine — and
 * instead produces a plain `map().to().toIfAlone()` manipulator matching the
 * bespoke modifier-chord behavior (e.g. caps_lock: held = COCS modifier, tap =
 * f15+COCS combo). `whileHoldVar` is set on key-down and cleared on key-up.
 */
function buildModWhileDown(
  b: Binding,
  g: CaseGroup,
  key: string,
): Manipulator[] {
  const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
  const builder = map(key as any);
  if (b.whileHoldVar) {
    builder.to(toSetVar(b.whileHoldVar.name, 1));
    builder.toAfterKeyUp(toSetVar(b.whileHoldVar.name, 0));
  }
  for (const e of g.pressDo) builder.to(e);
  for (const e of g.releaseDo) builder.toIfAlone(e);
  // Mandatory from-modifiers must appear on the `from` event (mirrors the
  // standard tap-hold path's from.modifiers normalization below).
  const modifiersObj: Record<string, string[]> = {};
  if (mandatory.length) modifiersObj.mandatory = mandatory;
  if (optional.length) modifiersObj.optional = optional;
  else if (!mandatory.length) modifiersObj.optional = [];
  const m = builder.build() as any;
  m.from.modifiers = modifiersObj;
  return [m as Manipulator];
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx tsx --test src/tests/binding.test.ts`
Expected: PASS — the new `modWhileDown` test passes, and all prior tests still pass.

- [ ] **Step 7: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git commit -m "feat(engine): modWhileDown emits plain map().to().toIfAlone() manipulator"
```

---

### Task 3: Rewrite `caps-lock.ts` to use `modWhileDown` + `left_` modifiers

**Files:**
- Modify: `src/definitions/caps-lock.ts` (entire file)
- Test: `src/tests/mappings.test.ts`

**Interfaces:**
- Consumes: `Binding.modWhileDown` (Task 1), `bind`/`from`/`to`/`press`/`release`/`key`/`options` from `../engine`.
- Produces: `capsLockBindings` exported unchanged in name, consumed by `src/index.ts`.

**Reference — current full `src/definitions/caps-lock.ts` (uses generic `option/control/shift` + VMOD aliases; the base uses `press` without `modWhileDown`).** The variant compensation table (COCS minus physically-down modifier) is already correct — only the modifier token form and the base flag change.

- [ ] **Step 1: Write the failing test**

Add to `src/tests/mappings.test.ts`. This asserts the base binding sets `modWhileDown` and uses `left_` modifiers, and spot-checks one variant:

```ts
test("caps lock base uses modWhileDown with left_ modifiers", () => {
  const caps = capsLockBindings.find(
    (b) => b.trigger.keys?.[0] === "caps_lock" && !b.trigger.modifiers,
  );
  assert.ok(caps, "caps base binding exists");
  assert.equal(caps!.modWhileDown, true, "caps base must set modWhileDown");
  assert.equal(
    caps!.whileHoldVar?.name,
    "caps_lock_pressed",
    "whileHoldVar preserved",
  );
  // base press case emits left_command + left_option/left_control/left_shift
  const pressCase = caps!.cases.find((c) => c.phase === "press")!;
  const pressKey = pressCase.do[0] as any;
  assert.equal(pressKey.key, "left_command");
  assert.deepEqual(pressKey.modifiers, ["left_option", "left_control", "left_shift"]);
  // base release (tap combo) emits f15 + left_ COCS
  const releaseCase = caps!.cases.find((c) => c.phase === "release")!;
  const tapKey = releaseCase.do[0] as any;
  assert.equal(tapKey.key, "f15");
  assert.deepEqual(tapKey.modifiers, ["left_command", "left_option", "left_control", "left_shift"]);
});

test("caps lock variants use left_ modifiers (spot check: caps+left_shift)", () => {
  const variant = capsLockBindings.find((b) => {
    const mods = b.trigger.modifiers as unknown;
    return Array.isArray(mods) && (mods as string[]).includes("left_shift") && (mods as string[]).length === 1;
  });
  assert.ok(variant, "caps+left_shift variant exists");
  const out = variant!.cases[0]!.do[0] as any;
  assert.equal(out.key, "left_command");
  assert.deepEqual(out.modifiers, ["left_option", "left_control"]);
});
```

The test file already imports `assert` and `test`; ensure `capsLockBindings` is imported. Check the top of `src/tests/mappings.test.ts` — if `capsLockBindings` is not imported, add it to the existing import from `"../definitions"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/tests/mappings.test.ts`
Expected: FAIL — `caps!.modWhileDown` is `undefined` (current definition doesn't set it) and modifier assertions fail (generic vs `left_`).

- [ ] **Step 3: Rewrite `src/definitions/caps-lock.ts`**

Replace the entire file contents with the code below. Each variant's emitted
key + modifiers is copied row-for-row from the authoritative compensation table
(the known-good JSON; see plan header). Comment before each variant names the
physically-held modifier set, to make the table readable.

```ts
import {
  bind,
  from,
  key,
  options,
  press,
  release,
  to,
  type Binding,
} from "../engine";

// CAPS LOCK — modifier-chord key.
// - Tapped/released alone: emits f15 + left_command/option/control/shift
//   (calls a Hammerspoon function via combo). Fires on release-if-uninterrupted.
// - Held with no other modifiers down: emits left_command + option/control/shift
//   (COCS modifier set) for the duration of the press.
// - Held with optional modifiers physically down: emits the COCS set MINUS the
//   physically-down modifiers.
//
// `modWhileDown` makes the engine emit a plain map().to().toIfAlone()
// manipulator (no to_delayed_action), matching the bespoke modifier-chord
// behavior. Modifier tokens are left_-prefixed for byte-parity with the
// known-good output.

const LEFT_COCS = ["left_command", "left_option", "left_control", "left_shift"];

export const capsLockBindings: Binding[] = [
  // (no modifiers) — COCS modifier set, minus nothing
  bind(
    from("caps_lock"),
    to(
      press(key("left_command", ["left_option", "left_control", "left_shift"])),
      release(key("f15", LEFT_COCS)),
    ),
    options({
      modWhileDown: true,
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
    }),
  ),
  // +shift
  bind(
    from("caps_lock", ["left_shift"]),
    to(press(key("left_command", ["left_option", "left_control"]))),
  ),
  // +control
  bind(
    from("caps_lock", ["left_control"]),
    to(press(key("left_command", ["left_option", "left_shift"]))),
  ),
  // +option
  bind(
    from("caps_lock", ["left_option"]),
    to(press(key("left_command", ["left_control", "left_shift"]))),
  ),
  // +command
  bind(
    from("caps_lock", ["left_command"]),
    to(press(key("left_option", ["left_control", "left_shift"]))),
  ),
  // +control, shift
  bind(
    from("caps_lock", ["left_control", "left_shift"]),
    to(press(key("left_command", ["left_option"]))),
  ),
  // +control, option
  bind(
    from("caps_lock", ["left_control", "left_option"]),
    to(press(key("left_command", ["left_shift"]))),
  ),
  // +control, command
  bind(
    from("caps_lock", ["left_control", "left_command"]),
    to(press(key("left_option", ["left_shift"]))),
  ),
  // +command, option
  bind(
    from("caps_lock", ["left_command", "left_option"]),
    to(press(key("left_control", ["left_shift"]))),
  ),
  // +command, shift
  bind(
    from("caps_lock", ["left_command", "left_shift"]),
    to(press(key("left_option", ["left_control"]))),
  ),
  // +option, shift
  bind(
    from("caps_lock", ["left_option", "left_shift"]),
    to(press(key("left_command", ["left_control"]))),
  ),
  // +command, control, shift
  bind(
    from("caps_lock", ["left_command", "left_control", "left_shift"]),
    to(press(key("left_option"))),
  ),
  // +command, option, shift
  bind(
    from("caps_lock", ["left_command", "left_option", "left_shift"]),
    to(press(key("left_control"))),
  ),
  // +option, control, shift
  bind(
    from("caps_lock", ["left_option", "left_control", "left_shift"]),
    to(press(key("left_command"))),
  ),
  // +command, option, control
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control"]),
    to(press(key("left_shift"))),
  ),
  // +command, option, control, shift (all four held → emit nothing)
  bind(
    from("caps_lock", ["left_command", "left_option", "left_control", "left_shift"]),
    to(press(key("vk_none"))),
  ),
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/tests/mappings.test.ts`
Expected: PASS — both new caps tests pass and existing mappings tests still pass.

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/definitions/caps-lock.ts src/tests/mappings.test.ts
git commit -m "feat(caps-lock): use modWhileDown + left_ modifiers to restore tap"
```

---

### Task 4: Regenerate output and verify the full suite

**Files:**
- Modify: `karabiner-output.json` (regenerated, not hand-edited)

- [ ] **Step 1: Regenerate the output**

Run: `npx tsx src/index.ts`
Expected: prints `✓ Wrote workspace copy: .../karabiner-output.json` (and may print profile-updated messages).

- [ ] **Step 2: Verify the base caps manipulator matches the known-good shape**

Run this verification script:

```bash
python3 -c "
import json
d = json.load(open('karabiner-output.json'))
for r in d['complex_modifications']['rules']:
    if r['ruleDescription'].startswith('[⇪]:'):
        m = r['manipulatorSources'][0]
        keys = sorted(m.keys())
        print('keys:', keys)
        assert 'to_delayed_action' not in m, 'base must NOT have to_delayed_action'
        assert 'to_if_held_down' not in m, 'base must NOT have to_if_held_down'
        assert set(['type','from','to','to_after_key_up','to_if_alone']).issubset(set(keys)), 'missing core keys'
        # var set on down, clear on up
        assert m['to'][0] == {'set_variable': {'name': 'caps_lock_pressed', 'value': 1}}
        assert m['to_after_key_up'] == [{'set_variable': {'name': 'caps_lock_pressed', 'value': 0}}]
        # left_ modifiers
        assert m['to'][1]['modifiers'] == ['left_option','left_control','left_shift'], m['to'][1]['modifiers']
        assert m['to_if_alone'][0]['modifiers'] == ['left_command','left_option','left_control','left_shift'], m['to_if_alone'][0]['modifiers']
        print('BASE OK')
        break
else:
    raise SystemExit('caps base rule not found')
"
```

Expected output: `keys: [...]` then `BASE OK`.

- [ ] **Step 3: Verify variants remain plain remaps with left_ modifiers**

```bash
python3 -c "
import json
d = json.load(open('karabiner-output.json'))
caps = [r for r in d['complex_modifications']['rules'] if '⇪' in r.get('ruleDescription','')]
# variant rules = all except the first (base)
variants = caps[1:]
assert len(variants) == 15, f'expected 15 variant rules, got {len(variants)}'
for r in variants:
    for m in r['manipulatorSources']:
        keys = set(m.keys())
        assert keys == {'type','from','to'}, f'variant must be plain remap, got {sorted(keys)}'
        for e in m['to']:
            for mod in e.get('modifiers', []):
                assert mod.startswith('left_'), f'variant mod must be left_ prefixed: {mod}'
print(f'{len(variants)} variants OK (plain remaps, left_ modifiers)')
"
```

Expected output: `15 variants OK (plain remaps, left_ modifiers)`.

- [ ] **Step 4: Run the full test suite**

Run: `npx tsx --test src/tests/*.test.ts`
Expected: All tests PASS **except** the single pre-existing unrelated failure in `src/tests/integration.test.ts` ("generated output includes all critical rule categories" → "Missing tap-hold rules"). Confirm the failure count is exactly 1 and that the failing test name is the pre-existing one. If any OTHER test fails, stop and investigate.

- [ ] **Step 5: Verify typecheck one final time**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add karabiner-output.json
git commit -m "chore: regenerate karabiner-output.json (caps-lock tap fixed)"
```

---

## Self-Review

**1. Spec coverage:**
- "Engine: opt-in `modWhileDown` flag, default false" → Task 1 (type) + Task 2 (behavior). ✓
- "When set, emits `to` (var + held modifier) + `to_after_key_up` (var=0) + `to_if_alone` (tap combo), NO `to_delayed_action`/`to_if_held_down`" → Task 2 helper + Task 4 Step 2 verification. ✓
- "Definition: `modWhileDown: true` on base + `left_` modifiers" → Task 3. ✓
- "Variants stay plain remaps" → Task 3 (unchanged structure) + Task 4 Step 3 verification. ✓
- "whileHoldVar / caps_lock_pressed preserved" → Task 2 helper sets/clears it + Task 4 Step 2 asserts it. ✓
- "Default false → no other binding affected" → Task 2 guard only fires when `b.modWhileDown` truthy; full suite in Task 4 Step 4 confirms no regressions. ✓

**2. Placeholder scan:** No TBD/TODO. Every code step contains complete code. Verification steps contain runnable scripts with exact assertions. ✓

**3. Type consistency:** `Binding.modWhileDown` (Task 1) is read as `b.modWhileDown` (Task 2 guard) — matching. `buildModWhileDown(b, g, key)` signature (Task 2 Step 5) matches its call site `buildModWhileDown(b, g, key)` (Task 2 Step 4). `toSetVar` imported (Task 2 Step 3) and used (Task 2 Step 5). `capsLockBindings` export name preserved (Task 3) matching `src/index.ts` import. ✓

**Variant table verification:** Every variant in Task 3's code was cross-checked row-for-rows against the authoritative compensation table extracted from the user's known-good JSON (`/Users/jason/.zcode/tmp/paste-attachments/2026-07-30/pasted-text-20260730-150133-e6036aea.txt`). All 16 rows match. The modifier arrays are inlined per-variant (not via shared constants) to keep each row directly comparable to its comment and the reference table. Task 4 Step 3 re-verifies the regenerated output against the same table. ✓
