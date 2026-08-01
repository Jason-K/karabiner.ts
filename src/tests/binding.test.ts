import assert from "node:assert/strict";
import test from "node:test";

import { APP_ID, PATHS } from "../data";
import { buildManipulators, defineBindings, normalizeModifier, resolveCondition, resolveModifiers, triggerToFrom } from "../engine/emit-manipulators/binding";
import type { Binding } from "../data";

test("resolveCondition app if -> frontmost_application_if (AppRef)", () => {
  const c = resolveCondition({
    app: APP_ID.excel,
  }) as any;
  assert.equal(c.type, "frontmost_application_if");
  assert.deepEqual(c.bundle_identifiers, ["com.microsoft.Excel"]);
  assert.equal(c.file_paths, undefined);
});

test("resolveCondition path if -> frontmost_application_if (PathRef)", () => {
  const c = resolveCondition({
    app: PATHS.dirGApps,
  }) as any;
  assert.equal(c.type, "frontmost_application_if");
  assert.deepEqual(c.file_paths, ["/Applications"]);
  assert.equal(c.bundle_identifiers, undefined);
});

test("resolveCondition app + path if -> frontmost_application_if (AppRef and PathRef)", () => {
  const c = resolveCondition({
    app: [APP_ID.excel, PATHS.dirGApps],
  }) as any;
  assert.equal(c.type, "frontmost_application_if");
  assert.deepEqual(c.bundle_identifiers, ["com.microsoft.Excel"]);
  assert.deepEqual(c.file_paths, ["/Applications"]);
});

test("resolveCondition app unless -> frontmost_application_unless", () => {
  const c = resolveCondition({
    app: [
      { type: "app", bundleId: "a", refDesc: "A" },
      { type: "app", bundleId: "b", refDesc: "B" },
    ],
    unless: true,
  }) as any;
  assert.equal(c.type, "frontmost_application_unless");
  assert.deepEqual(c.bundle_identifiers, ["a", "b"]);
});

test("resolveCondition var if/unless -> variable_if/unless", () => {
  assert.deepEqual(
    resolveCondition({ var: { name: "x", varDesc: "x" }, equals: 1 }) as any,
    { type: "variable_if", name: "x", value: 1 },
  );
  assert.deepEqual(
    resolveCondition({ var: { name: "x", varDesc: "x" }, equals: 1, unless: true }) as any,
    { type: "variable_unless", name: "x", value: 1 },
  );
});

test("triggerToFrom single key with modifiers", () => {
  assert.deepEqual(
    triggerToFrom({ keys: ["a"], modifiers: ["left_command"] }) as any,
    { key_code: "a", modifiers: { mandatory: ["left_command"] } },
  );
});

test("triggerToFrom simultaneous chord", () => {
  const from = triggerToFrom({ keys: ["j", "k"] }) as any;
  assert.deepEqual(from.simultaneous, [{ key_code: "j" }, { key_code: "k" }]);
  assert.deepEqual(from.modifiers, { optional: ["any"] });
});

test("defineBindings remap: one press case -> single manipulator with to", () => {
  const rules = defineBindings([
    {
      description: "[HOME]        →    Move to line start (on tap)",
      trigger: { keys: ["home"] },
      cases: [
        {
          phase: "press",
          do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
        },
      ],
    },
  ]);
  assert.equal(rules.length, 1);
  // Plan returns BasicRuleBuilder cast as Rule (codebase convention); inspect builder
  // fields directly rather than calling .build(), which would drop ruleDescription/manipulatorSources.
  const built = rules[0] as any;
  assert.equal(built.ruleDescription, "[HOME]        →    Move to line start (on tap)");
  const m = built.manipulatorSources[0];
  assert.deepEqual(m.from, { key_code: "home", modifiers: { optional: [] } });
  assert.deepEqual(m.to, [{ key_code: "left_arrow", modifiers: ["left_command"] }]);
});

test("defineBindings remap: noop case -> manipulator with no `to` key", () => {
  const rules = defineBindings([
    {
      description: "swallow",
      trigger: { keys: ["h"], modifiers: ["left_command"] },
      cases: [{ phase: "press", do: [{ type: "noop" }] }],
    },
  ]);
  const built = rules[0] as any;
  const m = built.manipulatorSources[0];
  assert.equal("to" in m, false, "noop must omit the `to` key");
});

