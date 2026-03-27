import assert from "node:assert/strict";
import test from "node:test";

import { buildAntinoteDeleteRule } from "./antinote";
import { buildCapsLockRule } from "./caps-lock";
import { buildCmdQRule } from "./cmd-q";
import {
    buildCtrlEscapeMonitorRule,
    buildEscapeTapTapHoldRule,
} from "./escape-monitor";
import { buildLeftCommandRule } from "./left-command";
import { buildRightOptionAppsRule } from "./right-option-apps";
import {
    buildDisableHideMinimizeRule,
    buildPasswordsQuickFillRule,
    buildWordPrivilegesRule,
} from "./security";
import {
    buildSkimAppleScriptHoldRule,
    buildSkimCommandRemapRule,
} from "./skim";
import {
    buildEnterRules,
    buildEqualsRules,
    buildGraveAccentHoldRule,
    buildHomeEndRule,
    buildHyperF12Rule,
} from "./special-keys";

test("left command factory keeps dual manipulator behavior", () => {
  const rule = buildLeftCommandRule().build();
  assert.equal(rule.description, "LCMD - left ⌘ (tap/double-tap/hold)");
  assert.equal(rule.manipulators.length, 2);
});

test("caps lock factory keeps three behavior variants", () => {
  const rule = buildCapsLockRule().build();
  assert.equal(
    rule.description,
    "CAPS - HSLAUNCHER (alone), HYPER (hold), SUPER (with shift), MEH (with ctrl)",
  );
  assert.equal(rule.manipulators.length, 3);
});

test("cmd-q factory keeps double-tap protection structure", () => {
  const rule = buildCmdQRule().build();
  assert.equal(rule.description, "CMD-Q requires double-tap (300ms window)");
  assert.equal(rule.manipulators.length, 2);
});

test("right-option app factory keeps full launcher set", () => {
  const rule = buildRightOptionAppsRule((path) => `open ${path}`).build();
  assert.equal(rule.description, "Right_Option + Key - App launch or focus");
  assert.equal(rule.manipulators.length, 10);
});

test("security disable shortcuts factory keeps all disabled combos", () => {
  const rule = buildDisableHideMinimizeRule().build();
  assert.equal(rule.description, "DISABLE - Hide/Minimize shortcuts");
  assert.equal(rule.manipulators.length, 3);
});

test("word privileges factory keeps single guarded manipulator", () => {
  const rule = buildWordPrivilegesRule().build();
  assert.equal(
    rule.description,
    "WORD - CMD+/ copy document name and elevate privileges",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("password quick-fill factory keeps secure/non-secure manipulators", () => {
  const rule = buildPasswordsQuickFillRule().build();
  assert.equal(rule.description, "PASSWORDS - CMD+/ quick fill");
  assert.equal(rule.manipulators.length, 2);
});

test("skim command remap factory keeps both remaps", () => {
  const rule = buildSkimCommandRemapRule().build();
  assert.equal(rule.description, "SKIM - CMD+H/U");
  assert.equal(rule.manipulators.length, 2);
});

test("skim hold factory keeps number-row hold actions", () => {
  const rule = buildSkimAppleScriptHoldRule().build();
  assert.equal(rule.description, "SKIM - 1/2/3 hold AppleScripts");
  assert.equal(rule.manipulators.length, 3);
});

test("antinote delete factory keeps double-tap workflow", () => {
  const rule = buildAntinoteDeleteRule().build();
  assert.equal(rule.description, "ANTINOTE - CMD+D+D to delete note");
  assert.equal(rule.manipulators.length, 2);
});

test("escape tap-tap-hold factory keeps expected two-stage behavior", () => {
  const rule = buildEscapeTapTapHoldRule().build();
  assert.equal(
    rule.description,
    "ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)",
  );
  assert.equal(rule.manipulators.length, 2);
});

test("ctrl-escape monitor factory keeps single manipulator", () => {
  const rule = buildCtrlEscapeMonitorRule().build();
  assert.equal(
    rule.description,
    "LEFT CTRL + ESCAPE - Activity Monitor (tap), Process Spy (hold)",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("home-end factory keeps four navigation mappings", () => {
  const rule = buildHomeEndRule().build();
  assert.equal(rule.description, "HOME/END - Mac-style navigation");
  assert.equal(rule.manipulators.length, 4);
});

test("hyper f12 factory keeps single manipulator", () => {
  const rule = buildHyperF12Rule().build();
  assert.equal(rule.description, "HYPER+F12 - Edit last Typinator rule");
  assert.equal(rule.manipulators.length, 1);
});

test("grave accent hold factory keeps single manipulator", () => {
  const rule = buildGraveAccentHoldRule().build();
  assert.equal(
    rule.description,
    "grave_accent_and_tilde tap/hold -> grave or hyper+f5",
  );
  assert.equal(rule.manipulators.length, 1);
});

test("enter rules factory keeps two keys across two contexts", () => {
  const rules = buildEnterRules().map((r) => r.build());
  assert.equal(rules.length, 4);
});

test("equals rules factory keeps keypad and regular mappings", () => {
  const rules = buildEqualsRules().map((r) => r.build());
  assert.equal(rules.length, 2);
});
