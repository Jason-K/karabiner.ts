import assert from "node:assert/strict";
import test from "node:test";

import { generateModifierChordRules } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateModifierChordRules produces one manipulator per variant plus base", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test chord rule",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [
        {
          modifiers: ["left_shift"],
          description: "Super",
          to: [{ type: "key", key: "left_shift", modifiers: ["left_command", "left_option", "left_control"] }],
        },
      ],
    }),
  );
  assert.equal(rule.manipulators.length, 2); // 1 base + 1 variant
});

test("generateModifierChordRules uses ruleName as rule description", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [],
    }),
  );
  assert.equal(
    rule.description,
    "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
  );
});

test("generateModifierChordRules trackVar adds setVar and afterKeyUp events", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
        trackVar: "caps_lock_pressed",
      },
      variants: [],
    }),
  );
  const base: any = rule.manipulators[0];
  assert.ok(
    base?.to?.some((e: any) => e.set_variable?.name === "caps_lock_pressed"),
    "Expected set_variable in to events",
  );
  assert.ok(
    base?.to_after_key_up?.some(
      (e: any) => e.set_variable?.name === "caps_lock_pressed",
    ),
    "Expected set_variable in to_after_key_up",
  );
});

test("generateModifierChordRules variant uses mandatory modifiers in from", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [
        {
          modifiers: ["left_shift"],
          description: "Super",
          to: [{ type: "key", key: "left_shift", modifiers: ["left_command"] }],
        },
      ],
    }),
  );
  const variant: any = rule.manipulators[1];
  assert.deepEqual(variant?.from?.modifiers?.mandatory, ["left_shift"]);
});
