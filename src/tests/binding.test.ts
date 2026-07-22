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
