import assert from "node:assert/strict";
import test from "node:test";

import { APP_ID } from "../data/registry-app-ids";
import { pythonScriptCommand } from "../core/scripts";
import {
  capsLockChordConfig,
  disabledHotkeys,
  guardRules,
  mouseBindings,
} from "../definitions";
import {
  defineBindings,
  generateDoubleTapGuardRule,
  generateModifierChordRules,
  resolveActionToEvents,
} from "../engine";
import { singleKeyTapHoldBindings } from "../definitions/single-key";
import { modifiedSingleKeyTapHoldBindings } from "../definitions/modified-single-key";
import { VMOD } from "../core/mods";

const buildCapsLockRule = () => generateModifierChordRules(capsLockChordConfig);
const buildDisabledHotkeys = () => defineBindings(disabledHotkeys);
const buildHotkeyGuards = () => guardRules.map((g) => generateDoubleTapGuardRule(g));


const fillPassword = modifiedSingleKeyTapHoldBindings.find(
  (b) =>
    "keys" in b.trigger &&
    b.trigger.keys.includes("slash") &&
    Array.isArray(b.trigger.modifiers) &&
    b.trigger.modifiers.includes("left_command")
)!;

const skimRemaps = modifiedSingleKeyTapHoldBindings.filter(
  (b) => b.conditions?.some((c: any) => c.app === APP_ID.skim)
);

const buildLeftCommandRule = () =>
  defineBindings([singleKeyTapHoldBindings.find((b) => "keys" in b.trigger && b.trigger.keys.includes("left_command"))!])[0];

const buildPasswordsQuickFillRule = () => defineBindings([fillPassword])[0];

const buildSkimCommandRemapRule = () => defineBindings(skimRemaps);

const buildAntinoteRules = () => [buildHotkeyGuards()[1]];

const buildEscapeTapTapHoldRule = () =>
  defineBindings([singleKeyTapHoldBindings.find((b) => "keys" in b.trigger && b.trigger.keys.includes("escape"))!])[0];

const buildCtrlEscapeMonitorRule = () =>
  defineBindings([
    modifiedSingleKeyTapHoldBindings.find(
      (b) =>
        "keys" in b.trigger &&
        b.trigger.keys.includes("escape") &&
        Array.isArray(b.trigger.modifiers) &&
        b.trigger.modifiers.includes("control"),
    )!,
  ])[0];

const buildHomeEndRule = () => {
  const homeEndBindings = [
    ...singleKeyTapHoldBindings.filter((b) => "keys" in b.trigger && (b.trigger.keys.includes("home") || b.trigger.keys.includes("end"))),
    ...modifiedSingleKeyTapHoldBindings.filter((b) => "keys" in b.trigger && (b.trigger.keys.includes("home") || b.trigger.keys.includes("end"))),
  ];
  return defineBindings(homeEndBindings);
};

const buildEnterRules = () => {
  const enterBindings = singleKeyTapHoldBindings.filter(
    (b) => "keys" in b.trigger && (b.trigger.keys.includes("keypad_enter") || b.trigger.keys.includes("return_or_enter")),
  );
  return defineBindings(enterBindings);
};

const buildEqualsRules = () => {
  const equalsBindings = singleKeyTapHoldBindings.filter(
    (b) => "keys" in b.trigger && (b.trigger.keys.includes("keypad_equal_sign") || b.trigger.keys.includes("equal_sign")),
  );
  return defineBindings(equalsBindings);
};

const buildCmdQRule = () => buildHotkeyGuards()[0];

const buildOnePieceClickEnterRule = () => defineBindings([mouseBindings[11]])[0];

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

function toRules(input: any[]): any[] {
  return input.map((item) => toRule(item));
}

test("left command factory keeps dual manipulator behavior", () => {
  const rule = toRule(buildLeftCommandRule());
  assert.match(rule.description, /^\[⌘\]:\n---/);
  assert.equal(rule.manipulators.length, 2);
});

