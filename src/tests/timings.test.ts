import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS,
  DEFAULT_MOUSE_MANIPULATOR_TIMINGS,
  DEFAULT_TIMINGS,
} from "../data";
import { bind, defineBindings, from, hold, key, timing, to } from "../engine";
import type { BasicManipulator } from "../types/karabiner";

test("timing constants export expected defaults", () => {
  assert.equal(DEFAULT_GLOBAL_SETTINGS.check_for_updates_on_startup, true);
  assert.equal(DEFAULT_GLOBAL_SETTINGS.show_in_menu_bar, true);
  assert.equal(DEFAULT_GLOBAL_SETTINGS.show_profile_name_in_menu_bar, false);

  assert.equal(DEFAULT_TIMINGS["basic.simultaneous_threshold_milliseconds"], 50);
  assert.equal(DEFAULT_TIMINGS["basic.to_if_alone_timeout_milliseconds"], 1000);
  assert.equal(DEFAULT_TIMINGS["basic.to_if_held_down_threshold_milliseconds"], 400);
  assert.equal(DEFAULT_TIMINGS["basic.to_delayed_action_delay_milliseconds"], 300);

  assert.equal(DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS.aloneMs, 1000);
  assert.equal(DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS.holdMs, 400);
  assert.equal(DEFAULT_KEYBOARD_MANIPULATOR_TIMINGS.delayedMs, 300);

  assert.equal(DEFAULT_MOUSE_MANIPULATOR_TIMINGS.aloneMs, 1000);
  assert.equal(DEFAULT_MOUSE_MANIPULATOR_TIMINGS.holdMs, 400);
  assert.equal(DEFAULT_MOUSE_MANIPULATOR_TIMINGS.delayedMs, 300);
});

test("manipulators omit parameters when matching DEFAULT_TIMINGS defaults", () => {
  const defaultBinding = bind(
    from("a"),
    to(hold(key("b"))),
  );
  const [rule] = defineBindings([defaultBinding]);
  const manipulators = rule!.manipulators as BasicManipulator[];

  // Manipulators matching profile defaults should not have a parameters block
  assert.equal(manipulators[0]!.parameters, undefined);
});

test("manipulators include parameters when overriding DEFAULT_TIMINGS defaults", () => {
  const customBinding = bind(
    from("k", ["right_option"]),
    to(hold(key("b"))),
    timing({ holdMs: 200 }),
  );
  const [rule] = defineBindings([customBinding]);
  const manipulators = rule!.manipulators as BasicManipulator[];

  assert.deepEqual(manipulators[0]!.parameters, {
    "basic.to_if_held_down_threshold_milliseconds": 200,
  });
});
