import assert from "node:assert/strict";
import test from "node:test";

import { mouseDeviceMappings } from "../mappings/mouse";
import { buildAntinoteDeleteRule } from "../rules/antinote";
import {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule,
} from "../rules/escape-monitor";
import {
    buildCapsLockRule,
} from "../rules/hyper-chords";
import { buildHyperPlusRules } from "../rules/hyper-plus";
import {
    buildCmdQRule,
    buildLeftCommandRule,
} from "../rules/left-command-chords";
import { buildMouseRules } from "../rules/mouse";
import { buildRightOptionAppsRule } from "../rules/right-option-launchers";
import {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    buildWordPrivilegesRule,
} from "../rules/security";
import { buildSkimCommandRemapRule } from "../rules/skim";
import {
  buildEnterRules,
  buildEqualsRules,
  buildGraveAccentHoldRule,
  buildHomeEndRule,
  buildOnePieceClickEnterRule,
} from "../rules/special-keys";

test("left command factory keeps dual manipulator behavior", () => {
  const rule = buildLeftCommandRule().build();
  assert.equal(
    rule.description,
    "[←⌘]        →    App history switcher (on multi-tap)",
  );
  assert.equal(rule.manipulators.length, 10);
});

test("caps lock factory keeps three behavior variants", () => {
  const rule = buildCapsLockRule().build();
  assert.equal(
    rule.description,
    "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
  );
  assert.equal(rule.manipulators.length, 3);
});

test("cmd-q factory keeps double-tap protection structure", () => {
  const rule = buildCmdQRule().build();
  assert.equal(rule.description, "[←⌘]+[Q]        →    Quit app (on multi-tap)");
  assert.equal(rule.manipulators.length, 2);
});

test("right-option app factory keeps full launcher set", () => {
  const rules = buildRightOptionAppsRule((path) => `open ${path}`).map((r) =>
    r.build(),
  );
  assert.equal(rules.length, 10);
  assert.equal(rules[0]?.description, "[→⌥]+[A]        →    Antinote (on tap)");
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("security disable shortcuts factory keeps all disabled combos", () => {
  const rules = buildDisableHideMinimizeRule().map((r) => r.build());
  assert.equal(rules.length, 3);
  assert.equal(
    rules[0]?.description,
    "[←⌘]+[H]        →    Disabled hide shortcut (on tap)",
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("word privileges factory keeps single guarded manipulator", () => {
  const rule = buildWordPrivilegesRule().build();
  assert.equal(
    rule.description,
    "[←⌘]+[/]        →    Copy document name and elevate privileges (on tap)",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("password quick-fill factory keeps secure/non-secure manipulators", () => {
  const rule = buildPasswordsQuickFillRule().build();
  assert.equal(
    rule.description,
    "[←⌘]+[/]        →    Quick fill password (on tap)",
  );
  assert.equal(rule.manipulators.length, 2);

  const roleConditions = rule.manipulators.map((manipulator) =>
    (manipulator.conditions ?? []).find(
      (condition) =>
        "name" in condition &&
        typeof condition.name === "string" &&
        condition.name.includes("focused_ui_element.role"),
    ) as { name?: string } | undefined,
  );
  const subroleConditions = rule.manipulators.map((manipulator) =>
    (manipulator.conditions ?? []).find(
      (condition) =>
        "name" in condition &&
        typeof condition.name === "string" &&
        condition.name.includes("focused_ui_element.subrole"),
    ) as { name?: string } | undefined,
  );

  assert.deepEqual(
    roleConditions.map((condition) => condition?.name),
    [
      "accessibility.focused_ui_element.role_string",
      "accessibility.focused_ui_element.role_string",
    ],
  );
  assert.deepEqual(
    subroleConditions.map((condition) => condition?.name),
    [
      "accessibility.focused_ui_element.subrole_string",
      "accessibility.focused_ui_element.subrole_string",
    ],
  );
});

test("skim command remap factory keeps both remaps", () => {
  const rules = buildSkimCommandRemapRule().map((r) => r.build());
  assert.equal(rules.length, 2);
  assert.equal(
    rules[0]?.description,
    "[←⌘]+[H]        →    Skim command H remap (on tap)",
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("antinote delete factory keeps double-tap workflow", () => {
  const rule = buildAntinoteDeleteRule().build();
  assert.equal(
    rule.description,
    "[←⌘]+[D]        →    Delete note (on multi-tap)",
  );
  assert.equal(rule.manipulators.length, 2);
});

test("escape tap-tap-hold factory keeps expected two-stage behavior", () => {
  const rule = buildEscapeTapTapHoldRule().build();
  assert.equal(
    rule.description,
    "[ESC]        →    Escape / Kill app (on multi-tap)",
  );
  assert.equal(rule.manipulators.length, 2);
});

test("ctrl-escape monitor factory keeps single manipulator", () => {
  const rule = buildCtrlEscapeMonitorRule().build();
  assert.equal(
    rule.description,
    "[←⌃]+[ESC]        →    Activity Monitor / Process Spy (on hold)",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("home-end factory keeps four navigation mappings", () => {
  const rules = buildHomeEndRule().map((r) => r.build());
  assert.equal(rules.length, 4);
  assert.equal(
    rules[0]?.description,
    "[HOME]        →    Move to line start (on tap)",
  );
  assert.ok(rules.every((rule) => rule.manipulators.length === 1));
});

test("hyper plus rules factory keeps grouped mappings", () => {
  const rules = buildHyperPlusRules().map((r) => r.build());
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
test("grave accent hold factory keeps single manipulator", () => {
  const rule = buildGraveAccentHoldRule().build();
  assert.equal(rule.description, "[~]        →    Hyper F5 (on hold)");
  assert.equal(rule.manipulators.length, 1);
});

test("enter rules factory keeps two keys across two contexts", () => {
  const rules = buildEnterRules().map((r) => r.build());
  assert.equal(rules.length, 4);
  assert.equal(
    rules[0]?.description,
    "[RETURN]        →    Evaluate selection (on hold)",
  );
});

test("onepiece click-enter factory keeps app-scoped left click remap", () => {
  const rule = buildOnePieceClickEnterRule().build();
  assert.equal(rule.description, "OnePiece: left click -> enter");
  assert.equal(rule.manipulators.length, 1);
  assert.deepEqual(rule.manipulators[0]?.from, {
    pointing_button: "button1",
  });
  assert.deepEqual(rule.manipulators[0]?.to, [
    { key_code: "return_or_enter", modifiers: undefined },
  ]);
  assert.deepEqual(rule.manipulators[0]?.conditions, [
    {
      type: "frontmost_application_if",
      description: undefined,
      bundle_identifiers: ["jp.fuji.1Piece"],
    },
  ]);
});

test("equals rules factory keeps keypad and regular mappings", () => {
  const rules = buildEqualsRules().map((r) => r.build());
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
  const rules = buildMouseRules(mouseDeviceMappings).map((r) => r.build());
  assert.equal(rules.length, 7);
  assert.equal(
    rules[0]?.description,
    "Logitech G502 X: ctrl+up (tap) / ctrl+opt+shift down (hold)",
  );
  assert.equal(rules[0]?.manipulators.length, 1);
  assert.deepEqual(rules[0]?.manipulators[0]?.from, {
    pointing_button: "button5",
  });

  assert.equal(
    rules[1]?.description,
    "Logitech G502 X: Rectangle fill-left (tap) / prev-display (hold)",
  );
  assert.deepEqual(rules[1]?.manipulators[0]?.from, {
    pointing_button: "button7",
  });
});
