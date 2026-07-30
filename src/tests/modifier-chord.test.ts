import assert from "node:assert/strict";
import test from "node:test";

import { capsLockBindings } from "../definitions/caps-lock";
import { defineBindings } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("capsLockBindings produces rules for base and all 15 variants", () => {
  const rules = defineBindings(capsLockBindings).map(toRule);
  assert.equal(rules.length, 16); // 1 base + 15 variants
});

test("capsLockBindings base binding adds setVar and afterKeyUp for whileHoldVar", () => {
  const rules = defineBindings(capsLockBindings).map(toRule);
  const baseRule: any = rules[0];
  const baseManip: any = baseRule.manipulators[0];
  assert.ok(
    baseManip?.to?.some((e: any) => e.set_variable?.name === "caps_lock_pressed"),
    "Expected set_variable in to events",
  );
  assert.ok(
    baseManip?.to_after_key_up?.some(
      (e: any) => e.set_variable?.name === "caps_lock_pressed",
    ),
    "Expected set_variable in to_after_key_up",
  );
});

test("capsLockBindings variant uses mandatory modifiers in from", () => {
  const rules = defineBindings(capsLockBindings).map(toRule);
  const shiftVariant: any = rules[1].manipulators[0];
  assert.deepEqual(shiftVariant?.from?.modifiers?.mandatory, ["left_shift"]);
});

test("capsLockBindings can emit vk_none for the full modifier chord", () => {
  const rules = defineBindings(capsLockBindings).map(toRule);
  const fullChordRule: any = rules[15].manipulators[0];
  assert.equal(fullChordRule?.to?.[0]?.key_code, "vk_none");
});
