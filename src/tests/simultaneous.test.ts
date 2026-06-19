import assert from "node:assert/strict";
import test from "node:test";
import { generateSimultaneousRules } from "../engine";
import type { SimultaneousConfig, TapHoldConfig } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

const noSuppression: string[] = [];
const noTapHold: Record<string, TapHoldConfig> = {};

// ── Tap-hold path ─────────────────────────────────────────────────────────────

test("tap-hold: from.simultaneous contains the chord keys", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(Array.isArray(m.from.simultaneous), "from.simultaneous should be an array");
  assert.deepEqual(
    m.from.simultaneous.map((e: any) => e.key_code),
    ["j", "k"],
  );
});

test("tap-hold: produces to_if_alone and to_if_held_down", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        hold: [{ type: "key", key: "f1" }],
      },
    },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(Array.isArray(m.to_if_alone) && m.to_if_alone.length > 0, "should have to_if_alone");
  assert.ok(Array.isArray(m.to_if_held_down) && m.to_if_held_down.length > 0, "should have to_if_held_down");
});

// ── Multi-tap path ─────────────────────────────────────────────────────────────

test("multi-tap: produces two manipulators", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noSuppression,
    noTapHold,
  );
  const rule = toRule(rules[0]);
  assert.equal(rule.manipulators.length, 2);
});

test("multi-tap: second manipulator has sim_tap_{label} variable condition", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noSuppression,
    noTapHold,
  );
  const secondManipulator = toRule(rules[0]).manipulators[0]; // [0] = secondTap (varTapTapHoldFrom returns [secondTap, firstTap])
  assert.ok(
    secondManipulator?.conditions?.some((c: any) => c.name === "sim_tap_jk"),
    "Expected sim_tap_jk variable condition on second manipulator",
  );
});

test("multi-tap: chord from event appears on both manipulators", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        tapTap: [{ type: "key", key: "f1" }],
        thresholdMs: 300,
      },
    },
    noSuppression,
    noTapHold,
  );
  const { manipulators } = toRule(rules[0]);
  for (const m of manipulators) {
    assert.ok(Array.isArray(m.from.simultaneous), "Both manipulators must have from.simultaneous");
  }
});

// ── simultaneous_options ───────────────────────────────────────────────────────

test("simultaneous_options: key_down_order is emitted when set", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousOptions: { key_down_order: "strict" },
      },
    },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.from.simultaneous_options?.key_down_order, "strict");
});

test("simultaneous_options: absent when config has none", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.from.simultaneous_options, undefined);
});

test("simultaneous_options: to_after_key_up is resolved and emitted", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousOptions: {
          to_after_key_up: [{ type: "key", key: "f2" }],
        },
      },
    },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.ok(
    Array.isArray(m.from.simultaneous_options?.to_after_key_up) &&
      m.from.simultaneous_options.to_after_key_up.length > 0,
    "to_after_key_up should appear in from.simultaneous_options",
  );
});

// ── simultaneousThresholdMs ────────────────────────────────────────────────────

test("simultaneousThresholdMs: emitted as basic.simultaneous_threshold_milliseconds", () => {
  const rules = generateSimultaneousRules(
    {
      jk: {
        keys: ["j", "k"],
        description: "J+K",
        alone: [{ type: "key", key: "escape" }],
        simultaneousThresholdMs: 100,
      },
    },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  assert.equal(m.parameters?.["basic.simultaneous_threshold_milliseconds"], 100);
});

// ── Leader-suppression conditions ─────────────────────────────────────────────

test("suppression: variable_unless injected for each supplied var", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    ["leader_mod", "leader_d_sublayer"],
    noTapHold,
  );
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

test("suppression: empty list emits no variable_unless conditions", () => {
  const rules = generateSimultaneousRules(
    { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
    noSuppression,
    noTapHold,
  );
  const m = toRule(rules[0]).manipulators[0];
  const hasUnless = (m.conditions ?? []).some(
    (c: any) => c.type === "variable_unless",
  );
  assert.equal(hasUnless, false, "no suppression conditions when list is empty");
});

// ── Conflict check 1: duplicate chords ────────────────────────────────────────

test("conflict 1: throws on duplicate insensitive chords regardless of key order", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        {
          jk_a: { keys: ["j", "k"], description: "First", alone: [{ type: "key", key: "escape" }] },
          jk_b: { keys: ["k", "j"], description: "Second", alone: [{ type: "key", key: "f1" }] },
        },
        noSuppression,
        noTapHold,
      ),
    /duplicate/i,
  );
});

test("conflict 1: strict-order [j,k] and [k,j] are NOT duplicates", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      {
        jk: {
          keys: ["j", "k"],
          description: "First",
          alone: [{ type: "key", key: "escape" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
        kj: {
          keys: ["k", "j"],
          description: "Second",
          alone: [{ type: "key", key: "f1" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
      },
      noSuppression,
      noTapHold,
    ),
  );
});

test("conflict 1: same keys with different key_down_order are NOT duplicates", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      {
        jk_strict: {
          keys: ["j", "k"],
          description: "Strict",
          alone: [{ type: "key", key: "escape" }],
          simultaneousOptions: { key_down_order: "strict" },
        },
        jk_insensitive: {
          keys: ["j", "k"],
          description: "Insensitive",
          alone: [{ type: "key", key: "f1" }],
        },
      },
      noSuppression,
      noTapHold,
    ),
  );
});

// ── Conflict check 2: tap-hold key overlap ────────────────────────────────────

test("conflict 2: throws when a simultaneous key matches a bare tap-hold key", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
        noSuppression,
        { j: { description: "J tap-hold", alone: [{ type: "key", key: "j" }] } } as any,
      ),
    /conflict/i,
  );
});

test("conflict 2: modifier-prefixed tap-hold key does NOT conflict", () => {
  assert.doesNotThrow(() =>
    generateSimultaneousRules(
      { jk: { keys: ["j", "k"], description: "J+K", alone: [{ type: "key", key: "escape" }] } },
      noSuppression,
      { "cmd+j": { description: "cmd+J", alone: [{ type: "key", key: "f1" }] } } as any,
    ),
  );
});

// ── Input validation ───────────────────────────────────────────────────────────

test("throws when tapTap and tapTapHold are both specified", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        {
          jk: {
            keys: ["j", "k"],
            description: "Bad",
            tapTap: [{ type: "key", key: "escape" }],
            tapTapHold: [{ type: "key", key: "f1" }],
            thresholdMs: 300,
          },
        },
        noSuppression,
        noTapHold,
      ),
    /mutually exclusive/i,
  );
});

test("throws when keys has fewer than 2 entries", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { j: { keys: ["j"], description: "Single", alone: [{ type: "key", key: "escape" }] } },
        noSuppression,
        noTapHold,
      ),
    /at least 2 keys/i,
  );
});

test("throws when no action fields are specified", () => {
  assert.throws(
    () =>
      generateSimultaneousRules(
        { jk: { keys: ["j", "k"], description: "No-op" } },
        noSuppression,
        noTapHold,
      ),
    /no action/i,
  );
});