test("left command factory keeps pass-through lcmd and app switch on second tap release", () => {
  const rule = toRule(buildLeftCommandRule());
  const second: any = rule.manipulators[1];
  const first: any = rule.manipulators[0];

  assert.deepEqual(second?.to_if_alone?.[1], {
    key_code: "left_command",
    modifiers: undefined,
  });

  assert.deepEqual(second?.to?.[1], {
    lazy: true,
    modifiers: [],
    key_code: "left_command",
  });

  assert.deepEqual(first?.to?.[0], {
    lazy: true,
    modifiers: [],
    key_code: "left_command",
  });

  assert.deepEqual(first?.to_if_alone?.[1], {
    software_function: {
      open_application: {
        frontmost_application_history_index: 1,
      },
    },
  });

  // Verify to_if_held_down emits left_command so modifier holds are sustained
  const keyCodesInHold = (rule.manipulators[1].to_if_held_down ?? [])
    .filter((e: any) => typeof e.key_code === "string")
    .map((e: any) => e.key_code);
  assert.deepEqual(keyCodesInHold, ["left_command"], "expected left_command in to_if_held_down");
});

test("caps lock factory keeps full complement behavior variants", () => {
  const rule = toRule(buildCapsLockRule());
  assert.equal(
    rule.description,
    "[⇪]        →    VM launcher / COC_ / COCS / CO_S (on hold)",
  );
  assert.equal(rule.manipulators.length, 16);
});

test("cmd-q factory keeps double-tap protection structure", () => {
  const rule = toRule(buildCmdQRule());
  assert.equal(rule.description, "[⌘]+[Q]        →    Quit app (on multi-tap)");
  assert.equal(rule.manipulators.length, 2);
});

