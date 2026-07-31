import assert from "node:assert/strict";
import test from "node:test";

import {
  ifVarExpr,
  toTrigger,
  toUserCommand,
  toVarExpr,
  unlessVarExpr,
} from "../engine/resolvers";

test("toVarExpr emits documented expression fields", () => {
  assert.deepEqual(toVarExpr("mode", "mode != 0 ? 0 : 1", "0"), {
    set_variable: {
      name: "mode",
      expression: "mode != 0 ? 0 : 1",
      key_up_expression: "0",
    },
  });
});

test("expression helpers emit expression conditions", () => {
  assert.deepEqual(ifVarExpr("mode == 1"), {
    type: "expression_if",
    expression: "mode == 1",
  });
  assert.deepEqual(unlessVarExpr("mode == 0"), {
    type: "expression_unless",
    expression: "mode == 0",
  });
});

test("beta helpers serialize send_user_command and from_event", () => {
  assert.deepEqual(toUserCommand({ command: "show_layer", layer: "space" }), {
    send_user_command: {
      payload: {
        command: "show_layer",
        layer: "space",
      },
      endpoint: undefined,
    },
  });
  assert.deepEqual(toTrigger(), { from_event: true });
});
