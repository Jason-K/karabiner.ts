# Mouse Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the mouse under the `Binding[]` + `defineBindings` paradigm: a `buttons` registry with `nameScope`-derived device conditions, a `setVar` action, `whileHoldVar`/`suppress` Binding fields, `Condition.device`, and the 12 G502X mappings authored as plain `Binding[]` literals — deleting the bespoke `core/mouse.ts` + `engine/mouse-rules.ts`.

**Architecture:** Five foundational tasks add capabilities (each byte-identical, since no existing binding uses them): device registry → `DeviceSpec`, `setVar` action, `Condition.device`, button registry + pointer-alias resolution + `nameScope`-derived device condition, and `whileHoldVar`/`suppress`. Then the G502X mappings migrate to `Binding[]` (structural-diff gated), the double-tap gets a delayed-single-tap mechanism, and the bespoke mouse engine/types/tests are deleted.

**Tech Stack:** TypeScript, `karabiner.ts`, `node:test` (`tsx --test`), `tsx`, `jq` for the description-agnostic structural diff.

## Global Constraints

- **Foundational tasks (1–5) are byte-identical:** after each, `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json` is **empty** (no existing binding uses the new capability yet).
- **Migration tasks (6–8) use the description-agnostic structural gate:** events/triggers/conditions identical to today.
  ```bash
  CI=true npx tsx src/index.ts
  jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/mouse-N.json
  diff /tmp/mouse-baseline.json /tmp/mouse-N.json   # /tmp/mouse-baseline.json captured in Task 6 Step 0
  ```
  Expected: **empty**. Capture `/tmp/mouse-baseline.json` from the current HEAD before Task 6.
- **Never `npm run build`** during iteration (writes the live profile + reloads Hammerspoon). Use `CI=true npx tsx src/index.ts`.
- **Tests gate:** `npm run typecheck && npm run lint && npm test` green throughout (currently 133 pass / 0 fail / 6 skipped).
- **Commits unsigned:** `git -c commit.gpgsign=false commit …`.
- **Karabiner device identifiers** accept only `product_id`/`vendor_id`/`is_keyboard?` — any `DeviceSpec` fed to Karabiner MUST be stripped via the `karabinerDeviceId()` helper (Task 1).

**Spec:** `docs/superpowers/specs/2026-07-23-mouse-unification-design.md`.

---

## File Structure

- **Modify `src/data/devices.ts`** — `DEVICE_IDENTIFIERS` → `Record<string, DeviceSpec>` + `karabinerDeviceId()` helper.
- **Modify `src/core/action-dsl.ts`** — add `setVar` variant.
- **Modify `src/engine/action-resolver.ts`** — resolve `setVar`.
- **Modify `src/engine/binding.ts`** — `Condition.device` arm; pointer-alias resolution in `triggerToFrom`; `nameScope`-derived device condition in `buildManipulators`; `whileHoldVar`/`suppress`/`suppressCancelFallback` in `buildTapHold`/`buildRemap`.
- **Modify `src/engine/description-synthesizer.ts`** — `setVar` action label; `device` condition label; pointer button label.
- **Rewrite `src/data/mouse.ts`** — `buttons` registry + `defaultButtonNames` (replace the `Mouse*` config types; keep `WIN_ACTIVATE_UNDER_CURSOR`).
- **Rewrite `src/definitions/mouse.ts`** — `mouseBindings: Binding[]` (the 12 G502X mappings as literals).
- **Modify `src/definitions/index.ts`** + **`src/index.ts`** — export + consume `mouseBindings` via `defineBindings`.
- **Delete** `src/core/mouse.ts`, `src/engine/mouse-rules.ts`, `src/tests/mouse.test.ts`.

---

## Task 1: Device registry → `DeviceSpec` + `karabinerDeviceId()` (completes Phase 1 deferral)

`DEVICE_IDENTIFIERS` is currently raw `{product_id, vendor_id, is_keyboard?}`. Promote it to `DeviceSpec` (add `name`/`deviceDesc`) and add a strip helper so Karabiner-facing usages stay byte-identical.

**Files:**
- Modify: `src/data/devices.ts`, `src/data/refs.ts` (DeviceSpec lives here from Phase 1), `src/index.ts`, `src/definitions/mouse.ts`, `src/engine/mouse-rules.ts`

**Interfaces:**
- Produces: `DEVICE_IDENTIFIERS: Record<string, DeviceSpec>`; `karabinerDeviceId(spec: DeviceSpec): { product_id: number; vendor_id: number; is_keyboard?: boolean }`.

