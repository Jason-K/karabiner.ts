import assert from "node:assert/strict";
import test from "node:test";

import { generateTapHoldRules } from "../engine";
import type { TapHoldConfig } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

const baseConfig: Record<string, TapHoldConfig> = {
  f: {
    alone: [{ type: "key", key: "f" }],
    hold: [{ type: "key", key: "f" }],
    description: "F tap-hold",
  },
};

test("tap-hold: injects variable_unless for each supplied suppression var", () => {
  const rules = generateTapHoldRules(baseConfig, [
    "leader_mod",
    "leader_d_sublayer",
  ]);
  const m = toRule(rules[0]).manipulators[0];
  const names = (m.conditions ?? [])
    .filter((c: any) => c.type === "variable_unless")
    .map((c: any) => c.name);
  assert.ok(names.includes("leader_mod"), "should suppress leader_mod");
  assert.ok(
    names.includes("leader_d_sublayer"),
    "should suppress leader_d_sublayer",
  );
});

test("tap-hold: empty suppression emits no variable_unless conditions", () => {
  const rules = generateTapHoldRules(baseConfig);
  const m = toRule(rules[0]).manipulators[0];
  const hasUnless = (m.conditions ?? []).some(
    (c: any) => c.type === "variable_unless",
  );
  assert.equal(hasUnless, false);
});