test("defineBindings tap-hold: unconditional tap + conditional holds -> no competing unconditional manipulator", () => {
  // Mirrors return_or_enter / keypad_enter: tap passes the key through; hold
  // runs one action outside Excel and another inside. The unconditional tap
  // must NOT become its own no-conditions manipulator, which would intercept
  // the key and block both the normal tap and the conditional holds. Each
  //conditional group carries its own default-alone pass-through instead.
  const rules = defineBindings([
    {
      trigger: { keys: ["return_or_enter"] },
      cases: [
        { phase: "release", do: [{ type: "key", key: "return_or_enter", options: { halt: true } }] },
        {
          phase: "hold",
          conditions: [{ app: APP_ID.excel, unless: true }],
          do: [{ type: "shell", command: "format-cut-seed" }],
        },
        {
          phase: "hold",
          conditions: [{ app: APP_ID.excel }],
          do: [{ type: "key", key: "f2", options: { repeat: false } }],
        },
      ],
    },
  ]);
  const built = rules[0] as any;
  // Exactly the two conditional groups — no third, unconditional manipulator.
  assert.equal(built.manipulatorSources.length, 2);
  assert.equal(
    built.manipulatorSources.filter((m: any) => !m.conditions?.length).length,
    0,
    "no manipulator may lack a condition",
  );
  // Every manipulator still passes the key through on tap.
  for (const m of built.manipulatorSources) {
    assert.ok(
      m.to_if_alone.some((e: any) => e.key_code === "return_or_enter"),
      "tap must still emit return_or_enter",
    );
  }
});

