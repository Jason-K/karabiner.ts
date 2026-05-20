import assert from "node:assert/strict";
import test from "node:test";

import { generateTapAloneHoldRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateTapAloneHoldRule produces one manipulator", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  assert.equal(rule.manipulators.length, 1);
});

test("generateTapAloneHoldRule description uses hold trigger", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  assert.equal(
    rule.description,
    "[←⌃]+[ESC]        →    Activity Monitor / Process Spy (on hold)",
  );
});

test("generateTapAloneHoldRule cancel action mirrors alone", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  const manipulator: any = rule.manipulators[0];
  // toDelayedAction(invoked=[], canceled=aloneEvents)
  assert.deepEqual(
    manipulator?.to_delayed_action?.to_if_invoked,
    [],
  );
  assert.ok(
    manipulator?.to_delayed_action?.to_if_canceled?.length > 0,
    "Cancel action should mirror alone events",
  );
});

test("generateTapAloneHoldRule works without modifiers", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "f6",
      description: "Focus something",
      alone: [{ type: "key", key: "f6" }],
      hold: [{ type: "key", key: "f7" }],
      timeoutMs: 300,
    }),
  );
  assert.equal(rule.manipulators.length, 1);
  assert.ok(rule.description.includes("[F6]"), "Description should reference the key");
});
