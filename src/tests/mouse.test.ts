import assert from "node:assert/strict";
import test from "node:test";

import {
    g502xButtons,
    mouseTapHold,
    mouseVarTapTapHold,
    resolveMouseButton,
} from "../lib/mouse";

test("resolveMouseButton supports aliases and raw button ids", () => {
  assert.equal(resolveMouseButton("shift"), "button5");
  assert.equal(resolveMouseButton("button11"), "button11");
  assert.equal(resolveMouseButton("left_forward"), "button10");
  assert.equal(g502xButtons.left_front, "button10");
});

test("resolveMouseButton throws for unknown aliases", () => {
  assert.throws(() => resolveMouseButton("not_a_real_button_alias"));
});

test("mouseTapHold emits a pointing button manipulator", () => {
  const manipulator = mouseTapHold({
    button: "shift",
    alone: [{ key_code: "up_arrow", modifiers: ["left_control"] }],
    hold: [{ key_code: "left_control", modifiers: ["left_option", "left_shift"] }],
  }).build()[0];

  assert.deepEqual(manipulator.from, { pointing_button: "button5" });
  assert.deepEqual(manipulator.to_if_alone, [
    { key_code: "up_arrow", modifiers: ["left_control"] },
  ]);
  assert.deepEqual(manipulator.to_if_held_down, [
    { key_code: "left_control", modifiers: ["left_option", "left_shift"] },
  ]);
});

test("mouseVarTapTapHold can pass through original mouse button", () => {
  const manipulators = mouseVarTapTapHold({
    button: "forward",
    firstVar: "mouse_forward_first_tap",
    holdEvents: [{ key_code: "down_arrow", modifiers: ["left_control"] }],
    tapTapEvents: [{ key_code: "up_arrow", modifiers: ["left_control"] }],
    allowPassThrough: true,
  });

  const firstTap = manipulators[1];
  assert.deepEqual(firstTap.from, {
    pointing_button: "button6",
    modifiers: { optional: ["any"] },
  });
  assert.deepEqual(firstTap.to?.[1], {
    lazy: true,
    modifiers: undefined,
    pointing_button: "button6",
  });
});
