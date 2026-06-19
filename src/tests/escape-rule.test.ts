import assert from "node:assert/strict";
import test from "node:test";

import { generateEscapeRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

function setVars(rules: any[]): any[] {
  return toRule(rules[0]).manipulators[0].to
    .filter((e: any) => e.set_variable)
    .map((e: any) => e.set_variable);
}

test("escape rule: resets each supplied suppression var to 0", () => {
  const vars = setVars(generateEscapeRule(["leader_mod", "leader_d_sublayer"]));
  const names = vars.map((v: any) => v.name);
  assert.ok(names.includes("leader_mod"));
  assert.ok(names.includes("leader_d_sublayer"));
  vars.forEach((v: any) => assert.equal(v.value, 0));
});

test("escape rule: empty suppression still resets baseline state vars", () => {
  const names = setVars(generateEscapeRule()).map((v: any) => v.name);
  assert.ok(names.includes("caps_lock_pressed"));
  assert.ok(!names.includes("leader_mod"));
});
