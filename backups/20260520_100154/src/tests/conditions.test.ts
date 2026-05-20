import assert from "node:assert/strict";
import test from "node:test";

import { map } from "karabiner.ts";

import { toFromEvent, toSendUserCommand } from "../lib/beta";
import { exprIf, exprUnless, setVarExpr } from "../lib/conditions";

test("setVarExpr emits documented expression fields", () => {
  assert.deepEqual(setVarExpr("mode", "mode != 0 ? 0 : 1", "0"), {
    set_variable: {
      name: "mode",
      expression: "mode != 0 ? 0 : 1",
      key_up_expression: "0",
    },
  });
});

test("expression helpers emit expression conditions", () => {
  assert.deepEqual(exprIf("mode == 1"), {
    type: "expression_if",
    expression: "mode == 1",
  });
  assert.deepEqual(exprUnless("mode == 0"), {
    type: "expression_unless",
    expression: "mode == 0",
  });
});

test("beta helpers serialize send_user_command and from_event", () => {
  assert.deepEqual(toSendUserCommand({ command: "show_layer", layer: "space" }), {
    send_user_command: {
      payload: {
        command: "show_layer",
        layer: "space",
      },
      endpoint: undefined,
    },
  });
  assert.deepEqual(toFromEvent(), { from_event: true });
});

test(
  "builder supports to_if_other_key_pressed",
  { skip: "Removed from upstream builder API" },
  () => {
    const manipulator = map("left_option").to("left_option").build()[0];

    assert.ok(manipulator);
  },
);
