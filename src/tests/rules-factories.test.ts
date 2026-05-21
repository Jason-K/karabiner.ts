import assert from "node:assert/strict";
import test from "node:test";

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
  buildRightOptionLauncherRules,
  buildSkimCommandRemapRule,
  buildWordPrivilegesRule,
  mouseDeviceMappings,
} from "../definitions";
import { buildMouseRules, generateAppScopedRemapRules, resolveActionToEvents } from "../engine";
import { pythonScriptCommand } from "../core/scripts";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

function toRules(input: any[]): any[] {
  return input.map((item) => toRule(item));
}

test("left command factory keeps dual manipulator behavior", () => {
  const rule = toRule(buildLeftCommandRule());
  assert.equal(
    rule.description,
    "[←⌘]        →    Tap/double-tap/hold handler (on multi-tap)",
  );
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

test("caps lock factory keeps three behavior variants", () => {
  const rule = toRule(buildCapsLockRule());
  assert.equal(
    rule.description,
    "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
  );
  assert.equal(rule.manipulators.length, 3);
});

test("cmd-q factory keeps double-tap protection structure", () => {
  const rule = toRule(buildCmdQRule());
  assert.equal(rule.description, "[←⌘]+[Q]        →    Quit app (on multi-tap)");
  assert.equal(rule.manipulators.length, 2);
});

test("right-option app factory keeps full launcher set", () => {
  const rules = toRules(buildRightOptionLauncherRules());
  assert.equal(rules.length, 10);
  assert.equal(rules[0]?.description, "[→⌥]+[A]        →    Antinote (on tap)");
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("security disable shortcuts factory keeps all disabled combos", () => {
  const rules = toRules(buildDisableHideMinimizeRule());
  assert.equal(rules.length, 3);
  assert.equal(
    rules[0]?.description,
    "[←⌘]+[H]        →    Disabled hide shortcut (on tap)",
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("word privileges factory keeps single guarded manipulator", () => {
  const rule = toRule(buildWordPrivilegesRule());
  assert.equal(
    rule.description,
    "[←⌘]+[/]        →    Copy document name and elevate privileges (on tap)",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("password quick-fill factory keeps secure/non-secure manipulators", () => {
  const rule = toRule(buildPasswordsQuickFillRule());
  assert.equal(
    rule.description,
    "[←⌘]+[/]        →    Quick fill password (on tap)",
  );
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
  assert.equal(
    rules[0]?.description,
    "[←⌘]+[H]        →    Skim command H remap (on tap)",
  );
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
  assert.equal(
    rule.description,
    "[ESC]        →    Escape / Kill app (on multi-tap)",
  );
  assert.equal(rule.manipulators.length, 2);
});

test("ctrl-escape monitor factory keeps single manipulator", () => {
  const rule = toRule(buildCtrlEscapeMonitorRule());
  assert.equal(
    rule.description,
    "[←⌃]+[ESC]        →    Activity Monitor / Process Spy (on hold)",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("home-end factory keeps four navigation mappings", () => {
  const rules = toRules(buildHomeEndRule());
  assert.equal(rules.length, 4);
  assert.equal(
    rules[0]?.description,
    "[HOME]        →    Move to line start (on tap)",
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("hyper plus rules factory keeps grouped mappings", () => {
  const rules = toRules(buildHyperLauncherRules());
  assert.equal(rules.length, 5);
  assert.deepEqual(
    rules.map((rule) => rule.description),
    [
      "[✦]+[S]        →    Format selection (on tap)",
      "[✦]+[T]        →    New Typinator rule (on tap)",
      "[✦]+[;]        →    Open System Settings (on tap)",
      "[✦]+[F12]        →    Edit last Typinator rule (on tap)",
      "[✦]+[ESC]        →    Open Activity Monitor (on tap)",
    ],
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("enter rules factory keeps two keys across two contexts", () => {
  const rules = toRules(buildEnterRules());
  assert.equal(rules.length, 4);
  assert.equal(
    rules[0]?.description,
    "[RETURN]        →    Evaluate selection (on hold)",
  );
});

test("onepiece click-enter factory keeps app-scoped left click remap", () => {
  const rule = toRule(buildOnePieceClickEnterRule());
  const manipulator: any = rule.manipulators[0];
  assert.equal(
    rule.description,
    "[BUTTON1]        →    OnePiece left click -> enter (on tap)",
  );
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
      bundle_identifiers: [appRegistry.onePiece],
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
  assert.equal(rules.length, 10);
  assert.equal(
    rules[0]?.description,
    "Logitech G502 X: Mission Control (tap) / Rectangle key (hold)",
  );
  assert.equal(rules[0]?.manipulators.length, 1);
  assert.deepEqual(rules[0]?.manipulators[0]?.from, {
    pointing_button: "button5",
  });

  assert.equal(
    rules[1]?.description,
    "Logitech G502 X: Rectangle fill-left (hold)",
  );
  assert.equal(rules[1]?.manipulators.length, 2);
  const wheelLeftOverride: any = rules[1]?.manipulators[0];
  assert.deepEqual(rules[1]?.manipulators[0]?.from, {
    pointing_button: "button7",
  });
    assert.deepEqual(wheelLeftOverride?.to, [
      {
        shell_command: `osascript -e 'tell application "System Events" to key code 33 using {control down, shift down}'`,
      },
    ]);
  assert.deepEqual(rules[1]?.manipulators[0]?.conditions, [
    {
      type: "frontmost_application_if",
      description: undefined,
      bundle_identifiers: [appRegistry.browser],
    },
    {
      type: "variable_if",
      name: "right_button_pressed",
      value: 1,
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
    rules[1]?.manipulators[1]?.conditions?.find(
      (condition: any) => condition?.type === "variable_unless",
    ),
    {
      type: "variable_unless",
      name: "middle_front_pressed",
      value: 1,
    },
  );

  assert.equal(
    rules[2]?.description,
    "Logitech G502 X: Rectangle fill-right (hold)",
  );
  assert.equal(rules[2]?.manipulators.length, 2);
  const wheelRightOverride: any = rules[2]?.manipulators[0];
  assert.deepEqual(rules[2]?.manipulators[0]?.from, {
    pointing_button: "button8",
  });
  assert.deepEqual(wheelRightOverride?.to, [
    {
      shell_command: `osascript -e 'tell application "System Events" to key code 30 using {control down, shift down}'`,
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

test("generateAppScopedRemapRules attaches ifApp condition to each rule", () => {
  const rules = toRules(
    generateAppScopedRemapRules([
      {
        from: { key: "h", modifiers: ["left_command"] },
        description: "Test remap",
        to: { key: "h", modifiers: ["left_command", "left_control"] },
        ifApp: "com.example.App",
      },
    ]),
  );
  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.description, "[←⌘]+[H]        →    Test remap (on tap)");
  const manipulator: any = rules[0]?.manipulators[0];
  assert.ok(
    manipulator?.conditions?.some(
      (c: any) => c.type === "frontmost_application_if",
    ),
    "Missing frontmost_application_if condition",
  );
});

test("resolveActionToEvents expands hyper/super/meh modifiers in key action", () => {
  const hyperEvents = resolveActionToEvents({
    type: "key",
    key: "a",
    modifiers: ["hyper"],
  });
  assert.deepEqual((hyperEvents[0] as any)?.key_code, "a");
  assert.deepEqual((hyperEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
  ]);

  const superEvents = resolveActionToEvents({
    type: "key",
    key: "b",
    modifiers: ["super"],
  });
  assert.deepEqual((superEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
    "shift",
  ]);

  const mehEvents = resolveActionToEvents({
    type: "key",
    key: "c",
    modifiers: ["meh"],
  });
  assert.deepEqual((mehEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "shift",
  ]);

  const mixedEvents = resolveActionToEvents({
    type: "key",
    key: "d",
    modifiers: ["hyper", "shift"],
  });
  assert.deepEqual((mixedEvents[0] as any)?.modifiers, [
    "command",
    "option",
    "control",
    "shift",
  ]);
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
