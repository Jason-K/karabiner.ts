import assert from "node:assert/strict";
import test from "node:test";

import { generateMultiTapRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateMultiTapRule produces two manipulators", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Escape / Kill app",
      alone: [{ type: "key", key: "escape" }],
      tapTapHold: [{ type: "shell", command: "echo kill" }],
      thresholdMs: 300,
      mods: [],
    }),
  );
  assert.equal(rule.manipulators.length, 2);
});

test("generateMultiTapRule description uses multi-tap trigger", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Escape / Kill app",
      thresholdMs: 300,
      mods: [],
    }),
  );
  assert.equal(
    rule.description,
    "[␛]        →    Escape / Kill app (on multi-tap)",
  );
});

test("generateMultiTapRule throws when tapTap and tapTapHold are both provided", () => {
  assert.throws(
    () =>
      generateMultiTapRule({
        key: "escape",
        description: "Bad config",
        tapTap: [{ type: "key", key: "escape" }],
        tapTapHold: [{ type: "key", key: "escape" }],
        thresholdMs: 300,
        mods: [],
      }),
    /mutually exclusive/,
  );
});

test("generateMultiTapRule auto-derives firstTapPendingVar from key", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Test",
      thresholdMs: 300,
      mods: [],
    }),
  );
  // secondTap is at index 0; it has condition for firstTapPendingVar === 1
  const secondManipulator: any = rule.manipulators[0];
  assert.ok(
    secondManipulator?.conditions?.some(
      (c: any) => c.name === "multi_tap_escape",
    ),
    "Expected multi_tap_escape variable condition",
  );
});