- [ ] **Step 1: Confirm `DeviceSpec` shape** — `rg -n "DeviceSpec" src/data/refs.ts` shows `{ name; deviceDesc; product_id; vendor_id; is_keyboard? }`. (It does, from Phase 1.)

- [ ] **Step 2: Rewrite `src/data/devices.ts`**

```ts
import type { DeviceSpec } from "./refs";

/** Strip a DeviceSpec to the shape Karabiner accepts as a device identifier. */
export function karabinerDeviceId(spec: DeviceSpec): {
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
} {
  const id: { product_id: number; vendor_id: number; is_keyboard?: boolean } = {
    product_id: spec.product_id,
    vendor_id: spec.vendor_id,
  };
  if (spec.is_keyboard) id.is_keyboard = true;
  return id;
}

export const DEVICE_IDENTIFIERS = {
  appleNumericKeypad: {
    name: "appleNumericKeypad",
    deviceDesc: "Apple numeric keypad",
    vendor_id: 76,
    product_id: 802,
    is_keyboard: true,
  },
  logitechG502X: {
    name: "logitechG502X",
    deviceDesc: "Logitech G502 X",
    product_id: 49305,
    vendor_id: 1133,
  },
} as const satisfies Record<string, DeviceSpec>;

export const APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS = [
  // …keep the existing array verbatim…
] as const;
```
(Keep `APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS` entries exactly as today.)

- [ ] **Step 3: Strip at Karabiner-facing usages**

