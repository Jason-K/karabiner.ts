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
  // Plan returns BasicRuleBuilder cast as Rule (codebase convention); inspect builder
  // fields directly rather than calling .build(), which would drop ruleDescription/manipulatorSources.
  const built = rules[0] as any;
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
  const built = rules[0] as any;
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
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 2);
});

test("defineBindings tapHold: hold case -> to_if_held_down + default-alone pass-through", () => {
  const rules = defineBindings([
    {
      description: "[A]        →    X (on hold)",
      trigger: { keys: ["a"] },
      timing: { aloneMs: 400, heldThresholdMs: 400 },
      cases: [{ phase: "hold", do: [{ type: "key", key: "f18", modifiers: ["vmCOC_"], options: { repeat: false } }] }],
    },
  ]);
  const built = rules[0] as any;
  const m = built.manipulatorSources[0];
  // default-alone pass-through: the key itself with halt:true.
  // Note: karabiner.ts' toKey() helper always sets `modifiers: undefined` as an own
  // property (it gets dropped by JSON.stringify, so the live output is unaffected).
  // The existing tap-hold-rules.ts produces the same shape — this is the byte-identical
  // behavior the plan must preserve.
  assert.deepEqual(m.to_if_alone, [{ halt: true, key_code: "a", modifiers: undefined }]);
  assert.deepEqual(m.to_if_held_down, [
    { repeat: false, key_code: "f18", modifiers: ["left_command", "left_option", "left_control"] },
  ]);
  assert.deepEqual(m.to_delayed_action, {
    to_if_invoked: [],
    to_if_canceled: [{ halt: true, key_code: "a", modifiers: undefined }],
  });
});

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
  const built = rules[0] as any;
  // varTapTapHold emits [secondTap, firstTap]
  assert.equal(built.manipulatorSources.length, 2);
  const first = built.manipulatorSources.find((m: any) => m.to_if_alone?.some((e: any) => e.key_code === "escape"));
  assert.ok(first, "first tap carries the escape alone action");
});
