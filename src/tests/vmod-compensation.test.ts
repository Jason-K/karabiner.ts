import assert from "node:assert/strict";
import test from "node:test";

import type { ActionSpec, ModKey } from "../data";
import { vmod } from "../engine";

/**
 * `vmod()` compensation table.
 *
 * A virtual-modifier key emits the COCS set (left command/option/control/shift)
 * MINUS whichever of those modifiers is physically held alongside it, so the
 * effective modifier state is always the full set. All 16 rows are enumerated:
 * a regression flipping any single row fails with that row's held-modifier set.
 *
 * Driven by calling `vmod()` directly rather than by reading `capsLockBindings`,
 * so it tests the engine rather than the current personal keymap.
 */
const COMPENSATION_TABLE: Array<{
  held: ModKey[];
  emitKey: string;
  emitMods: string[];
}> = [
  { held: [], emitKey: "left_command", emitMods: ["left_option", "left_control", "left_shift"] },
  { held: ["left_shift"], emitKey: "left_command", emitMods: ["left_option", "left_control"] },
  { held: ["left_control"], emitKey: "left_command", emitMods: ["left_option", "left_shift"] },
  { held: ["left_option"], emitKey: "left_command", emitMods: ["left_control", "left_shift"] },
  { held: ["left_command"], emitKey: "left_option", emitMods: ["left_control", "left_shift"] },
  { held: ["left_control", "left_shift"], emitKey: "left_command", emitMods: ["left_option"] },
  { held: ["left_control", "left_option"], emitKey: "left_command", emitMods: ["left_shift"] },
  { held: ["left_control", "left_command"], emitKey: "left_option", emitMods: ["left_shift"] },
  { held: ["left_command", "left_option"], emitKey: "left_control", emitMods: ["left_shift"] },
  { held: ["left_command", "left_shift"], emitKey: "left_option", emitMods: ["left_control"] },
  { held: ["left_option", "left_shift"], emitKey: "left_command", emitMods: ["left_control"] },
  { held: ["left_command", "left_control", "left_shift"], emitKey: "left_option", emitMods: [] },
  { held: ["left_command", "left_option", "left_shift"], emitKey: "left_control", emitMods: [] },
  { held: ["left_option", "left_control", "left_shift"], emitKey: "left_command", emitMods: [] },
  { held: ["left_command", "left_option", "left_control"], emitKey: "left_shift", emitMods: [] },
  {
    held: ["left_command", "left_option", "left_control", "left_shift"],
    emitKey: "vk_none",
    emitMods: [],
  },
];

test("vmod: every held-modifier combination emits COCS minus what is held", () => {
  assert.equal(COMPENSATION_TABLE.length, 16, "sanity: 16 compensation rows");

  for (const row of COMPENSATION_TABLE) {
    const label = row.held.length ? `vmod+${row.held.join("+")}` : "vmod (base)";
    const [binding] = vmod("caps_lock", row.held);
    assert.ok(binding, `no binding produced for ${label}`);

    const pressCase = binding.cases.find((c) => c.phase === "press");
    assert.ok(pressCase, `no press case for ${label}`);

    const emitted = pressCase.do[0] as Extract<ActionSpec, { type: "key" }>;
    assert.equal(emitted.key, row.emitKey, `${label}: wrong emit key`);
    assert.deepEqual(emitted.modifiers ?? [], row.emitMods, `${label}: wrong emit modifiers`);
  }
});

test("vmod: base (no held modifiers) adds an f15+COCS tap combo on release", () => {
  const [base] = vmod("caps_lock");
  assert.ok(base);

  const releaseCase = base.cases.find((c) => c.phase === "release");
  assert.ok(releaseCase, "base variant must carry a release case");

  const tap = releaseCase.do[0] as Extract<ActionSpec, { type: "key" }>;
  assert.equal(tap.key, "f15");
  assert.deepEqual(tap.modifiers, [
    "left_command",
    "left_option",
    "left_control",
    "left_shift",
  ]);
});

test("vmod: modWhileDown is set so the modifier asserts without a hold delay", () => {
  for (const held of [[], ["left_shift"]] as ModKey[][]) {
    for (const binding of vmod("caps_lock", held)) {
      assert.equal(binding.modWhileDown, true);
    }
  }
});

test("vmod: whileHoldVar signals the held state on both trigger shapes", () => {
  const signal = { name: "test_vmod_pressed", varDesc: "Test vmod pressed" };
  const bindings = vmod("caps_lock", ["left_shift"], signal);

  assert.equal(bindings.length, 2, "held variants emit a modifier form and a chord form");
  for (const binding of bindings) {
    assert.equal(binding.whileHoldVar?.name, "test_vmod_pressed");
  }
});

test("vmod: held modifiers produce both a modifier trigger and a simultaneous chord", () => {
  const [asModifier, asChord] = vmod("caps_lock", ["left_control", "left_option"]);

  assert.ok(asModifier && "keys" in asModifier.trigger);
  assert.deepEqual(asModifier.trigger.keys, ["caps_lock"]);
  assert.deepEqual(asModifier.trigger.modifiers, ["left_control", "left_option"]);

  assert.ok(asChord && "keys" in asChord.trigger);
  assert.deepEqual(asChord.trigger.keys, ["caps_lock", "left_control", "left_option"]);
});
