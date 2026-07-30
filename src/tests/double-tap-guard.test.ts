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
