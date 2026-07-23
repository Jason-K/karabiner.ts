import assert from "node:assert/strict";
import test from "node:test";

import { pythonScriptCommand } from "../core/scripts";
import { DEVICE_IDENTIFIERS, appRegistry } from "../data";
import {
  buildAntinoteRules,
  buildCapsLockRule,
  buildCmdQRule,
  buildCtrlEscapeMonitorRule,
  buildDisableHideMinimizeRule,
  buildEnterRules,
  buildEqualsRules,
  buildEscapeTapTapHoldRule,
  buildHomeEndRule,
  buildHyperLauncherRules,
  buildLeftCommandRule,
  buildOnePieceClickEnterRule,
  buildPasswordsQuickFillRule,
  buildSkimCommandRemapRule,
  buildWordPrivilegesRule,
  mouseDeviceMappings,
} from "../definitions";
import {
  buildMouseRules,
  resolveActionToEvents,
} from "../engine";

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
});

test("caps lock factory keeps full complement behavior variants", () => {
  const rule = toRule(buildCapsLockRule());
  assert.equal(
    rule.description,
    "[⇪]        →    VM launcher / vmCOC_ / vmCOCS / vmCO_S (on hold)",
  );
  assert.equal(rule.manipulators.length, 16);
});

test("cmd-q factory keeps double-tap protection structure", () => {
  const rule = toRule(buildCmdQRule());
  assert.equal(rule.description, "[←⌘]+[Q]        →    Quit app (on multi-tap)");
  assert.equal(rule.manipulators.length, 2);
});

