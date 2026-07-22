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