test("security disable shortcuts factory keeps all disabled combos", () => {
  const rules = toRules(buildDisabledHotkeys());
  assert.equal(rules.length, 4);
  assert.match(rules[0]?.description, /^\[⌘\]\+\[H\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("word privileges factory keeps single guarded manipulator", () => {
  const rule = toRule(defineBindings([fillPassword])[0]);
  assert.match(rule.description, /^\[⌘\]\+\[\/\]:\n---/);
  const wordManipulator = rule.manipulators[2];
  assert.ok(wordManipulator);
  assert.deepEqual(wordManipulator.conditions, [
    {
      type: "frontmost_application_if",
      description: undefined,
      bundle_identifiers: ["com.microsoft.Word"],
    },
  ]);
});

test("password quick-fill factory keeps secure/non-secure manipulators", () => {
  const rule = toRule(buildPasswordsQuickFillRule());
  assert.match(rule.description, /^\[⌘\]\+\[\/\]:\n---/);
  assert.equal(rule.manipulators.length, 3);

  const roleConditions = rule.manipulators.map(
    (manipulator: any) =>
      (manipulator.conditions ?? []).find(
        (condition: any) =>
          "name" in condition &&
          typeof condition.name === "string" &&
          condition.name.includes("focused_ui_element.role"),
      ) as { name?: string } | undefined,
  );
  const subroleConditions = rule.manipulators.map(
    (manipulator: any) =>
      (manipulator.conditions ?? []).find(
        (condition: any) =>
          "name" in condition &&
          typeof condition.name === "string" &&
          condition.name.includes("focused_ui_element.subrole"),
      ) as { name?: string } | undefined,
  );
  const wordConditions = rule.manipulators.map(
    (manipulator: any) =>
      (manipulator.conditions ?? []).find(
        (condition: any) =>
          "name" in condition && typeof condition.name === "string", // &&
        // condition.name.includes("Word"),
      ) as { name?: string } | undefined,
  );

  assert.deepEqual(
    roleConditions.map((condition: any) => condition?.name),
    [
      "accessibility.focused_ui_element.role_string",
      "accessibility.focused_ui_element.role_string",
      undefined,
    ],
  );
  assert.deepEqual(
    subroleConditions.map((condition: any) => condition?.name),
    [
      "accessibility.focused_ui_element.subrole_string",
      "accessibility.focused_ui_element.subrole_string",
      undefined,
    ],
  );

  const wordCondition = rule.manipulators[2].conditions?.[0];
  assert.deepEqual(wordCondition, {
    type: "frontmost_application_if",
    description: undefined,
    bundle_identifiers: ["com.microsoft.Word"],
  });
});

test("skim command remap factory keeps both remaps", () => {
  const rules = toRules(buildSkimCommandRemapRule());
  assert.equal(rules.length, 2);
  assert.match(rules[0]?.description, /^\[⌘\]\+\[H\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("antinote delete factory keeps double-tap workflow", () => {
  const rule = toRule(buildAntinoteRules()[0]);
  assert.equal(
    rule.description,
    "[⌘]+[D]        →    Delete note (on multi-tap)",
  );
  assert.equal(rule.manipulators.length, 2);
});

test("escape tap-tap-hold factory keeps expected two-stage behavior", () => {
  const rule = toRule(buildEscapeTapTapHoldRule());
  assert.match(rule.description, /^\[␛\]:\n---/);
  assert.equal(rule.manipulators.length, 2);
});

test("ctrl-escape monitor factory keeps single manipulator", () => {
  const rule = toRule(buildCtrlEscapeMonitorRule());
  assert.match(rule.description, /^\[⌃\]\+\[␛\]:\n---/);
  assert.equal(rule.manipulators.length, 1);
});

test("home-end factory keeps four navigation mappings", () => {
  const rules = toRules(buildHomeEndRule());
  assert.equal(rules.length, 4);
  assert.match(rules[0]?.description, /^\[HOME\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("COC_ plus rules factory keeps grouped mappings", () => {
  const hyperLauncherBindings = modifiedSingleKeyTapHoldBindings.filter(
    (b) => Array.isArray(b.trigger.modifiers) && b.trigger.modifiers.join(",") === VMOD.COCS.join(",")
  );
  const rules = toRules(defineBindings(hyperLauncherBindings));
  // "t" lives only in the tap-hold set now (launcher-t was removed to resolve
  // the COCS+t duplication), so the launcher has 4 entries.
  assert.equal(rules.length, 4);
  // Launcher triggers carry the expanded COCS modifiers, so the synthesized
  // trigger segment is the symbol chord (not the "COCS" alias literal).
  assert.ok(
    rules.every((r) => /^\[⌘⌥⌃⇧\]\+\[[^\]]+\]:\n---/.test(r.description)),
  );
  assert.ok(rules.every((r) => r.manipulators.length === 1));
});

test("enter rules factory keeps two keys across two contexts", () => {
  const rules = toRules(buildEnterRules());
  assert.equal(rules.length, 2);
  assert.match(
    rules[0]?.description,
    /^\[⏎\]:\n---/,
  );
});

test("onepiece click-enter factory keeps app-scoped left click remap", () => {
  const rule = toRule(buildOnePieceClickEnterRule());
  assert.match(rule.description, /^Left click:\n---/);
  assert.equal(rule.manipulators.length, 2);

  const manipulator: any = rule.manipulators[0];
  assert.deepEqual(manipulator?.from, {
    pointing_button: "button1",
    modifiers: { optional: [] },
  });
  assert.deepEqual(manipulator?.to_if_alone, [
    { key_code: "return_or_enter", modifiers: undefined, repeat: false },
  ]);

  const appIfCond = manipulator?.conditions.find((c: any) => c.type === "frontmost_application_if");
  assert.deepEqual(appIfCond, {
    type: "frontmost_application_if",
    description: undefined,
    bundle_identifiers: [APP_ID.onePiece.name],
  });
});

test("equals rules factory keeps keypad and regular mappings", () => {
  const rules = toRules(buildEqualsRules());
  assert.equal(rules.length, 2);
  assert.match(rules[0]?.description, /^\[PAD =\]:\n---/);
  assert.match(rules[1]?.description, /^\[=\]:\n---/);
});

test("mouse bindings build device-scoped manipulators via defineBindings", () => {
  const rules = toRules(defineBindings(mouseBindings));
  assert.equal(rules.length, 12);

  // Shift — override (right-button chord) prepended + base tap-hold. The alias
  // auto-scopes to the G502X via nameScope, so device_if lands last.
  assert.equal(rules[0]?.manipulators.length, 2);
  assert.deepEqual(rules[0]?.manipulators[0]?.from, {
    pointing_button: "button5",
  });
  assert.deepEqual(rules[0]?.manipulators[0]?.to, [
    {
      key_code: "down_arrow",
      modifiers: ["control"],
      repeat: false,
    },
  ]);
  const shiftConds = rules[0]?.manipulators[0]?.conditions ?? [];
  assert.equal(
    shiftConds.find((c: any) => c.type === "variable_if")?.name,
    "right_button_pressed",
  );
  assert.ok(shiftConds.find((c: any) => c.type === "device_if"));
  // device_if is the LAST condition (bespoke appended device scope last)
  assert.equal(shiftConds[shiftConds.length - 1]?.type, "device_if");

  // Wheel left — two overrides (reverse-declared) + base carrying wheel guards.
  assert.equal(rules[1]?.manipulators.length, 3);
  assert.deepEqual(rules[1]?.manipulators[0]?.from, {
    pointing_button: "button7",
  });
  assert.deepEqual(rules[1]?.manipulators[0]?.to, [
    {
      key_code: "left_arrow",
      modifiers: ["command", "control", "shift"],
      repeat: false,
    },
  ]);
  const wheelLeftBase = rules[1]?.manipulators[2];
  assert.deepEqual(
    (wheelLeftBase?.conditions ?? []).find(
      (c: any) => c.type === "variable_unless" && c.name === "wheel_down",
    ),
    { type: "variable_unless", name: "wheel_down", value: 1 },
  );

  // Left-button double-tap (right-button held) — two condition-groups (Zen vs
  // non-Zen), each a [secondTap, firstTap] pair = 4 manipulators. The delayed
  // single tap routes to to_if_invoked; the shared firstTapPendingVar gates the
  // second-tap manipulators.
  const doubleTap = rules[10];
  assert.equal(doubleTap?.manipulators.length, 4);
  const firstTap = doubleTap?.manipulators.find((m: any) =>
    (m.to ?? []).some((e: any) => e.set_variable?.name === "left_with_right_first_tap"),
  );
  assert.ok(firstTap, "first-tap (var-setting) manipulator present");
  assert.deepEqual(firstTap?.from, {
    pointing_button: "button1",
    modifiers: { optional: ["any"] },
  });
  assert.ok(
    (firstTap?.to_delayed_action?.to_if_invoked ?? []).some(
      (e: any) => e.pointing_button === "button1",
    ),
    "delayed single tap routed to to_if_invoked",
  );
});

test("resolveActionToEvents flattens sequence into multiple events", () => {
  const events = resolveActionToEvents({
    type: "sequence",
    actions: [
      { type: "key", key: "c", modifiers: ["command"] },
      { type: "shell", command: "echo hello" },
    ],
  });
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { key_code: "c", modifiers: ["command"] });
  assert.deepEqual(events[1], { shell_command: "echo hello" });
});

test("resolveActionToEvents expands vm aliases in key action", () => {
  const vmCOCEvents = resolveActionToEvents({
    type: "key",
    key: "a",
    modifiers: ["COC_"],
  });
  assert.deepEqual((vmCOCEvents[0] as any)?.key_code, "a");
  assert.deepEqual((vmCOCEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
  ]);

  const COCSEvents = resolveActionToEvents({
    type: "key",
    key: "b",
    modifiers: ["COCS"],
  });
  assert.deepEqual((COCSEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
    "shift",
  ]);

  const vmCOSEvents = resolveActionToEvents({
    type: "key",
    key: "c",
    modifiers: ["CO_S"],
  });
  assert.deepEqual((vmCOSEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "shift",
  ]);

  const mixedEvents = resolveActionToEvents({
    type: "key",
    key: "d",
    modifiers: ["COC_", "shift"],
  });
  assert.deepEqual((mixedEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
    "shift",
  ]);
});

test("resolveActionToEvents expands all vm aliases for 2+ combos", () => {
  const vmCases: Array<[string, string[]]> = [
    ["CO__", ["command", "option"]],
    ["C_C_", ["command", "control"]],
    ["C__S", ["command", "shift"]],
    ["_OC_", ["option", "control"]],
    ["_O_S", ["option", "shift"]],
    ["__CS", ["control", "shift"]],
    ["COC_", ["command", "option", "control"]],
    ["CO_S", ["command", "option", "shift"]],
    ["C_CS", ["command", "control", "shift"]],
    ["_OCS", ["option", "control", "shift"]],
    ["COCS", ["command", "option", "control", "shift"]],
  ];

  for (const [alias, expected] of vmCases) {
    const events = resolveActionToEvents({
      type: "key",
      key: "a",
      modifiers: [alias as any],
    });
    assert.deepEqual(
      (events[0] as any)?.modifiers,
      expected,
      `Unexpected expansion for ${alias}`,
    );
  }
});

test("pythonScriptCommand builds uv run invocation", () => {
  const bare = pythonScriptCommand("~/Scripts/foo.py");
  assert.match(bare, /uv run/);
  assert.match(bare, /\$HOME\/Scripts\/foo\.py/);
  assert.doesNotMatch(bare, /--python/);

  const withVenv = pythonScriptCommand("~/Scripts/bar.py", {
    venv: "~/Scripts/.venv/shared_venv",
  });
  assert.match(withVenv, /--python/);
  assert.match(withVenv, /shared_venv\/bin\/python/);
  assert.match(withVenv, /\$HOME\/Scripts\/bar\.py/);

  const withArgs = pythonScriptCommand("~/Scripts/baz.py", {
    args: ["--source", "clipboard"],
  });
  assert.match(withArgs, /'--source'/);
  assert.match(withArgs, /'clipboard'/);
});

test("resolveActionToEvents handles python action", () => {
  const events = resolveActionToEvents({
    type: "python",
    scriptPath: "~/Scripts/foo.py",
    args: ["--dest", "paste"],
  });
  assert.equal(events.length, 1);
  const shellCmd = (events[0] as any)?.shell_command as string;
  assert.match(shellCmd, /uv"? run/);
  assert.match(shellCmd, /\$HOME\/Scripts\/foo\.py/);
  assert.match(shellCmd, /'--dest'/);
  assert.match(shellCmd, /'paste'/);
});

test("resolveActionToEvents returns no events for noop", () => {
  assert.deepEqual(resolveActionToEvents({ type: "noop" } as any), []);
});

// ── app action: AppTarget variants ──────────────────────────────────────────

test("resolveActionToEvents: app with AppRef (type:\"app\") uses bundle_identifier", () => {
  const ref = { type: "app" as const, name: "com.apple.Safari", refDesc: "Safari" };
  const [event] = resolveActionToEvents({ type: "app", ref });
  assert.deepEqual((event as any)?.software_function?.open_application, {
    bundle_identifier: "com.apple.Safari",
  });
});

test("resolveActionToEvents: app with PathRef (type:\"path\") uses file_path", () => {
  const ref = { type: "path" as const, name: "/Applications/Safari.app", refDesc: "Safari" };
  const [event] = resolveActionToEvents({ type: "app", ref });
  assert.deepEqual((event as any)?.software_function?.open_application, {
    file_path: "/Applications/Safari.app",
  });
});

test("resolveActionToEvents: app with raw bundle ID string uses bundle_identifier", () => {
  const [event] = resolveActionToEvents({ type: "app", ref: "com.apple.Safari" });
  assert.deepEqual((event as any)?.software_function?.open_application, {
    bundle_identifier: "com.apple.Safari",
  });
});

test("resolveActionToEvents: app with raw absolute path string uses file_path", () => {
  const [event] = resolveActionToEvents({ type: "app", ref: "/Applications/Safari.app" });
  assert.deepEqual((event as any)?.software_function?.open_application, {
    file_path: "/Applications/Safari.app",
  });
});

test("resolveActionToEvents: app with raw .app-suffixed string uses file_path", () => {
  const [event] = resolveActionToEvents({ type: "app", ref: "Safari.app" });
  assert.deepEqual((event as any)?.software_function?.open_application, {
    file_path: "Safari.app",
  });
});