test("security disable shortcuts factory keeps all disabled combos", () => {
  const rules = toRules(buildDisableHideMinimizeRule());
  assert.equal(rules.length, 3);
  assert.match(rules[0]?.description, /^\[←⌘\]\+\[H\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("word privileges factory keeps single guarded manipulator", () => {
  const rule = toRule(buildWordPrivilegesRule());
  assert.match(rule.description, /^\[←⌘\]\+\[\/\]:\n---/);
  assert.equal(rule.manipulators.length, 1);
});

test("password quick-fill factory keeps secure/non-secure manipulators", () => {
  const rule = toRule(buildPasswordsQuickFillRule());
  assert.match(rule.description, /^\[←⌘\]\+\[\/\]:\n---/);
  assert.equal(rule.manipulators.length, 2);

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

  assert.deepEqual(
    roleConditions.map((condition: any) => condition?.name),
    [
      "accessibility.focused_ui_element.role_string",
      "accessibility.focused_ui_element.role_string",
    ],
  );
  assert.deepEqual(
    subroleConditions.map((condition: any) => condition?.name),
    [
      "accessibility.focused_ui_element.subrole_string",
      "accessibility.focused_ui_element.subrole_string",
    ],
  );
});

test("skim command remap factory keeps both remaps", () => {
  const rules = toRules(buildSkimCommandRemapRule());
  assert.equal(rules.length, 2);
  assert.match(rules[0]?.description, /^\[←⌘\]\+\[H\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("antinote delete factory keeps double-tap workflow", () => {
  const rule = toRule(buildAntinoteRules()[0]);
  assert.equal(
    rule.description,
    "[←⌘]+[D]        →    Delete note (on multi-tap)",
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
  assert.match(rule.description, /^\[←⌃\]\+\[␛\]:\n---/);
  assert.equal(rule.manipulators.length, 1);
});

test("home-end factory keeps four navigation mappings", () => {
  const rules = toRules(buildHomeEndRule());
  assert.equal(rules.length, 4);
  assert.match(rules[0]?.description, /^\[HOME\]:\n---/);
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("vmCOC_ plus rules factory keeps grouped mappings", () => {
  const rules = toRules(buildHyperLauncherRules());
  // "t" lives only in the tap-hold set now (launcher-t was removed to resolve
  // the vmCOCS+t duplication), so the launcher has 4 entries.
  assert.equal(rules.length, 4);
  // Launcher triggers carry the expanded vmCOCS modifiers, so the synthesized
  // trigger segment is the symbol chord (not the "vmCOCS" alias literal).
  assert.ok(rules.every((r) => /^\[←⌘←⌥←⌃←⇧\]\+\[[^\]]+\]:\n---/.test(r.description)));
  assert.ok(rules.every((r) => r.manipulators.length === 1));
});

test("enter rules factory keeps two keys across two contexts", () => {
  const rules = toRules(buildEnterRules());
  assert.equal(rules.length, 4);
  assert.equal(
    rules[0]?.description,
    "[⏎]        →    Evaluate selection (on hold)",
  );
});

test("onepiece click-enter factory keeps app-scoped left click remap", () => {
  const rule = toRule(buildOnePieceClickEnterRule());
  const manipulator: any = rule.manipulators[0];
  assert.match(rule.description, /^Left click:\n---/);
  assert.equal(rule.manipulators.length, 1);
  assert.deepEqual(manipulator?.from, {
    pointing_button: "button1",
  });
  assert.deepEqual(manipulator?.to, [
    { key_code: "return_or_enter", modifiers: undefined },
  ]);
  assert.deepEqual(manipulator?.conditions, [
    {
      type: "frontmost_application_if",
      description: undefined,
      bundle_identifiers: [appRegistry.onePiece.name],
    },
  ]);
});

test("equals rules factory keeps keypad and regular mappings", () => {
  const rules = toRules(buildEqualsRules());
  assert.equal(rules.length, 2);
  assert.deepEqual(
    rules.map((rule) => rule.description),
    [
      "[PAD =]        →    Quick date (on hold)",
      "[=]        →    Quick date (on hold)",
    ],
  );
});

test("mouse rules factory builds declarative per-device mappings", () => {
  const rules = toRules(buildMouseRules(mouseDeviceMappings));
  assert.equal(rules.length, 12);
  assert.equal(
    rules[0]?.description,
    "Logitech G502 X: [SHIFT] Mission Control (tap) / Rectangle key (hold)",
  );
  // Shift mapping now declares an override (right_button_pressed =>
  // ctrl+down_arrow), which the engine emits as a standalone prepended
  // manipulator, plus the base tap-hold manipulator.
  assert.equal(rules[0]?.manipulators.length, 2);
  assert.deepEqual(rules[0]?.manipulators[0]?.from, {
    pointing_button: "button5",
  });

  assert.equal(
    rules[1]?.description,
    "Logitech G502 X: [WHEEL LEFT] Move window left/up (hold) / Change workspace (hold in Zen)",
  );
  assert.equal(rules[1]?.manipulators.length, 3);
  const wheelLeftOverride: any = rules[1]?.manipulators[0];
  assert.deepEqual(rules[1]?.manipulators[0]?.from, {
    pointing_button: "button7",
  });
    assert.deepEqual(wheelLeftOverride?.to, [
      {
        key_code: "left_arrow",
        modifiers: ["left_command", "left_control", "left_shift"],
        repeat: false,
      },
    ]);
  assert.deepEqual(rules[1]?.manipulators[0]?.conditions, [
    {
      type: "frontmost_application_if",
      description: undefined,
      bundle_identifiers: [appRegistry.browser.name],
    },
    {
      type: "variable_if",
      name: "right_button_pressed",
      value: 1,
    },
    {
      type: "variable_if",
      name: "wheel_down",
      value: 0,
    },
    {
      type: "device_if",
      description: undefined,
      identifiers: [
        {
          product_id: DEVICE_IDENTIFIERS.logitechG502X.product_id,
          vendor_id: DEVICE_IDENTIFIERS.logitechG502X.vendor_id,
        },
      ],
    },
  ]);
  assert.deepEqual(
    rules[1]?.manipulators
      ?.flatMap((manipulator: any) => manipulator?.conditions ?? [])
      ?.find((condition: any) => condition?.type === "variable_unless"),
    {
      type: "variable_unless",
      name: "wheel_down",
      value: 1,
    },
  );

  assert.equal(
    rules[2]?.description,
    "Logitech G502 X: [WHEEL RIGHT] Move window right/down (hold) / Change workspace (hold in Zen)",
  );
  assert.equal(rules[2]?.manipulators.length, 2);
  const wheelRightOverride: any = rules[2]?.manipulators[0];
  assert.deepEqual(rules[2]?.manipulators[0]?.from, {
    pointing_button: "button8",
  });
  assert.deepEqual(wheelRightOverride?.to, [
    {
      key_code: "right_arrow",
      modifiers: ["left_command", "left_control", "left_shift"],
      repeat: false,
    },
  ]);
});

test("resolveActionToEvents flattens sequence into multiple events", () => {
  const events = resolveActionToEvents({
    type: "sequence",
    actions: [
      { type: "key", key: "c", modifiers: ["left_command"] },
      { type: "shell", command: "echo hello" },
    ],
  });
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { key_code: "c", modifiers: ["left_command"] });
  assert.deepEqual(events[1], { shell_command: "echo hello" });
});

test("resolveActionToEvents expands vm aliases in key action", () => {
  const vmCOCEvents = resolveActionToEvents({
    type: "key",
    key: "a",
    modifiers: ["vmCOC_"],
  });
  assert.deepEqual((vmCOCEvents[0] as any)?.key_code, "a");
  assert.deepEqual((vmCOCEvents[0] as any)?.modifiers, [
    "left_command",
    "left_option",
    "left_control",
  ]);

  const vmCOCSEvents = resolveActionToEvents({
    type: "key",
    key: "b",
    modifiers: ["vmCOCS"],
  });
  assert.deepEqual((vmCOCSEvents[0] as any)?.modifiers, [
    "left_command",
    "left_option",
    "left_control",
    "left_shift",
  ]);

  const vmCOSEvents = resolveActionToEvents({
    type: "key",
    key: "c",
    modifiers: ["vmCO_S"],
  });
  assert.deepEqual((vmCOSEvents[0] as any)?.modifiers, [
    "left_command",
    "left_option",
    "left_shift",
  ]);

  const mixedEvents = resolveActionToEvents({
    type: "key",
    key: "d",
    modifiers: ["vmCOC_", "shift"],
  });
  assert.deepEqual((mixedEvents[0] as any)?.modifiers, [
    "left_command",
    "left_option",
    "left_control",
    "shift",
  ]);
});

test("resolveActionToEvents expands all vm aliases for 2+ combos", () => {
  const vmCases: Array<[string, string[]]> = [
    ["vmCO__", ["left_command", "left_option"]],
    ["vmC_C_", ["left_command", "left_control"]],
    ["vmC__S", ["left_command", "left_shift"]],
    ["vm_OC_", ["left_option", "left_control"]],
    ["vm_O_S", ["left_option", "left_shift"]],
    ["vm__CS", ["left_control", "left_shift"]],
    ["vmCOC_", ["left_command", "left_option", "left_control"]],
    ["vmCO_S", ["left_command", "left_option", "left_shift"]],
    ["vmC_CS", ["left_command", "left_control", "left_shift"]],
    ["vm_OCS", ["left_option", "left_control", "left_shift"]],
    ["vmCOCS", ["left_command", "left_option", "left_control", "left_shift"]],
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
  assert.match(shellCmd, /uv run/);
  assert.match(shellCmd, /\$HOME\/Scripts\/foo\.py/);
  assert.match(shellCmd, /'--dest'/);
  assert.match(shellCmd, /'paste'/);
});

test("resolveActionToEvents returns no events for noop", () => {
  assert.deepEqual(resolveActionToEvents({ type: "noop" } as any), []);
});
