import assert from "node:assert/strict";
import test from "node:test";

import { assertUniqueTriggers, resolveButton } from "../engine/emit-modifiers/binding-helpers";
import type { Binding } from "../engine/emit-modifiers/binding";

function bareHold(key: string): Binding {
  return { trigger: { keys: [key] }, cases: [{ phase: "hold", do: [{ type: "noop" }] }] };
}

function moddedTapHold(key: string, mod: string): Binding {
  return {
    trigger: { keys: [key], modifiers: [mod] },
    cases: [{ phase: "hold", do: [{ type: "noop" }] }],
  };
}

test("assertUniqueTriggers: passes for distinct triggers", () => {
  const bs = [bareHold("a"), bareHold("b")];
  assert.equal(assertUniqueTriggers(bs), bs);
});

test("assertUniqueTriggers: throws on duplicate (order-independent mods)", () => {
  const dup = [moddedTapHold("q", "COCS"), moddedTapHold("q", "COCS")];
  assert.throws(() => assertUniqueTriggers(dup), /Duplicate trigger/);
});

test("resolveButton: alias + nameScope + raw fallback", () => {
  assert.equal(resolveButton("shift_button").button, "button5");
  assert.deepEqual(resolveButton("shift_button").nameScope, ["g502X"]);
  assert.equal(resolveButton("left").nameScope, "global");
  assert.equal(resolveButton("button99").button, "button99");
  assert.equal(resolveButton("button1").desc, "Left click");
});
