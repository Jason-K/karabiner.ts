import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../data";
import { generateDoubleTapGuardRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateDoubleTapGuardRule produces two manipulators", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.equal(rule.manipulators.length, 2);
});

test("generateDoubleTapGuardRule description uses multi-tap trigger", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.equal(rule.description, "[←⌘]+[Q]        →    Quit app (on multi-tap)");
});

test("generateDoubleTapGuardRule auto-derives var name from key and modifier", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  const firstPress: any = rule.manipulators[1];
  assert.ok(
    firstPress?.to?.some((e: any) => e.set_variable?.name === "guard_cmd_q"),
    "Expected guard_cmd_q variable",
  );
});

test("generateDoubleTapGuardRule adds ifApp condition when provided", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "d",
      modifiers: ["left_command"],
      description: "Delete note",
      ifApp: [appRegistry.antinote],
    }),
  );
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "Both manipulators should have app condition",
  );
});

test("generateDoubleTapGuardRule has no ifApp condition when omitted", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        !m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "No app condition expected for global rule",
  );
});
