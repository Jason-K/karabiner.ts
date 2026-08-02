import assert from "node:assert/strict";
import test from "node:test";

import {
  ifVarExpr,
  toTrigger,
  toUserCommand,
  toVarExpr,
  unlessVarExpr,
} from "../engine/resolve-to-action";

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
  // `endpoint` is omitted rather than set to undefined, so it never reaches
  // the emitted JSON as a key at all.
  assert.deepEqual(toUserCommand({ command: "show_layer", layer: "space" }), {
    send_user_command: {
      payload: {
        command: "show_layer",
        layer: "space",
      },
    },
  });
  assert.deepEqual(
    toUserCommand({ command: "hide_layer" }, "/tmp/receiver.sock"),
    {
      send_user_command: {
        payload: { command: "hide_layer" },
        endpoint: "/tmp/receiver.sock",
      },
    },
  );
  assert.deepEqual(toTrigger(), { from_event: true });
});
