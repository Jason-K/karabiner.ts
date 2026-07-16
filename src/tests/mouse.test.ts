import assert from "node:assert/strict";
import test from "node:test";

import {
  g502xButtons,
  mouseTapHold,
  mouseVarTapTapHold,
  resolveMouseButton,
} from "../core/mouse";

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
    firstTapPendingVar: "mouse_forward_first_tap",
    holdEvents: [{ key_code: "down_arrow", modifiers: ["left_control"] }],
    doubleTapEvents: [{ key_code: "up_arrow", modifiers: ["left_control"] }],
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

test("mouseVarTapTapHold can defer single-click events until timeout", () => {
  const manipulators = mouseVarTapTapHold({
    button: "left",
    firstTapPendingVar: "mouse_left_first_tap",
    delayedSingleTapEvents: [{ key_code: "f10" }],
    doubleTapEvents: [{ key_code: "f11" }],
  });

  const firstTap = manipulators[1] as any;
  assert.equal(
    firstTap.to_if_alone?.[0]?.set_variable?.name,
    "mouse_left_first_tap",
  );
  assert.equal(firstTap.to_if_alone?.[0]?.set_variable?.value, 1);
  assert.deepEqual(firstTap.to_delayed_action?.to_if_invoked?.[0], {
    key_code: "f10",
  });
  assert.equal(
    firstTap.to_delayed_action?.to_if_invoked?.[1]?.set_variable?.name,
    "mouse_left_first_tap",
  );
  assert.equal(
    firstTap.to_delayed_action?.to_if_invoked?.[1]?.set_variable?.value,
    0,
  );
});
