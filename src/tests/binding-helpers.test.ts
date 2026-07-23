import assert from "node:assert/strict";
import test from "node:test";

import { assertUniqueTriggers } from "../engine/binding-helpers";
import type { Binding } from "../engine/binding";

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
  const dup = [moddedTapHold("q", "vmCOCS"), moddedTapHold("q", "vmCOCS")];
  assert.throws(() => assertUniqueTriggers(dup), /Duplicate trigger/);
});