test("defineBindings tap-hold: unconditional tap kept when paired with a conditional remap (press)", () => {
  // An unconditional tap next to a conditional *press* (remap) must remain a
  // separate manipulator: a remap has no default-alone pass-through, so folding
  // the tap away would drop it.
  const rules = defineBindings([
    {
      trigger: { keys: ["x"] },
      cases: [
        { phase: "press", conditions: [{ app: APP_ID.excel }], do: [{ type: "key", key: "down_arrow" }] },
        { phase: "release", do: [{ type: "key", key: "up_arrow" }] },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 2);
});

test("defineBindings remap: two press cases with different conditions -> two manipulators", () => {
  const rules = defineBindings([
    {
      description: "conditional",
      trigger: { keys: ["x"] },
      cases: [
        { phase: "press", conditions: [{ app: { type: "app", bundleId: "com.a", refDesc: "A" } }], do: [{ type: "key", key: "1" }] },
        { phase: "press", conditions: [{ app: { type: "app", bundleId: "com.b", refDesc: "B" } }], do: [{ type: "key", key: "2" }] },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 2);
});

test("defineBindings tapHold: hold case -> to_if_held_down + default-alone pass-through", () => {
  const rules = defineBindings([
    {
      description: "[A]        →    X (on hold)",
      trigger: { keys: ["a"] },
      timing: { aloneMs: 400, heldThresholdMs: 400 },
      cases: [{ phase: "hold", do: [{ type: "key", key: "f18", modifiers: ["COC_"], options: { repeat: false } }] }],
    },
  ]);
  const built = rules[0] as any;
  const m = built.manipulatorSources[0];
  // default-alone pass-through: the key itself with halt:true.
  // Note: karabiner.ts' toKey() helper always sets `modifiers: undefined` as an own
  // property (it gets dropped by JSON.stringify, so the live output is unaffected).
  // The existing tap-hold-rules.ts produces the same shape — this is the byte-identical
  // behavior the plan must preserve.
  assert.deepEqual(m.to_if_alone, [{ halt: true, key_code: "a", modifiers: undefined }]);
  assert.deepEqual(m.to_if_held_down, [
    {
      repeat: false,
      key_code: "f18",
      modifiers: ["command", "option", "control"],
    },
  ]);
  assert.deepEqual(m.to_delayed_action, {
    to_if_invoked: [],
    to_if_canceled: [{ halt: true, key_code: "a", modifiers: undefined }],
  });
});

test("defineBindings multiTap: escape tap/hold/doubleTapHold -> 2 var-dance manipulators", () => {
  const rules = defineBindings([
    {
      description: "[␛]        →    Escape / Kill app (on multi-tap)",
      trigger: { keys: ["escape"] },
      timing: { aloneMs: 400, heldThresholdMs: 400 },
      cases: [
        { phase: "release", do: [{ type: "key", key: "escape" }] },
        { phase: "hold", do: [{ type: "shell", command: "kill fg" }] },
        { tapCount: 2, phase: "hold", do: [{ type: "shell", command: "kill all" }] },
      ],
    },
  ]);
  const built = rules[0] as any;
  // varTapTapHold emits [secondTap, firstTap]
  assert.equal(built.manipulatorSources.length, 2);
  const first = built.manipulatorSources.find((m: any) => m.to_if_alone?.some((e: any) => e.key_code === "escape"));
  assert.ok(first, "first tap carries the escape alone action");
});

test("defineBindings auto-derives rule description + slice-label when description absent", () => {
  const rules = defineBindings([
    {
      trigger: { keys: ["x"] },
      conditions: [{ app: { type: "app", bundleId: "com.a", refDesc: "A" } }],
      cases: [{ phase: "press", do: [{ type: "key", key: "y" }] }],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.ruleDescription, "[X]:\n---\n\tOn Tap:\n\t\tIn A:\tEmit 'Y'");
  assert.equal(built.manipulatorSources[0].description, "In A");
});

test("defineBindings auto-derived description omits slice-label when unconditional", () => {
  const rules = defineBindings([
    { trigger: { keys: ["x"] }, cases: [{ phase: "press", do: [{ type: "key", key: "y" }] }] },
  ]);
  const built = rules[0] as any;
  assert.equal(built.ruleDescription, "[X]:\n---\n\tOn Tap:\n\t\tAlways:\tEmit 'Y'");
  assert.equal("description" in built.manipulatorSources[0], false);
});

test("defineBindings: device-specific button alias auto-scopes via nameScope", () => {
  const rules = defineBindings([
    { trigger: { pointer: "shift_button" }, cases: [{ phase: "press", do: [{ type: "noop" }] }] },
  ]);
  const m = (rules[0] as any).manipulatorSources[0];
  const devCond = m.conditions?.find((c: any) => c.type === "device_if");
  assert.deepEqual(devCond?.identifiers, [{ product_id: 49305, vendor_id: 1133, is_pointing_device: true }]);
});

test("defineBindings: global button alias adds no device condition", () => {
  const rules = defineBindings([
    { trigger: { pointer: "left" }, cases: [{ phase: "press", do: [{ type: "noop" }] }] },
  ]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.equal(m.conditions?.some((c: any) => c.type === "device_if") ?? false, false);
});

test("buildTapHold: whileHoldVar sets var on down + suppressCancelFallback empties to_if_canceled", () => {
  const rules = defineBindings([
    {
      trigger: { keys: ["x"] },
      whileHoldVar: { name: "x_down", varDesc: "X down" },
      suppressCancelFallback: true,
      cases: [{ phase: "release", do: [{ type: "key", key: "x" }] }],
    },
  ]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.ok(m.to?.some((e: any) => e.set_variable?.name === "x_down"));
  assert.deepEqual(m.to_delayed_action?.to_if_canceled, []);
});

test("resolveModifiers handles shorthand and explicit objects", () => {
  assert.deepEqual(resolveModifiers(undefined), { mandatory: [], optional: [] });
  assert.deepEqual(resolveModifiers(["left_shift", "CO_S"]), {
    mandatory: ["left_shift", "command", "option", "shift"],
    optional: [],
  });
  assert.deepEqual(
    resolveModifiers({ mandatory: ["left_shift"], optional: ["CO_S"] }),
    {
      mandatory: ["left_shift"],
      optional: ["command", "option", "shift"],
    },
  );
});

test("triggerToFrom with optional modifiers", () => {
  assert.deepEqual(
    triggerToFrom({ keys: ["a"], modifiers: { optional: ["left_shift"] } }) as any,
    { key_code: "a", modifiers: { optional: ["left_shift"] } },
  );
  assert.deepEqual(
    triggerToFrom({
      keys: ["a"],
      modifiers: { mandatory: ["left_command"], optional: ["left_shift"] },
    }) as any,
    {
      key_code: "a",
      modifiers: { mandatory: ["left_command"], optional: ["left_shift"] },
    },
  );
});

test("defineBindings: trigger with optional modifier resolves correctly", () => {
  const rules = defineBindings([
    {
      trigger: { keys: ["escape"], modifiers: { optional: ["left_shift"] } },
      cases: [{ phase: "press", do: [{ type: "key", key: "tab" }] }],
    },
  ]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.deepEqual(m.from.modifiers, { optional: ["left_shift"] });
});

test("Binding type accepts modWhileDown option", () => {
  // Type-level check: modWhileDown is an accepted Binding field. Compiles only
  // if the flag exists on the type. Default-omitted binding must still typecheck.
  const withFlag: Binding = {
    trigger: { keys: ["caps_lock"] },
    modWhileDown: true,
    cases: [{ phase: "press", do: [{ type: "key", key: "left_command" }] }],
  };
  const withoutFlag: Binding = {
    trigger: { keys: ["caps_lock"] },
    cases: [{ phase: "press", do: [{ type: "key", key: "left_command" }] }],
  };
  assert.equal(withFlag.modWhileDown, true);
  assert.equal(withoutFlag.modWhileDown, undefined);
});

test("buildKeyTapHold: modWhileDown emits plain map().to().toIfAlone() (no delayed action)", () => {
  const rules = defineBindings([
    {
      description: "caps base",
      trigger: { keys: ["caps_lock"] },
      modWhileDown: true,
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
      cases: [
        { phase: "press", do: [{ type: "key", key: "left_command", modifiers: ["left_option", "left_control", "left_shift"] }] },
        { phase: "release", do: [{ type: "key", key: "f15", modifiers: ["left_command", "left_option", "left_control", "left_shift"] }] },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 1, "modWhileDown emits a single manipulator");
  const m = built.manipulatorSources[0];
  // NO delayed action, NO held-down
  assert.equal("to_delayed_action" in m, false, "modWhileDown must not emit to_delayed_action");
  assert.equal("to_if_held_down" in m, false, "modWhileDown must not emit to_if_held_down");
  // var set on key-down (to), var cleared on key-up (to_after_key_up).
  // (toSetVar also emits undefined key_up_value/type keys; check name+value
  // directly like the existing whileHoldVar test does.)
  assert.equal(m.to[0].set_variable.name, "caps_lock_pressed");
  assert.equal(m.to[0].set_variable.value, 1);
  assert.equal(m.to_after_key_up[0].set_variable.name, "caps_lock_pressed");
  assert.equal(m.to_after_key_up[0].set_variable.value, 0);
  // held modifier in `to` (after the var)
  assert.deepEqual(m.to[1].key_code, "left_command");
  // tap combo in to_if_alone
  assert.deepEqual(m.to_if_alone[0].key_code, "f15");
});

test("buildGuard: double-tap guard emits two-manipulator arm/fire pattern", () => {
  const rules = defineBindings([
    {
      description: "guard test",
      trigger: { keys: ["q"], modifiers: ["left_command"] },
      cases: [
        {
          phase: "press",
          guard: true,
          do: [{ type: "key", key: "q", modifiers: ["left_command"] }],
        },
      ],
    },
  ]);
  const built = rules[0] as any;
  assert.equal(built.manipulatorSources.length, 2, "guard emits two manipulators");
  const [secondPress, firstPress] = built.manipulatorSources;
  // var name derived: guard_cmd_q
  const varName = "guard_cmd_q";
  // SECOND press: var=1, fires the real combo in `to`, resets var
  assert.deepEqual(secondPress.conditions[0], { type: "variable_if", name: varName, value: 1 });
  // toSetVar emits extra undefined keys; check name/value directly.
  assert.equal(secondPress.to[0].key_code, "q");
  assert.equal(secondPress.to[1].set_variable.name, varName);
  assert.equal(secondPress.to[1].set_variable.value, 0);
  // mandatory from-modifiers
  assert.deepEqual(secondPress.from.modifiers, { mandatory: ["left_command"] });
  // FIRST press: var=0, arms guard, delayed-action disarms
  assert.deepEqual(firstPress.conditions[0], { type: "variable_if", name: varName, value: 0 });
  assert.equal(firstPress.to[0].set_variable.name, varName);
  assert.equal(firstPress.to[0].set_variable.value, 1);
  assert.deepEqual(firstPress.parameters, { "basic.to_delayed_action_delay_milliseconds": 300 });
  assert.equal(firstPress.to_delayed_action.to_if_invoked[0].set_variable.name, varName);
  assert.equal(firstPress.to_delayed_action.to_if_canceled[0].set_variable.name, varName);
  assert.deepEqual(firstPress.from.modifiers, { mandatory: ["left_command"] });
});

test("buildGuard: guardVar/guardMs overrides flow through", () => {
  // The Binding.guardVar / guardMs options override the derived var name and
  // default 300ms timeout. Previously untested passthrough paths.
  const rules = defineBindings([
    {
      description: "override test",
      trigger: { keys: ["q"], modifiers: ["left_command"] },
      guardVar: "custom_guard",
      guardMs: 500,
      cases: [
        {
          phase: "press",
          guard: true,
          do: [{ type: "key", key: "q", modifiers: ["left_command"] }],
        },
      ],
    },
  ]);
  const built = rules[0] as any;
  const [secondPress, firstPress] = built.manipulatorSources;
  // override var name used on both manipulators
  assert.equal(secondPress.conditions[0].name, "custom_guard");
  assert.equal(firstPress.conditions[0].name, "custom_guard");
  // override timeout emitted as the first-press delayed-action delay
  assert.deepEqual(firstPress.parameters, {
    "basic.to_delayed_action_delay_milliseconds": 500,
  });
});

test("buildGuard: throws on a guard mixed with another case (silent-drop footgun)", () => {
  // A guard binding must be exactly one guard() case. Mixing guard with another
  // case would silently drop the other case — fail loudly instead.
  assert.throws(
    () =>
      defineBindings([
        {
          trigger: { keys: ["q"] },
          cases: [
            { phase: "press", guard: true, do: [{ type: "key", key: "q" }] },
            { phase: "hold", do: [{ type: "key", key: "x" }] },
          ],
        },
      ]),
    /exactly one guard\(\) case/,
  );
});

test("buildGuard: throws on multiple guard cases", () => {
  assert.throws(
    () =>
      defineBindings([
        {
          trigger: { keys: ["q"] },
          cases: [
            { phase: "press", guard: true, do: [{ type: "key", key: "q" }] },
            { phase: "press", guard: true, do: [{ type: "key", key: "y" }] },
          ],
        },
      ]),
    /exactly one guard\(\) case/,
  );
});

test("normalizeModifier: strips side prefix and aliases command/control/option", () => {
  // Bespoke deriveGuardVar convention: left_/right_ stripped, then
  // command→cmd, control→ctrl, option→opt; everything else passes through.
  assert.equal(normalizeModifier("left_command"), "cmd");
  assert.equal(normalizeModifier("right_command"), "cmd");
  assert.equal(normalizeModifier("left_control"), "ctrl");
  assert.equal(normalizeModifier("left_option"), "opt");
  assert.equal(normalizeModifier("left_shift"), "shift");
  assert.equal(normalizeModifier("command"), "cmd");
  assert.equal(normalizeModifier("fn"), "fn");
});


test("buildKeyTapHold: modWhileDown without whileHoldVar omits all var signaling", () => {
  // Reachable but previously untested path: modWhileDown with no whileHoldVar
  // must not emit any set_variable / to_after_key_up events — the manipulator
  // is a bare map().to().toIfAlone() with just the held modifier + tap combo.
  const rules = defineBindings([
    {
      trigger: { keys: ["caps_lock"] },
      modWhileDown: true,
      cases: [
        { phase: "press", do: [{ type: "key", key: "f16" }] },
        { phase: "release", do: [{ type: "key", key: "f17" }] },
      ],
    },
  ]);
  const m = (rules[0] as any).manipulatorSources[0];
  assert.equal("to_after_key_up" in m, false, "no whileHoldVar ⇒ no to_after_key_up");
  assert.equal(
    (m.to ?? []).some((e: any) => "set_variable" in e),
    false,
    "no whileHoldVar ⇒ no set_variable in to",
  );
  // held modifier (press) + tap combo (release) still present
  assert.equal(m.to[0].key_code, "f16");
  assert.equal(m.to_if_alone[0].key_code, "f17");
});

test("manipulator generation resolves R.cmd and L.cmd to right_command and left_command", () => {
  const manips = buildManipulators({
    trigger: { keys: ["R.cmd"] },
    cases: [
      { phase: "press", do: [{ type: "key", key: "c", modifiers: ["L.cmd"] }] },
    ],
  });
  const m = manips[0] as any;
  assert.equal(m.from.key_code, "right_command");
  assert.equal(m.to[0].key_code, "c");
  assert.deepEqual(m.to[0].modifiers, ["left_command"]);
});

