import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../data";
import { generatePointerRemapRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generatePointerRemapRule produces one manipulator", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.equal(rule.manipulators.length, 1);
});

test("generatePointerRemapRule uses pointing_button in from", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.deepEqual(rule.manipulators[0]?.from, { pointing_button: "button1" });
});

test("generatePointerRemapRule attaches ifApp condition when provided", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
      ifApp: appRegistry.onePiece,
    }),
  );
  assert.ok(
    rule.manipulators[0]?.conditions?.some(
      (c: any) => c.type === "frontmost_application_if",
    ),
  );
});

test("generatePointerRemapRule includes modifiers in from when provided", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      modifiers: ["left_command"],
      description: "Cmd-click",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.deepEqual(rule.manipulators[0]?.from, {
    pointing_button: "button1",
    modifiers: { mandatory: ["left_command"] },
  });
});