`src/index.ts` device config:
```ts
const deviceConfigs: DeviceConfig[] = [
  { identifiers: karabinerDeviceId(DEVICE_IDENTIFIERS.appleNumericKeypad),
    simple_modifications: [...APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS] },
];
```
(add `karabinerDeviceId` to the `./data` import.)
`src/definitions/mouse.ts`: change `identifiers: DEVICE_IDENTIFIERS.logitechG502X` → `identifiers: karabinerDeviceId(DEVICE_IDENTIFIERS.logitechG502X)` (import `karabinerDeviceId`). The bespoke `mouse-rules.ts` passes `device.identifiers` straight to `ifDevice` — already a raw id object from `MouseDeviceConfig`, so unaffected (it doesn't use `DEVICE_IDENTIFIERS` directly).

- [ ] **Step 4: Gate + commit**

Run: `npm run typecheck && npm run lint && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: clean / **empty** (the strip preserves the exact Karabiner identifiers).
```bash
git add src/data/devices.ts src/data/refs.ts src/index.ts src/definitions/mouse.ts
git -c commit.gpgsign=false commit -m "refactor(data): migrate DEVICE_IDENTIFIERS to DeviceSpec + karabinerDeviceId helper"
```

---

## Task 2: `setVar` action

First-class variable-setting action (useful beyond mouse). Add the variant, resolve it, describe it.

**Files:**
- Modify: `src/core/action-dsl.ts`, `src/engine/action-resolver.ts`, `src/engine/description-synthesizer.ts`
- Test: `src/tests/description-synthesizer.test.ts`

**Interfaces:**
- Produces: `ActionSpec` variant `{ type: "setVar"; var: VarSpec; value?: number | string | boolean; toggle?: boolean }`; `describeAction` renders it.

- [ ] **Step 1: Add the variant to `ActionSpec`** in `src/core/action-dsl.ts` (before `sequence`):
```ts
  | {
      type: "setVar";
      var: VarSpec;
      value?: number | string | boolean;
      toggle?: boolean;
    }
```
(add `VarSpec` to the imports from `../data`.)

- [ ] **Step 2: Resolve it** in `src/engine/action-resolver.ts` `resolveActionToEvents`:
```ts
    case "setVar": {
      const id: Record<string, unknown> = { name: action.var.name };
      id.value = action.toggle ? { variable_value: "toggle" } : (action.value ?? 1);
      return [{ set_variable: id } as unknown as ToEvent];
    }
```
(Karabiner `set_variable`: `{ set_variable: { name, value } }`. For toggle, Karabiner accepts `value: "toggle"`; for unset, `value: 0`.) Import `VarSpec` type if needed for narrowing (not required — `action.var` is typed by ActionSpec).

- [ ] **Step 3: Describe it** in `src/engine/description-synthesizer.ts` `describeAction`:
```ts
    case "setVar":
      return `Set ${action.var.varDesc}`;
```
(Add a `setVar` test to `description-synthesizer.test.ts`: `describeAction({ type: "setVar", var: { name: "x", varDesc: "Right button held" } }) === "Set Right button held"`; and a toggle/value case if desired.)

- [ ] **Step 4: Gate + commit** — typecheck/lint/test green, `git diff --stat karabiner-output.json` empty.
```bash
git add src/core/action-dsl.ts src/engine/action-resolver.ts src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(actions): add setVar action variant"
```

---

## Task 3: `Condition.device` arm + synthesizer device label

Implement the reserved device condition + its description.

**Files:**
- Modify: `src/engine/binding.ts` (`resolveCondition`), `src/engine/description-synthesizer.ts`

**Interfaces:**
- Produces: `resolveCondition({device: DeviceSpec, unless?})` → `ifDevice(karabinerDeviceId(spec)).unless()?`; `describeConditionGroup` renders `on <deviceDesc>` / `not on <deviceDesc>`.

- [ ] **Step 1: Implement the device arm** in `src/engine/binding.ts` `resolveCondition` (replace the `throw`):
```ts
import { ifDevice } from "karabiner.ts";
import { karabinerDeviceId, type DeviceSpec } from "../data";   // add to imports
// …
  if ("device" in c) {
    return c.unless
      ? ifDevice(karabinerDeviceId(c.device)).unless().build()
      : ifDevice(karabinerDeviceId(c.device)).build();
  }
```
And widen the `Condition` `device` arm from `{ device: string; unless?: boolean }` to `{ device: DeviceSpec; unless?: boolean; description?: string }`.

- [ ] **Step 2: Describe it** in `src/engine/description-synthesizer.ts` `describeConditionGroup` (replace the `return "device";` placeholder):
```ts
    if ("device" in c) {
      const d = c as Extract<Condition, { device: unknown }>;
      return d.unless ? `not on ${d.device.deviceDesc}` : `on ${d.device.deviceDesc}`;
    }
```

- [ ] **Step 3: Test** — add to `description-synthesizer.test.ts`:
```ts
test("describeConditionGroup: device if/unless", () => {
  const dev = { name: "logitechG502X", deviceDesc: "Logitech G502 X", product_id: 49305, vendor_id: 1133 };
  assert.equal(describeConditionGroup([{ device: dev as any }]), "on Logitech G502 X");
  assert.equal(describeConditionGroup([{ device: dev as any, unless: true }]), "not on Logitech G502 X");
});
```

- [ ] **Step 4: Gate + commit** — green, snapshot empty.
```bash
git add src/engine/binding.ts src/engine/description-synthesizer.ts src/tests/description-synthesizer.test.ts
git -c commit.gpgsign=false commit -m "feat(conditions): implement Condition.device arm + label"
```

---

## Task 4: Button registry + pointer-alias resolution + `nameScope` device condition + button labels

The core of the unification's trigger model. Adds the registry; `triggerToFrom` resolves aliases; `buildManipulators` derives the device condition; the synthesizer labels buttons.

**Files:**
- Modify: `src/data/mouse.ts` (add `buttons` + `defaultButtonNames` alongside the old types for now), `src/engine/binding.ts` (`triggerToFrom`, `buildManipulators`), `src/engine/description-synthesizer.ts` (`describeTrigger`)
- Test: `src/tests/binding-helpers.test.ts` or a new `src/tests/mouse-binding.test.ts`

**Interfaces:**
- Produces: `buttons` registry, `defaultButtonNames`, `resolveButton(pointer)` helper; `Trigger.pointer` aliases resolve + derive device conditions.

- [ ] **Step 1: Add the registry** to `src/data/mouse.ts` (keep the old `Mouse*` types for now — deleted in Task 8):
```ts
import type { PointingButton } from "karabiner.ts";
import type { DeviceSpec } from "./refs";

export type DeviceName = keyof typeof import("./devices").DEVICE_IDENTIFIERS;

export type ButtonSpec = {
  button: PointingButton;
  nameScope: "global" | DeviceName[];
  desc: string;
};

export const buttons = {
  left:        { button: "button1",  nameScope: "global",                 desc: "Left click" },
  right:       { button: "button2",  nameScope: "global",                 desc: "Right click" },
  middle:      { button: "button3",  nameScope: "global",                 desc: "Middle click" },
  wheel:       { button: "button3",  nameScope: "global",                 desc: "Wheel click" },
  back:        { button: "button4",  nameScope: "global",                 desc: "Back button" },
  shift:       { button: "button5",  nameScope: ["logitechG502X"],        desc: "Shift button" },
  forward:     { button: "button6",  nameScope: ["logitechG502X"],        desc: "Forward button" },
  wheelLeft:   { button: "button7",  nameScope: ["logitechG502X"],        desc: "Wheel left" },
  wheelRight:  { button: "button8",  nameScope: ["logitechG502X"],        desc: "Wheel right" },
  middleBack:  { button: "button9",  nameScope: ["logitechG502X"],        desc: "Middle-back (G9)" },
  leftForward: { button: "button10", nameScope: ["logitechG502X"],        desc: "Left-forward (G8)" },
  leftBack:    { button: "button11", nameScope: ["logitechG502X"],        desc: "Left-back (G7)" },
} as const satisfies Record<string, ButtonSpec>;

export const defaultButtonNames: Record<string, string> = {
  button1: "Left click", button2: "Right click", button3: "Middle click",
};

/** Resolve a pointer trigger alias/raw → { button, nameScope? }. Raw buttons have no nameScope. */
export function resolveButton(pointer: string): { button: string; nameScope?: ButtonSpec["nameScope"]; desc: string } {
  const spec = (buttons as Record<string, ButtonSpec>)[pointer];
  if (spec) return { button: spec.button, nameScope: spec.nameScope, desc: spec.desc };
  return { button: pointer, desc: defaultButtonNames[pointer] ?? pointer };
}
```
(Use `import("./devices").DEVICE_IDENTIFIERS` inline for `DeviceName` to avoid a cycle, or import normally — `data/mouse.ts` already imports from `./refs`; a `./devices` import is fine.)

- [ ] **Step 2: Resolve aliases in `triggerToFrom`** (`src/engine/binding.ts`):
```ts
import { resolveButton } from "../data/mouse";
// …in triggerToFrom, pointer branch:
  if ("pointer" in trigger) {
    const { button } = resolveButton(trigger.pointer);
    const from: Record<string, unknown> = { pointing_button: button };
    if (trigger.modifiers?.length) from.modifiers = { mandatory: trigger.modifiers };
    return from as FromEvent;
  }
```

- [ ] **Step 3: Derive the device condition in `buildManipulators`** — add a helper and stamp it onto every manipulator for pointer bindings:
```ts
import { DEVICE_IDENTIFIERS } from "../data";
import { karabinerDeviceId } from "../data/devices";
import { ifDevice } from "karabiner.ts";

/** device_if condition(s) derived from a pointer alias's nameScope (undefined for global/raw). */
function nameScopeDeviceConditions(trigger: Trigger): unknown[] {
  if (!("pointer" in trigger)) return [];
  const { nameScope } = resolveButton(trigger.pointer);
  if (!nameScope || nameScope === "global") return [];
  const ids = nameScope.map((n) => karabinerDeviceId(DEVICE_IDENTIFIERS[n]));
  return [ifDevice(ids).build()];
}
```
In `buildManipulators`, after each path produces its manipulators, prepend these conditions. Simplest: compute `const devConds = nameScopeDeviceConditions(b.trigger);` at the top and, in `buildRemap`/`buildTapHold`/`buildMultiTap`/`buildSimultaneousTapHold`, push `devConds` onto each manipulator's `conditions` (mirror how `attachConditions`/`stampLabel` work). For `buildRemap` non-pointer there are no devConds; for pointer (onepiece uses raw `button1` → no nameScope → none; G502X aliases → G502X condition).

- [ ] **Step 4: Label buttons in the synthesizer** (`describeTrigger` in `description-synthesizer.ts`):
```ts
import { resolveButton } from "../data/mouse";
// …pointer branch:
  if ("pointer" in trigger) {
    const symbols = modSymbols(trigger.modifiers);
    const { desc } = resolveButton(trigger.pointer);
    return symbols ? `[${symbols}]+${desc}:` : `${desc}:`;
  }
```
(Replaces the `"Click:"`/`"Pointer <x>:"` heuristic; now uses `ButtonSpec.desc`/`defaultButtonNames`. Update the existing `describeTrigger: pointer` tests: `{ pointer: "button1" }` → `"Left click:"`; `{ pointer: "button1", modifiers: ["left_command"] }` → `"[←⌘]+Left click:"`.)

- [ ] **Step 5: Tests** — add to `binding-helpers.test.ts` (or a new test file):
```ts
test("resolveButton: alias + nameScope + raw fallback", () => {
  const { buttons, resolveButton, defaultButtonNames } = require("../data/mouse");
  assert.equal(resolveButton("shift").button, "button5");
  assert.deepEqual(resolveButton("shift").nameScope, ["logitechG502X"]);
  assert.equal(resolveButton("left").nameScope, "global");
  assert.equal(resolveButton("button99").button, "button99");
});
```
Add a `defineBindings` integration test: a pointer-alias binding produces a `device_if` condition:
```ts
test("defineBindings: device-specific button alias auto-scopes via nameScope", () => {
  const rules = defineBindings([{ trigger: { pointer: "shift" }, cases: [{ phase: "hold", do: [{ type: "noop" }] }] }]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.deepEqual(m.conditions?.find((c: any) => c.type === "device_if")?.identifiers,
    [{ product_id: 49305, vendor_id: 1133 }]);
});
```

- [ ] **Step 6: Gate + commit** — typecheck/lint/test green; **`git diff --stat karabiner-output.json` empty** (onepiece uses raw `button1` → unaffected; no device-scoped alias used yet).
```bash
git add src/data/mouse.ts src/engine/binding.ts src/engine/description-synthesizer.ts src/tests/binding-helpers.test.ts
git -c commit.gpgsign=false commit -m "feat(mouse): button registry + pointer-alias resolution + nameScope device condition"
```

---

## Task 5: `whileHoldVar` + `suppress` (Binding/Case) + `suppressCancelFallback`

The chord-modifier lifecycle + suppression levers.

**Files:**
- Modify: `src/engine/binding.ts` (`Binding`/`Case` types, `buildTapHold`, `buildRemap`)

**Interfaces:**
- Produces: `Binding.whileHoldVar?: VarSpec`, `Binding.suppress?: boolean`, `Binding.suppressCancelFallback?: boolean`, `Case.suppress?: boolean`.

- [ ] **Step 1: Add the fields** to `Binding` + `Case` in `src/engine/binding.ts`:
```ts
export type Binding = {
  // …existing…
  whileHoldVar?: VarSpec;          // tap-hold: set 1 on key-down, 0 on key-up
  suppress?: boolean;              // emit only `do`, no trigger fallback (tap-hold default-alone)
  suppressCancelFallback?: boolean;// clear to_if_canceled (chord-modifier buttons)
};
export type Case = {
  // …existing…
  suppress?: boolean;
};
```

- [ ] **Step 2: Forward `whileHoldVar` + honor `suppressCancelFallback` in `buildTapHold`**:
```ts
  const manipulators = tapHold({
    key,
    alone,
    hold,
    timeoutMs: b.timing?.aloneMs,
    thresholdMs: b.timing?.heldThresholdMs,
    ...(b.whileHoldVar ? { variable: b.whileHoldVar.name } : {}),
  }).build();
  // …existing mandatory-mods + conditions + stampLabel…
  if (b.suppressCancelFallback) {
    manipulators.forEach((m: any) => {
      if (m.to_delayed_action?.to_if_canceled) m.to_delayed_action.to_if_canceled = [];
    });
  }
  if (b.suppress) {
    manipulators.forEach((m: any) => { m.to_if_alone = []; });
  }
```
(`tapHold` already accepts + forwards `variable` to `tapHoldFrom` — confirmed in `core/tap-hold.ts`. `whileHoldVar.name` is the variable name.)

- [ ] **Step 3: Honor `suppress` in `buildRemap`** — when set, ensure no trigger fallback (for remap, `to` already replaces `from`, so `suppress` mostly future-proofs the flag; add the field read so it typechecks, no behavioral change needed for remap today).

- [ ] **Step 4: Test** — `buildTapHold` with `whileHoldVar` sets the variable on down/up; `suppressCancelFallback` empties `to_if_canceled`; `suppress` empties `to_if_alone`. Add to `binding.test.ts`:
```ts
test("buildTapHold: whileHoldVar + suppressCancelFallback", () => {
  const rules = defineBindings([{
    trigger: { keys: ["x"] }, whileHoldVar: { name: "x_down", varDesc: "X down" },
    suppressCancelFallback: true,
    cases: [{ phase: "release", do: [{ type: "key", key: "x" }] }],
  }]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.ok(m.to?.some((e: any) => e.set_variable?.name === "x_down"));
  assert.deepEqual(m.to_delayed_action?.to_if_canceled, []);
});
```

- [ ] **Step 5: Gate + commit** — green, snapshot empty (no caller).
```bash
git add src/engine/binding.ts src/tests/binding.test.ts
git -c commit.gpgsign=false commit -m "feat(binding): whileHoldVar + suppress + suppressCancelFallback"
```

---

## Task 6: Migrate G502X tap-hold / remap / simultaneous mappings → `Binding[]`

Capture the baseline, then convert the 10 non-double-tap G502X mappings to `Binding[]` literals and rewire `index.ts`. (The left-button double-tap is Task 7.)

**Files:**
- Rewrite: `src/definitions/mouse.ts` (the `mappings` array → `mouseBindings: Binding[]`)
- Modify: `src/definitions/index.ts`, `src/index.ts`

- [ ] **Step 0: Capture the baseline**
```bash
CI=true npx tsx src/index.ts
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/mouse-baseline.json
```

- [ ] **Step 1: Transformation rules** (apply to each mapping):

  **tapHold → Binding** (the common case):
  - `button: "shift"` → `trigger: { pointer: "shift" }` (alias auto-scopes to G502X).
  - `button: "back"/"forward"/"wheel"/"right"/"left"` (global aliases) → `trigger: { pointer: "back" }` PLUS `conditions: [{ device: DEVICE_IDENTIFIERS.logitechG502X }]` (explicit device scope, per spec §4).
  - `alone` → `{ phase: "release", do: alone }`; `hold` → `{ phase: "hold", do: hold }`. (`do` events are raw `ToEvent`s — keep verbatim.)
  - `variable: "right_button_pressed"` → `whileHoldVar: mouseVars.rightButtonPressed` (see Step 2).
  - `overrides: [{when, to}]` → additional cases `{ phase: <match base phase>, conditions: <when converted>, do: to }`, declared BEFORE the base cases (override precedence via groupByConditions order). `when` conditions convert via: `{app}`→`{app, unless?}`; `{variable, match, value}`→`{var: {name: variable, varDesc: variable}, equals: value, unless: match==="unless"}`.
  - wheel-left/right guards (`variable_unless(wheel_down/right_button_pressed)`) → add to the binding's hoisted `conditions` (as `unless` var conditions) OR to each case — match today's per-manipulator injection by hoisting them on the binding.
  - `thresholdMs`/`timeoutMs` → `timing: { aloneMs: timeoutMs, heldThresholdMs: thresholdMs }`.
  - `eventOptions: { halt: true, repeat: false }` → `eventOptions` on the binding (already a Binding field); for `halt`, the bespoke engine added a `toDelayedAction` — preserve by setting the binding's `eventOptions.halt`.

  **mouseRemap → Binding**: `{ trigger: { pointer: from }, conditions: [{device: G502X}], cases: [{ phase: "press", do: to }] }`.

  **simultaneous**: none live — skip (Task 8 deletes the arm).

- [ ] **Step 2: Mouse signaling `VarSpec`s** — add to `src/data/mouse.ts`:
```ts
export const mouseVars = {
  rightButtonPressed: { name: "right_button_pressed", varDesc: "Right button held" },
  wheelDown:          { name: "wheel_down",            varDesc: "Wheel held down" },
  leftButtonPressed:  { name: "left_button_pressed",   varDesc: "Left button held" },
  leftWithRightFirstTap: { name: "left_with_right_first_tap", varDesc: "Left+right first tap" },
} as const satisfies Record<string, import("./refs").VarSpec>;
```

- [ ] **Step 3: Convert the 10 mappings** (all except the two `button: "left"` double-tap/tapHold entries — those are Task 7). For each, write the `Binding[]` literal per the rules. The mappings: `shift`, `wheel_left`, `wheel_right`, `wheel`, `left_back`(G7), `left_forward`(G8), `middle_back`(G9), `back`, `forward`, `right`. Export as `mouseBindings: Binding[]` (Task 7 appends the left-button bindings; for now leave them via the old builder temporarily, OR defer — see Step 4).

  Exemplar (`shift`):
  ```ts
  {
    trigger: { pointer: "shift" },   // auto-scopes to G502X
    timing: { aloneMs: TIMINGS.delayMouseHoldMs, heldThresholdMs: TIMINGS.delayMouseHoldMs },
    cases: [
      { phase: "release", do: [{ key_code: "up_arrow", modifiers: ["left_control"] }] },
      { phase: "hold", do: [ WIN_ACTIVATE_UNDER_CURSOR, { key_code: "left_control", modifiers: ["left_option", "left_shift"] } ] },
      { phase: "hold", conditions: [{ var: mouseVars.rightButtonPressed, equals: 1 }], do: [{ key_code: "down_arrow", modifiers: ["left_control"], repeat: false }] },
    ],
  },
  ```

- [ ] **Step 4: Rewire** — `src/index.ts`: replace `...buildMouseRules(mouseDeviceMappings)` with `...defineBindings(mouseBindings)` (the left-button entries, if not yet converted, must be appended to `mouseBindings` in Task 7; for this task, keep the left-button rules coming from the OLD `buildMouseRules` temporarily OR convert them in Task 7 before this rewire — **recommended order**: do Task 7's left-button conversion as part of completing the `mouseBindings` array, THEN rewire). To keep the gate meaningful, rewire ONLY after all 12 are in `mouseBindings` (merge Step 3 here with Task 7's conversion into one `mouseBindings` array, then a single rewire).

  > **Sequencing note:** Tasks 6 and 7 together produce the complete `mouseBindings` array (10 tap-hold/remap + 2 left-button). Do the rewire + structural gate ONCE, after the full array is built. Commit the tap-hold/remap set (Task 6) and the double-tap set (Task 7) as separate commits, but only rewire `index.ts` + run the gate after both land.

- [ ] **Step 5: Gate + commit** — after the full `mouseBindings` (incl. Task 7) + rewire: structural diff vs `/tmp/mouse-baseline.json` **empty**. Fix any non-description difference. typecheck/lint/test green.
```bash
git add src/definitions/mouse.ts src/definitions/index.ts src/index.ts src/data/mouse.ts
git -c commit.gpgsign=false commit -m "refactor(mouse): migrate G502X tap-hold/remap mappings to Binding[]"
```

---

## Task 7: Left-button double-tap → `multiTap` binding (delayed-single-tap mechanism)

The left-button `doubleTap` mapping needs `defineBindings`' multiTap arm to (a) accept a pointer trigger (`varTapTapHoldFrom`) and (b) expose a **delayed single tap** (fires via `to_delayed_action.to_if_invoked` after the timer if no second tap).

**Files:**
- Modify: `src/engine/binding.ts` (`buildMultiTap` — pointer branch + delayed-single-tap), `src/core/tap-hold.ts` (already has `varTapTapHoldFrom` — confirm/call)
- Test: `src/tests/binding.test.ts`

- [ ] **Step 1: TDD the delayed-single-tap + pointer multiTap** — write a failing test:
```ts
test("defineBindings multiTap: pointer + delayed single tap + double tap", () => {
  const rules = defineBindings([{
    trigger: { pointer: "left" },
    conditions: [{ device: { name: "logitechG502X", deviceDesc: "Logitech G502 X", product_id: 49305, vendor_id: 1133 } as any }],
    multiTap: { allowPassThrough: false },
    cases: [
      { tapCount: 1, phase: "release", delayed: true, conditions: [{ app: { type: "app", name: "z", refDesc: "Zen" } }], do: [{ pointing_button: "button1", modifiers: ["left_command"], repeat: false }] },
      { tapCount: 2, phase: "release", do: [/* WIN_NEXT_DISPLAY events */] },
    ],
  }]);
  const built = rules[0] as any;
  const firstTap = built.manipulatorSources.find((m: any) => m.to_if_alone?.some((e: any) => e.set_variable));
  assert.ok(firstTap, "first-tap var-dance manipulator present");
  assert.ok(firstTap.from.pointing_button === "button1", "pointer trigger resolved");
  assert.ok(firstTap.to_delayed_action?.to_if_invoked?.some((e: any) => e.pointing_button === "button1"), "delayed single tap routed to to_if_invoked");
});
```

- [ ] **Step 2: Extend `Case` + `buildMultiTap`**:
  - Add `delayed?: boolean` to `Case`.
  - In `buildMultiTap`, branch on pointer vs key: pointer → use `varTapTapHoldFrom({ from: { pointing_button }, … })`; key → existing `varTapTapHold({ key, … })`. (Import `varTapTapHoldFrom` from `../core/tap-hold`.)
  - Route tap1 release cases with `delayed: true` → `delayedSingleTapEvents`; without → `immediateSingleTapEvents`. tap2 release → `doubleTapEvents`; hold → `holdEvents`/`doubleTapHoldEvents`. (The current `buildMultiTap` groups by `byPhase`; extend it to split release into immediate vs delayed.)

- [ ] **Step 3: Convert the two left-button mappings** (the `doubleTap` + its `tapHold` companion that sets `left_button_pressed`) into the `mouseBindings` array as multiTap/tapHold bindings per the spec §8 shape. Append to `mouseBindings`.

- [ ] **Step 4: Rewire + gate** — `src/index.ts` now uses `defineBindings(mouseBindings)` for all 12. Structural diff vs `/tmp/mouse-baseline.json` **empty**.
```bash
git add src/engine/binding.ts src/definitions/mouse.ts src/tests/binding.test.ts src/index.ts
git -c commit.gpgsign=false commit -m "feat(mouse): double-tap → multiTap binding (delayed single tap); migrate left-button"
```

---

## Task 8: Delete the bespoke mouse engine/types/tests

With all 12 mappings in `mouseBindings`, the old code is dead.

**Files:**
- Delete: `src/core/mouse.ts`, `src/engine/mouse-rules.ts`, `src/tests/mouse.test.ts`
- Modify: `src/data/mouse.ts` (remove the old `Mouse*` types), `src/engine/index.ts`, `src/definitions/index.ts`, `src/definitions/mouse.ts` (remove `MouseDeviceConfig`/`mouseDeviceMappings` if no longer used)

- [ ] **Step 1: Delete files** — `rm src/core/mouse.ts src/engine/mouse-rules.ts src/tests/mouse.test.ts`.

- [ ] **Step 2: Remove old types** from `src/data/mouse.ts` (`MouseCondition`, `MouseOverride`, `MouseTapHoldMapping`, `MouseSimultaneousMapping`, `MouseDoubleTapMapping`, `mouseRemap`, `MouseMapping`, `MouseDeviceConfig`, `MouseIdentifiers`). Keep `WIN_ACTIVATE_UNDER_CURSOR`, `buttons`, `defaultButtonNames`, `resolveButton`, `mouseVars`, `ButtonSpec`, `DeviceName`.

- [ ] **Step 3: Drop re-exports** — `src/engine/index.ts` remove `export * from "./mouse-rules"`; `src/definitions/index.ts` remove `buildMouseRules`/`mouseDeviceMappings` (replace with `mouseBindings`).

- [ ] **Step 4: Gate + commit** — typecheck/lint clean (no dangling imports); structural diff **empty**; test suite green (mouse.test.ts removed — its coverage is now in binding.test.ts + the structural gate).
```bash
git add -A
git -c commit.gpgsign=false commit -m "refactor(mouse): delete bespoke mouse engine/types/tests"
```

---

## Task 9: Final gate + ledger

- [ ] **Step 1: Full structural gate vs the original mouse baseline**
```bash
CI=true npx tsx src/index.ts
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json | jq -S . > /tmp/mouse-final.json
diff /tmp/mouse-baseline.json /tmp/mouse-final.json && echo "STRUCTURAL DIFF EMPTY"
```
Expected: **empty**.

- [ ] **Step 2: Full check** — `npm run typecheck && npm run lint && npm test` green.

- [ ] **Step 3: Regenerate + commit snapshot**
```bash
git add karabiner-output.json
git -c commit.gpgsign=false commit -m "chore(output): regenerate snapshot after mouse unification"
```

- [ ] **Step 4: Ledger** — append a Mouse Unification section to `.superpowers/sdd/progress.md` (local): list commits, structural diff empty, bespoke engine deleted, `setVar`/`whileHoldVar`/`suppress`/`Condition.device`/button-registry added, double-tap delayed-single-tap mechanism. Note the engine consolidation is now complete (all input → `Binding[]`).

---

## Self-Review (completed during authoring)

**Spec coverage:** §3 button registry → T4; §4 trigger + nameScope device → T4; §5 setVar + whileHoldVar → T2 + T5; §6 suppression → T5; §7 wheel guards → T6 (hoisted conditions); §8 double-tap → T7; §9 descriptions → T3 (device) + T4 (button) + T2 (setVar); §10 engine changes → T1–T5; §11 deletions → T8; §12 gate → every migration task + T9. ✓

**Placeholder scan:** engine code is complete for T1–T5; T6/T7 migrations use explicit transformation rules + a concrete exemplar + the gate (mechanical bulk, as in Phase 3's single-key migration). The `APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS` "keep verbatim" is an explicit preserve-existing instruction. The double-tap delayed-single-tap is TDD-specified (test in T7 Step 1).

**Type consistency:** `whileHoldVar` (renamed from `holdVar` per user) used consistently; `setVar` variant defined in T2 and resolved/described the same task; `resolveButton` defined in T4 and consumed in T4 (synthesizer) + T6; `mouseVars` defined in T6 Step 2 and used in T6/T7; `karabinerDeviceId` defined in T1 and used in T1/T3/T4.

**Deferred:** `simultaneous` mouse mappings (none live — arm deleted in T8); multi-device button-name collisions (spec §13); leader/specials untouched.
