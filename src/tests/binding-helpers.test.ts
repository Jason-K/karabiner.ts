import assert from "node:assert/strict";
import test from "node:test";

import {
  assertUniqueTriggers,
  holdKey,
  remap,
  tapHoldBinding,
} from "../engine/binding-helpers";

test("holdKey: bare-key hold-only binding (tap passes through)", () => {
  const b = holdKey("a", [{ type: "key", key: "f18", modifiers: ["vmCOC_"] }]);
  assert.deepEqual(b.trigger, { keys: ["a"] });
  assert.deepEqual(b.cases, [
    { phase: "hold", do: [{ type: "key", key: "f18", modifiers: ["vmCOC_"] }] },
  ]);
});

test("holdKey: with modifiers", () => {
  const b = holdKey("s", [{ type: "noop" }], { modifiers: ["left_shift"] });
  assert.deepEqual(b.trigger, { keys: ["s"], modifiers: ["left_shift"] });
});

test("tapHoldBinding: alone + hold + timing", () => {
  const b = tapHoldBinding("k", ["right_option"], {
    alone: [{ type: "shell", command: "x" }],
    hold: [{ type: "raycast", ref: { type: "raycast", name: "n", refDesc: "N" } }],
    timeoutMs: 200,
    thresholdMs: 200,
  });
  assert.deepEqual(b.trigger, { keys: ["k"], modifiers: ["right_option"] });
  assert.deepEqual(b.timing, { aloneMs: 200, heldThresholdMs: 200 });
  assert.deepEqual(b.cases, [
    { phase: "release", do: [{ type: "shell", command: "x" }] },
    {
      phase: "hold",
      do: [{ type: "raycast", ref: { type: "raycast", name: "n", refDesc: "N" } }],
    },
  ]);
});

test("remap: plain press binding", () => {
  const b = remap("s", ["vmCOCS"], [{ type: "shell", command: "fmt" }]);
  assert.deepEqual(b.trigger, { keys: ["s"], modifiers: ["vmCOCS"] });
  assert.deepEqual(b.cases, [{ phase: "press", do: [{ type: "shell", command: "fmt" }] }]);
});

test("assertUniqueTriggers: passes for distinct triggers", () => {
  const bs = [holdKey("a", [{ type: "noop" }]), holdKey("b", [{ type: "noop" }])];
  assert.equal(assertUniqueTriggers(bs), bs);
});

test("assertUniqueTriggers: throws on duplicate (order-independent mods)", () => {
  const dup = [
    tapHoldBinding("q", ["vmCOCS"], { hold: [{ type: "noop" }] }),
    tapHoldBinding("q", ["vmCOCS"], { hold: [{ type: "noop" }] }),
  ];
  assert.throws(() => assertUniqueTriggers(dup), /Duplicate trigger/);
});
